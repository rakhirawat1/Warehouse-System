"use server";

import { eq } from "drizzle-orm";
import { z } from "zod";

import { db } from "@/db";
import { items, storageSpaces } from "@/db/schema";
import { runAction } from "@/lib/action";
import { authorize } from "@/lib/auth/guards";
import { ForbiddenError } from "@/lib/errors";

import {
  suggestItems,
  suggestStorageSpace,
  summarizeWarehouseHealth,
} from "./assist";

const promptSchema = z
  .string()
  .trim()
  .min(3, "Describe it in a few words first.")
  .max(500, "Keep the description under 500 characters.");

/** Suggests items from a description. Saves nothing. */
export async function suggestItemsAction(prompt: unknown) {
  return runAction(async () => {
    await authorize("item:create");

    const text = z
      .string()
      .trim()
      .min(3, "Describe it in a few words first.")
      .max(1500, "Keep the description under 1500 characters.")
      .parse(prompt);

    // Existing codes, so suggestions avoid obvious clashes. The unique index
    // still decides when an item is saved.
    const existing = await db.select({ sku: items.sku }).from(items);

    return suggestItems(
      text,
      new Set(existing.map((row) => row.sku.toUpperCase())),
    );
  });
}

/** Suggests Add Storage Space fields. Never suggests capacity or ids. */
export async function suggestStorageSpaceAction(input: unknown) {
  return runAction(async () => {
    await authorize("storageSpace:create");

    const data = z
      .object({ prompt: promptSchema, warehouseId: z.string().uuid() })
      .parse(input);

    // Names already used here, so the suggestion avoids an obvious clash.
    // The unique index still decides when the form is saved.
    const existing = await db
      .select({ name: storageSpaces.name })
      .from(storageSpaces)
      .where(eq(storageSpaces.warehouseId, data.warehouseId));

    return suggestStorageSpace(
      data.prompt,
      existing.map((row) => row.name),
    );
  }, "AI suggestions added. Review them before saving.");
}

export async function summarizeWarehouseAction() {
  return runAction(async () => {
    const actor = await authorize();

    if (actor.mustChangePassword) {
      throw new ForbiddenError(
        "Change your temporary password before doing anything else.",
      );
    }

    return summarizeWarehouseHealth();
  });
}
