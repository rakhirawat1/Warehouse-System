import { z } from "zod";

import { STORAGE_TYPES } from "@/lib/storage";

export const itemSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Item name is required")
    .max(150, "Item name must be 150 characters or less"),

  sku: z
    .string()
    .trim()
    .min(2, "SKU must be at least 2 characters")
    .max(40, "SKU must be 40 characters or less")
    .regex(
      /^[A-Za-z0-9][A-Za-z0-9 _-]*$/,
      "Use letters, numbers, spaces, hyphens or underscores.",
    )
    .transform((value) => value.toUpperCase()),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or less")
    .nullish()
    .transform((value) => value || null),

  /** Total units owned; allocation places part of it in storage. */
  quantity: z.coerce
    .number({ error: "Quantity must be a number." })
    .int("Quantity must be a whole number.")
    .min(0, "Quantity cannot be negative.")
    .max(1_000_000, "Quantity is too large."),

  requiredStorageType: z.enum(STORAGE_TYPES, {
    error: "Please choose the storage this item needs.",
  }),
});

export const createItemSchema = itemSchema;

export const updateItemSchema = itemSchema.partial();

/** Suggests a SKU from the name; `sequence` keeps repeated names unique. */
export function suggestSku(name: string, sequence: number) {
  const letters = name.replace(/[^A-Za-z0-9]/g, "").slice(0, 3).toUpperCase();

  return `${letters || "ITM"}-${String(sequence).padStart(3, "0")}`;
}
