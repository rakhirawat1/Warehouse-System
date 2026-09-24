import type {
  ChatCompletionMessageParam,
  ChatCompletionTool,
} from "groq-sdk/resources/chat/completions";

import { groq } from "@/lib/ai/groq";
import type { Actor } from "@/lib/auth/guards";
import { can, type Permission, type Role } from "@/lib/auth/permissions";

import { buildSystemPrompt } from "./prompts";
import {
  MAX_HISTORY,
  toolArgs,
  toolDefinitions,
  type ChatMessage,
  type ToolName,
} from "./schemas";
import * as tools from "./tools";

const MODEL = "openai/gpt-oss-20b";

/** Tool rounds per question: enough to search, then look up locations. */
const MAX_TOOL_ROUNDS = 3;

type ToolEntry = {
  /** Required permission; tools without one are open to every signed-in role. */
  permission?: Permission;
  run: (args: Record<string, unknown>) => Promise<unknown>;
  /** Follow-ups used when the model does not supply usable suggestions. */
  followUps: string[];
};

const TOOLS: Record<ToolName, ToolEntry> = {
  searchItems: {
    run: (args) => tools.searchItems(args.search as string),
    followUps: [
      "Where is this item stored?",
      "Which items still have units to allocate?",
    ],
  },
  getItemAllocations: {
    run: (args) => tools.getItemAllocations(args.itemSearch as string),
    followUps: [
      "Which storage spaces still have room for this item?",
      "Which items are split across several storage spaces?",
    ],
  },
  getUnallocatedItems: {
    run: () => tools.getUnallocatedItems(),
    followUps: [
      "Which storage spaces have available capacity?",
      "Which items are fully stored?",
    ],
  },
  getOutOfStockItems: {
    run: () => tools.getOutOfStockItems(),
    followUps: [
      "Which items still have units to allocate?",
      "Which items are split across several storage spaces?",
    ],
  },
  getSplitItems: {
    run: () => tools.getSplitItems(),
    followUps: [
      "Which warehouse is most utilised?",
      "Which items are fully stored?",
    ],
  },
  getWarehouses: {
    run: () => tools.getWarehouses(),
    followUps: [
      "Which storage spaces are nearly full?",
      "Which warehouse has the most available capacity?",
    ],
  },
  getStorageSpaceAvailability: {
    run: (args) =>
      tools.getStorageSpaceAvailability(args.warehouseName as string | undefined),
    followUps: [
      "Which items still have units to allocate?",
      "Show capacity for every warehouse.",
    ],
  },
  getUserSummary: {
    permission: "users:manage",
    run: () => tools.getUserSummary(),
    followUps: [
      "Which accounts still have a temporary password?",
      "How many administrators are there?",
    ],
  },
};

const DEFAULT_FOLLOW_UPS = [
  "Which items still have units to allocate?",
  "Which storage spaces have available capacity?",
  "Which warehouse is most utilised?",
];

/** Drops offers like "Would you like me to...", which often propose changing data. */
const OFFER = /^(would you like|do you want|shall i|should i|can i|may i|want me to)\b/i;

/** Words that point at account data, which staff may not ask about. */
const ADMIN_TOPIC = /\b(users?|accounts?|staff|admins?|administrators?|roles?|passwords?|people|employees?)\b/i;

function allowedTools(role: Role) {
  return (Object.keys(TOOLS) as ToolName[]).filter((name) => {
    const permission = TOOLS[name].permission;
    return !permission || can(role, permission);
  });
}

/** Runs a tool call. The role is checked here, whatever the conversation asked for. */
async function runTool(role: Role, name: string, rawArguments: string) {
  if (!(name in TOOLS)) {
    return { error: "That tool does not exist." };
  }

  const toolName = name as ToolName;
  const entry = TOOLS[toolName];

  if (entry.permission && !can(role, entry.permission)) {
    return {
      error:
        "Not permitted: this information is available to administrators only.",
    };
  }

  let parsedJson: unknown;

  try {
    parsedJson = JSON.parse(rawArguments || "{}");
  } catch {
    return { error: "The tool arguments were not valid JSON." };
  }

  const parsed = toolArgs[toolName].safeParse(parsedJson);

  if (!parsed.success) {
    return { error: "The tool arguments were not valid. Ask the user to rephrase." };
  }

  try {
    return await entry.run(parsed.data as Record<string, unknown>);
  } catch (error) {
    // Logged on the server; the model (and so the user) only learns it failed.
    console.error(`AI tool ${toolName} failed:`, error);
    return { error: "The data could not be loaded right now." };
  }
}

