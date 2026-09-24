import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";

import { allocations, storageSpaces, warehouses } from "@/db/schema";

import { DomainError, notFound } from "@/lib/errors";

import type { CreateWarehouseInput, UpdateWarehouseInput } from "./types";

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

/** Units stored in this warehouse. Takes the client so it reads inside the caller's transaction. */
async function getStoredQuantity(client: Transaction, warehouseId: string) {
  const [row] = await client
    .select({
      total: sql<number>`COALESCE(SUM(${allocations.quantity}), 0)`,
    })
    .from(allocations)
    .innerJoin(
      storageSpaces,
      eq(allocations.storageSpaceId, storageSpaces.id),
    )
    .where(eq(storageSpaces.warehouseId, warehouseId));

  return Number(row?.total ?? 0);
}

export async function createWarehouse(data: CreateWarehouseInput) {
  const [warehouse] = await db
    .insert(warehouses)
    .values({
      name: data.name,
      location: data.location,
      capacity: data.capacity,
      status: data.status,
    })
    .returning();

  return warehouse;
}

export async function updateWarehouse(
  warehouseId: string,
  data: UpdateWarehouseInput,
) {
  const [existingWarehouse] = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.id, warehouseId))
    .limit(1);

  if (!existingWarehouse) {
    throw notFound("The warehouse");
  }

  // Capacity may never fall below the capacity already given to its storage
  // spaces, otherwise the warehouse would be smaller than its own shelves.
  if (data.capacity !== undefined) {
    const [storageSpaceCapacity] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${storageSpaces.capacity}), 0)`,
      })
      .from(storageSpaces)
      .where(eq(storageSpaces.warehouseId, warehouseId));

    const totalStorageSpaceCapacity = Number(
      storageSpaceCapacity?.total ?? 0,
    );

    if (data.capacity < totalStorageSpaceCapacity) {
      throw new DomainError(
        `The storage spaces in this warehouse already hold ${totalStorageSpaceCapacity} units of capacity, ` +
          `so the warehouse capacity cannot be lower than ${totalStorageSpaceCapacity}.`,
        "CAPACITY",
      );
    }
  }

  const [updatedWarehouse] = await db
    .update(warehouses)
    .set({
      ...data,
      updatedAt: new Date(),
    })
    .where(eq(warehouses.id, warehouseId))
    .returning();

  return updatedWarehouse;
}

/**
 * Deletes an empty warehouse. Movement history is kept: those rows store
 * copied names and their foreign keys become null.
 */
export async function deleteWarehouse(warehouseId: string) {
  return db.transaction(async (tx) => {
    const [existingWarehouse] = await tx
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .limit(1)
      .for("update");

    if (!existingWarehouse) {
      throw notFound("The warehouse");
    }

    // Lock the storage spaces too. Allocating stock locks the same rows, so no
    // allocation can land in this warehouse between the check and the delete.
    await tx
      .select({ id: storageSpaces.id })
      .from(storageSpaces)
      .where(eq(storageSpaces.warehouseId, warehouseId))
      .orderBy(asc(storageSpaces.id))
      .for("update");

    const stored = await getStoredQuantity(tx, warehouseId);

    if (stored > 0) {
      throw new DomainError(
        `"${existingWarehouse.name}" still holds ${stored} units of stock. ` +
          `Move or dispatch the stock first, or set the warehouse to inactive to keep its history.`,
        "CONFLICT",
      );
    }

    // Empty storage spaces can go with it.
    await tx
      .delete(storageSpaces)
      .where(eq(storageSpaces.warehouseId, warehouseId));

    const [deletedWarehouse] = await tx
      .delete(warehouses)
      .where(eq(warehouses.id, warehouseId))
      .returning();

    return deletedWarehouse;
  });
}
