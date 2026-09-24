import { z } from "zod";

import { groq } from "@/lib/ai/groq";
import { DomainError } from "@/lib/errors";
import { STORAGE_TYPES, STORAGE_TYPE_DESCRIPTIONS } from "@/lib/storage";

import {
  getDashboardStats,
  getLowSpaceAlerts,
} from "@/features/dashboard/queries";
import { getItems, getSplitItems } from "@/features/items/queries";
import { getWarehouses } from "@/features/warehouses/queries";

/*
 * AI suggestions for forms, plus a read-only summary. Nothing here writes to
 * the database; suggestions are only saved through the normal forms.
 */

const MODEL = "openai/gpt-oss-20b";

const STORAGE_TYPE_GUIDE = STORAGE_TYPES.map(
  (type) => `- ${type}: ${STORAGE_TYPE_DESCRIPTIONS[type]}`,
).join("\n");

async function askForJson<T>(
  system: string,
  user: string,
  schema: z.ZodType<T>,
) {
  let content: string | null | undefined;

  try {
    const response = await groq.chat.completions.create({
      model: MODEL,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    });

    content = response.choices[0]?.message?.content;
  } catch (error) {
    console.error("AI assist request failed:", error);
    throw new DomainError(
      "The AI service is unavailable right now. Fill in the form yourself, or try again.",
    );
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(content ?? "");
  } catch {
    throw new DomainError(
      "The AI returned an unexpected answer. Try describing it differently.",
    );
  }

  const result = schema.safeParse(parsed);

  if (!result.success) {
    throw new DomainError(
      "The AI returned an unexpected answer. Try describing it differently.",
    );
  }

  return result.data;
}

const MAX_ITEMS_PER_PROMPT = 10;

const itemSuggestion = z.object({
  name: z.string().trim().min(1).max(150),
  description: z.string().trim().max(1000),
  storageType: z.enum(STORAGE_TYPES),
  storageReason: z.string().trim().max(200).catch(""),
  sku: z
    .string()
    .trim()
    .min(2)
    .max(40)
    .regex(/^[A-Za-z0-9][A-Za-z0-9 _-]*$/)
    .transform((value) => value.toUpperCase().replace(/\s+/g, "-")),
  quantity: z.number().int().min(0).max(1_000_000).nullable().catch(null),
});

export const itemSuggestionsSchema = z.object({
  items: z.array(itemSuggestion).min(1).max(MAX_ITEMS_PER_PROMPT),
});

export type ItemSuggestion = z.infer<typeof itemSuggestion>;

/** Every whole number the user typed, with or without thousands separators. */
function numbersIn(text: string) {
  return new Set(
    (text.match(/\d[\d,]*/g) ?? []).map((raw) => Number(raw.replace(/,/g, ""))),
  );
}

export async function suggestItems(prompt: string, existingSkus: Set<string>) {
  const result = await askForJson(
    `You fill in a warehouse "Add Item" form from the user's description. The
description may mention ONE item or SEVERAL; return one entry per distinct item.

For each item return:
- name: a clean product name with correct capitalisation. Add the obvious
  maker only when the product itself names it (an "iPhone" is by Apple). If
  the user gave no brand or model ("wireless office mouse"), do NOT invent one:
  write "Wireless Office Mouse". Max 150 chars.
- description: 2 useful sentences for warehouse staff. First: what the item
  is, using the category and the details the user gave, plus general facts true
  of that kind of item (e.g. "a high-value consumer electronics device").
  Second: practical handling and storage guidance (e.g. fragile, keep dry,
  keep upright, do not stack, keep frozen, keep away from heat).
  Never add model specifications, sizes, chips, capacities or features the
  user did not mention. No marketing language.
- storageType: exactly one of ${STORAGE_TYPES.join(", ")}. Choose carefully:
${STORAGE_TYPE_GUIDE}
  * SECURE: high-value, theft-prone goods: phones, laptops, tablets, cameras,
    jewellery, watches, luxury goods, controlled medicines.
  * COLD_STORAGE: anything that must stay chilled or frozen: frozen food, meat,
    dairy, vaccines, insulin, some medicines, fresh produce.
  * HAZARDOUS: flammable, corrosive, toxic, explosive or pressurised goods:
    paint, solvents, fuel, gas cylinders, bleach, strong cleaning chemicals,
    bulk lithium batteries.
  * NORMAL: everything else (boxes, paper, furniture, clothing, tools...).
  Always choose one, even if the user did not mention storage.
- storageReason: a few words explaining the storage choice.
- sku: an uppercase code BRAND-TYPE-MODEL style, letters/digits/hyphens only,
  e.g. "APL-IPH18PM-001", "DEL-LAT7450-001". Unique within this reply.
- quantity: the number of units ONLY if the user explicitly stated it for this
  item (e.g. "455 units", "200 pcs", "30 boxes"). Otherwise null.
  Never estimate or invent a quantity.

Never include prices, ids or anything not asked for.
Reply with a JSON object: {"items": [ ... ]}.`,
    prompt,
    itemSuggestionsSchema,
  );

  // Server-side guard: a quantity survives only if that exact number appears
  // in what the user typed. Anything else is treated as invented and dropped.
  const typed = numbersIn(prompt);
  const taken = new Set(existingSkus);

  return result.items.map((item) => {
    // Nudge the code away from SKUs that already exist (or repeat in this
    // batch). Uniqueness is still enforced by the database when saving.
    let sku = item.sku;
    let counter = 2;

    while (taken.has(sku)) {
      const base = item.sku.replace(/-\d+$/, "");
      sku = `${base}-${String(counter).padStart(3, "0")}`.slice(0, 40);
      counter++;
    }

    taken.add(sku);

    return {
      ...item,
      sku,
      quantity:
        item.quantity !== null && typed.has(item.quantity) ? item.quantity : null,
    };
  });
}

