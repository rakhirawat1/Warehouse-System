import { z } from "zod";

const quantity = z
  .number({ error: "Quantity must be a number." })
  .int("Quantity must be a whole number.")
  .positive("Quantity must be greater than 0.")
  .max(1_000_000, "Quantity is too large.");

// nullish, not optional: the dialogs send `note: null` and an empty form
// field arrives as null too, which `.optional()` alone would reject.
const note = z
  .string()
  .trim()
  .max(500, "Note must be 500 characters or less.")
  .nullish()
  .transform((value) => value || null);

/** One or more lines for one item, saved all or nothing. */
export const allocateStockSchema = z
  .object({
    itemId: z.string().uuid("Please choose an item."),
    lines: z
      .array(
        z.object({
          storageSpaceId: z.string().uuid("Please choose a storage space."),
          quantity,
        }),
      )
      .min(1, "Add at least one storage space.")
      .max(50, "Too many lines in one allocation."),
    note,
  })
  .refine(
    (data) =>
      new Set(data.lines.map((line) => line.storageSpaceId)).size ===
      data.lines.length,
    {
      message:
        "Two lines point at the same storage space. Combine them into one line.",
      path: ["lines"],
    },
  );

export const transferStockSchema = z.object({
  allocationId: z.string().uuid("Invalid allocation."),
  destinationStorageSpaceId: z
    .string()
    .uuid("Please choose a destination storage space."),
  quantity,
  note,
});

export const adjustAllocationSchema = z.object({
  allocationId: z.string().uuid("Invalid allocation."),
  quantity,
  note,
});

/** Without a quantity, the whole allocation is dispatched. */
export const dispatchStockSchema = z.object({
  allocationId: z.string().uuid("Invalid allocation."),
  quantity: quantity.nullish(),
  note,
});