/** Splits the model's <suggestions> block off the answer. */
function extractSuggestions(content: string) {
  const match = content.match(/<suggestions>([\s\S]*?)(<\/suggestions>|$)/i);

  if (!match) {
    return { answer: content.trim(), suggestions: [] as string[] };
  }

  const suggestions = match[1]
    .split("\n")
    .map((line) => line.replace(/^\s*[-*\d.)]+\s*/, "").trim())
    .filter((line) => line.length >= 5 && line.length <= 140);

  return {
    answer: content.slice(0, match.index).trim(),
    suggestions,
  };
}

/** 2-3 suggestions that match the conversation and the user's role. */
function finaliseSuggestions(
  role: Role,
  fromModel: string[],
  toolsUsed: ToolName[],
  question: string,
) {
  // Loose comparison: letters and digits only, so punctuation and case differ.
  const normalise = (text: string) =>
    text.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
  const asked = normalise(question);

  const fallback = toolsUsed.flatMap((name) => TOOLS[name].followUps);
  const candidates = [...fromModel, ...fallback, ...DEFAULT_FOLLOW_UPS];

  const seen = new Set<string>();
  const result: string[] = [];

  for (const suggestion of candidates) {
    const key = suggestion.toLowerCase();

    if (seen.has(key)) continue;
    if (OFFER.test(suggestion)) continue;

    // Never offer back what the user just asked.
    const candidate = normalise(suggestion);
    if (candidate === asked || (candidate.length > 12 && asked.includes(candidate))) continue;
    if (role !== "admin" && ADMIN_TOPIC.test(suggestion)) continue;

    seen.add(key);
    result.push(suggestion);

    if (result.length === 3) break;
  }

  return result;
}

/** Answers a question. Tools are offered and run based on the session user's role. */
export async function askWarehouseAI(conversation: ChatMessage[], actor: Actor) {
  const role = actor.role;
  const available = allowedTools(role);
  const toolList: ChatCompletionTool[] = available.map(
    (name) => toolDefinitions[name],
  );

  const messages: ChatCompletionMessageParam[] = [
    { role: "system", content: buildSystemPrompt(role) },
    ...conversation.slice(-MAX_HISTORY),
  ];

  const toolsUsed: ToolName[] = [];

  for (let round = 0; round <= MAX_TOOL_ROUNDS; round++) {
    // On the last round tools are withdrawn, so the model must answer.
    const allowToolsThisRound = round < MAX_TOOL_ROUNDS;

    const response = await groq.chat.completions.create({
      model: MODEL,
      messages,
      ...(allowToolsThisRound && { tools: toolList, tool_choice: "auto" as const }),
    });

    const message = response.choices[0]?.message;

    if (!message) {
      break;
    }

    const toolCalls = (message.tool_calls ?? []).filter(
      (call) => call.type === "function",
    );

    if (!allowToolsThisRound || toolCalls.length === 0) {
      const { answer, suggestions } = extractSuggestions(message.content ?? "");

      return {
        response: answer,
        suggestions: finaliseSuggestions(
          role,
          suggestions,
          toolsUsed,
          conversation[conversation.length - 1]?.content ?? "",
        ),
      };
    }

    messages.push({
      role: "assistant",
      content: message.content ?? "",
      tool_calls: toolCalls,
    });

    for (const call of toolCalls) {
      const result = await runTool(role, call.function.name, call.function.arguments);

      if (call.function.name in TOOLS && !("error" in (result as object))) {
        toolsUsed.push(call.function.name as ToolName);
      }

      messages.push({
        role: "tool",
        tool_call_id: call.id,
        content: JSON.stringify(result),
      });
    }
  }

  return { response: "", suggestions: [] };
}
