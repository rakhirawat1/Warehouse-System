import { z } from "zod";

import type { ChatCompletionTool } from "groq-sdk/resources/chat/completions";

/** How much conversation the client may send, and how long each turn may be. */
export const MAX_HISTORY = 20;
export const MAX_MESSAGE_LENGTH = 4000;

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z
          .string()
          .trim()
          .min(1, "Messages cannot be empty.")
          .max(
            MAX_MESSAGE_LENGTH,
            `Each message must be ${MAX_MESSAGE_LENGTH} characters or less.`,
          ),
      }),
    )
    .min(1, "At least one message is required.")
    .refine(
      (messages) => messages[messages.length - 1]?.role === "user",
      "The last message must come from the user.",
    ),
});

export type ChatMessage = z.infer<typeof chatRequestSchema>["messages"][number];

// The model is not a trusted caller: tool arguments are validated like user input.

const searchTerm = z.string().trim().min(1).max(100);

export const toolArgs = {
  searchItems: z.object({ search: searchTerm }),
  getItemAllocations: z.object({ itemSearch: searchTerm }),
  getUnallocatedItems: z.object({}),
  getOutOfStockItems: z.object({}),
  getSplitItems: z.object({}),
  getWarehouses: z.object({}),
  getStorageSpaceAvailability: z.object({
    warehouseName: searchTerm.optional(),
  }),
  getUserSummary: z.object({}),
} as const;

export type ToolName = keyof typeof toolArgs;

const noParameters = {
  type: "object",
  properties: {},
  required: [],
  additionalProperties: false,
};

export const toolDefinitions: Record<ToolName, ChatCompletionTool> = {
  searchItems: {
    type: "function",
    function: {
      name: "searchItems",
      description:
        "Search inventory items by name, SKU or description. Returns each match with its total, allocated and remaining quantity.",
      parameters: {
        type: "object",
        properties: {
          search: {
            type: "string",
            description: "The item name, SKU or keyword to search for.",
          },
        },
        required: ["search"],
        additionalProperties: false,
      },
    },
  },

  getItemAllocations: {
    type: "function",
    function: {
      name: "getItemAllocations",
      description:
        "Find exactly where one item is stored: each warehouse and storage space holding it, the quantity there, and the warehouse status. If the search matches several items it returns the candidates instead, so you can ask the user which one they mean.",
      parameters: {
        type: "object",
        properties: {
          itemSearch: {
            type: "string",
            description: "The item name or SKU, such as 'laptops' or 'LAP-007'.",
          },
        },
        required: ["itemSearch"],
        additionalProperties: false,
      },
    },
  },

  getUnallocatedItems: {
    type: "function",
    function: {
      name: "getUnallocatedItems",
      description:
        "List items that still have units waiting to be allocated to a storage space (remaining quantity above 0).",
      parameters: noParameters,
    },
  },

  getOutOfStockItems: {
    type: "function",
    function: {
      name: "getOutOfStockItems",
      description:
        "List items that are out of stock, also called fully stored: their remaining quantity is 0, so nothing is left to allocate.",
      parameters: noParameters,
    },
  },

  getSplitItems: {
    type: "function",
    function: {
      name: "getSplitItems",
      description:
        "List items stored across two or more different storage spaces, with one row per location.",
      parameters: noParameters,
    },
  },

  getWarehouses: {
    type: "function",
    function: {
      name: "getWarehouses",
      description:
        "List every warehouse with its location, status, total capacity, used and available capacity, utilisation and number of storage spaces. Use it for listing warehouses and for comparing warehouse capacity.",
      parameters: noParameters,
    },
  },

  getStorageSpaceAvailability: {
    type: "function",
    function: {
      name: "getStorageSpaceAvailability",
      description:
        "List storage spaces with their capacity, used and available units, storage type, warehouse and warehouse status, and whether each can accept new stock. Optionally limited to warehouses whose name contains the given text.",
      parameters: {
        type: "object",
        properties: {
          warehouseName: {
            type: "string",
            description: "Optional warehouse name, or part of one.",
          },
        },
        required: [],
        additionalProperties: false,
      },
    },
  },

  getUserSummary: {
    type: "function",
    function: {
      name: "getUserSummary",
      description:
        "Administrators only. List user accounts with their name, email and role, and count administrators and staff.",
      parameters: noParameters,
    },
  },
};
