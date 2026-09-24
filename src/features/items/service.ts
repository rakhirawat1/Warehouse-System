import { eq, sql } from "drizzle-orm";

import { db } from "@/db";

import { allocations, items, storageSpaces } from "@/db/schema";

import { DomainError, notFound } from "@/lib/errors";
import {
  canStore,
  STORAGE_TYPE_LABELS,
  type StorageType,
} from "@/lib/storage";

import type { CreateItemInput, UpdateItemInput } from "./types";

export async function getAllocatedQuantity(itemId: string) {
  const [row] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${allocations.quantity}), 0)`,
    })
    .from(allocations)
    .where(eq(allocations.itemId, itemId));

  return Number(row?.total ?? 0);
}

/** Rejects a code that another item already uses, ignoring case. */
async function assertSkuIsFree(sku: string, exceptItemId?: string) {
  const [clash] = await db
    .select({ id: items.id, name: items.name, sku: items.sku })
    .from(items)
    .where(sql`UPPER(${items.sku}) = UPPER(${sku})`)
    .limit(1);

  if (clash && clash.id !== exceptItemId) {
    throw new DomainError(
      `The code "${clash.sku}" is already used by "${clash.name}". Choose another one.`,
      "CONFLICT",
    );
  }
}

export async function createItem(data: CreateItemInput) {
  await assertSkuIsFree(data.sku);

  const [item] = await db
    .insert(items)
    .values({
      name: data.name,
      sku: data.sku,
      description: data.description,
      quantity: data.quantity,
      requiredStorageType: data.requiredStorageType,
    })
    .returning();

  return item;
}

export async function updateItem(itemId: string, data: UpdateItemInput) {
  const [existingItem] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);

  if (!existingItem) {
    throw notFound("The item");
  }

  if (data.sku !== undefined) {
    await assertSkuIsFree(data.sku, itemId);
  }

  // The total can never drop below what is already allocated.
  if (data.quantity !== undefined) {
    const allocated = await getAllocatedQuantity(itemId);

    if (data.quantity < allocated) {
      throw new DomainError(
        `${allocated} units of "${existingItem.name}" are already allocated to storage spaces, ` +
          `so the total cannot be less than ${allocated}. Correct or dispatch some of that stock first.`,
        "CONFLICT",
      );
    }
  }

  // Changing the storage requirement must not leave stock in a space that is
  // no longer allowed for it.
  if (
    data.requiredStorageType &&
    data.requiredStorageType !== existingItem.requiredStorageType
  ) {
    const storedIn = await db
      .select({
        storageSpaceName: storageSpaces.name,
        storageType: storageSpaces.storageType,
      })
      .from(allocations)
      .innerJoin(
        storageSpaces,
        eq(allocations.storageSpaceId, storageSpaces.id),
      )
      .where(eq(allocations.itemId, itemId));

    const blocking = storedIn.find(
      (row) =>
        !canStore(data.requiredStorageType as StorageType, row.storageType),
    );

    if (blocking) {
      throw new DomainError(
        `This item is stored in "${blocking.storageSpaceName}", which is ` +
          `${STORAGE_TYPE_LABELS[blocking.storageType].toLowerCase()} storage and does not match ` +
          `${STORAGE_TYPE_LABELS[data.requiredStorageType as StorageType].toLowerCase()}. ` +
          `Move that stock first, then change the storage type.`,
        "CONFLICT",
      );
    }
  }

  const [updatedItem] = await db
    .update(items)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(items.id, itemId))
    .returning();

  return updatedItem;
}

export async function deleteItem(itemId: string) {
  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);

  if (!item) {
    throw notFound("The item");
  }

  const stock = await getAllocatedQuantity(itemId);

  if (stock > 0) {
    throw new DomainError(
      `"${item.name}" still has ${stock} units allocated to storage spaces. ` +
        `Dispatch or correct that stock first, then delete the item.`,
      "CONFLICT",
    );
  }

  const [deletedItem] = await db
    .delete(items)
    .where(eq(items.id, itemId))
    .returning();

  return deletedItem;
}