export const storageSpaceSuggestionSchema = z.object({
  name: z.string().trim().min(1).max(150),
  storageType: z.enum(STORAGE_TYPES),
  description: z.string().trim().max(1000),
});

export type StorageSpaceSuggestion = z.infer<
  typeof storageSpaceSuggestionSchema
>;

export async function suggestStorageSpace(
  prompt: string,
  existingNames: string[],
) {
  return askForJson(
    `You help fill in a warehouse "Add Storage Space" form. From the user's short description, suggest:
- name: a short label such as "Cold Room 01" or "Rack A1", max 150 characters
- storageType: exactly one of ${STORAGE_TYPES.join(", ")}
${STORAGE_TYPE_GUIDE}
- description: one or two plain sentences about what the space is for

Names already used in this warehouse (do not repeat them): ${
      existingNames.length > 0 ? existingNames.join(", ") : "none"
    }.
Never include a capacity, number of units, warehouse, or any id.
Reply with a JSON object with exactly the keys: name, storageType, description.`,
    prompt,
    storageSpaceSuggestionSchema,
  );
}

// Numbers come from the database; the AI only writes the text around them.
const tone = z.enum(["good", "watch", "action"]);

const sectionNote = z.object({
  status: tone,
  note: z.string().trim().min(1).max(320),
});

const narrativeSchema = z.object({
  headline: z.string().trim().min(1).max(180),
  overallStatus: tone,
  sections: z.object({
    utilisation: sectionNote,
    unallocated: sectionNote,
    nearlyFull: sectionNote,
    inactive: sectionNote,
    split: sectionNote,
  }),
  recommendations: z.array(z.string().trim().min(1).max(200)).min(1).max(3),
});

export type HealthTone = z.infer<typeof tone>;
export type HealthNarrative = z.infer<typeof narrativeSchema>;

export async function summarizeWarehouseHealth() {
  const [stats, warehouses, nearlyFull, unallocated, split] = await Promise.all(
    [
      getDashboardStats(),
      getWarehouses(),
      getLowSpaceAlerts(),
      getItems({ stock: "unallocated" }),
      getSplitItems(),
    ],
  );

  const splitItems = [...new Set(split.map((row) => row.itemName))].map(
    (name) => ({
      item: name,
      locations: split.filter((row) => row.itemName === name).length,
    }),
  );

  const metrics = {
    usedPercent: stats.usedPercent,
    usedCapacity: stats.usedCapacity,
    totalCapacity: stats.totalCapacity,
    availableCapacity: stats.availableCapacity,
    activeWarehouses: stats.activeWarehouses,
    totalWarehouses: stats.totalWarehouses,
    unitsOwned: stats.totalUnits,
    unallocatedUnits: stats.unallocatedUnits,
    unallocatedItems: unallocated
      .map((item) => ({ name: item.name, sku: item.sku, remaining: item.remaining }))
      .sort((a, b) => b.remaining - a.remaining),
    nearlyFull: nearlyFull.map((space) => ({
      name: space.name,
      warehouse: space.warehouseName,
      usedPercent: space.usedPercent,
      free: space.available,
    })),
    inactiveWarehouses: warehouses
      .filter((warehouse) => warehouse.status === "INACTIVE")
      .map((warehouse) => ({ name: warehouse.name, unitsInside: warehouse.used })),
    splitItems,
  };

  const narrative = await askForJson(
    `You write the text of an operational health report for warehouse staff.
The numbers are shown separately on screen; your job is to explain them.
Use ONLY the JSON data provided. Never invent or change a number, name or item,
and never mention ids.

For each status use exactly one of: "good" (fine), "watch" (keep an eye on it),
"action" (someone should act soon).

Reply with a JSON object of exactly this shape:
{
  "headline": "one sentence, max 180 characters, on the overall state",
  "overallStatus": "good" | "watch" | "action",
  "sections": {
    "utilisation": { "status": ..., "note": "1-2 short sentences" },
    "unallocated": { "status": ..., "note": "..." },
    "nearlyFull":  { "status": ..., "note": "..." },
    "inactive":    { "status": ..., "note": "..." },
    "split":       { "status": ..., "note": "..." }
  },
  "recommendations": ["1 to 3 short, concrete, read-only next steps"]
}
If a section has nothing in it, say so briefly and use "good".`,
    JSON.stringify(metrics),
    narrativeSchema,
  );

  return { metrics, narrative, generatedAt: new Date().toISOString() };
}

export type WarehouseHealth = Awaited<ReturnType<typeof summarizeWarehouseHealth>>;
