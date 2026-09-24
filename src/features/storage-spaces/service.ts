import { and, eq, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import { allocations, items, storageSpaces, warehouses } from "@/db/schema";

import { DomainError, isUniqueViolation, notFound } from "@/lib/errors";
import {
  canStore,
  STORAGE_TYPE_LABELS,
  type StorageType,
} from "@/lib/storage";

import type {
  CreateStorageSpaceInput,
  UpdateStorageSpaceInput,
} from "./types";

async function getUsedCapacity(storageSpaceId: string) {
  const [row] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${allocations.quantity}), 0)`,
    })
    .from(allocations)
    .where(eq(allocations.storageSpaceId, storageSpaceId));

  return Number(row?.total ?? 0);
}

const UNIQUE_NAME_INDEX = "storage_spaces_warehouse_name_unique";

function duplicateNameError(name: string, warehouseName: string) {
  return new DomainError(
    `"${warehouseName}" already has a storage space called "${name}". ` +
      `Choose a different name.`,
    "CONFLICT",
  );
}

/** Gives a clear message for a duplicate name; the unique index still wins races. */
async function assertNameIsFree(
  warehouseId: string,
  warehouseName: string,
  name: string,
  exceptStorageSpaceId?: string,
) {
  const [clash] = await db
    .select({ id: storageSpaces.id })
    .from(storageSpaces)
    .where(
      and(
        eq(storageSpaces.warehouseId, warehouseId),
        sql`LOWER(${storageSpaces.name}) = LOWER(${name})`,
        exceptStorageSpaceId
          ? ne(storageSpaces.id, exceptStorageSpaceId)
          : undefined,
      ),
    )
    .limit(1);

  if (clash) {
    throw duplicateNameError(name, warehouseName);
  }
}

export async function createStorageSpace(data: CreateStorageSpaceInput) {
  const [warehouse] = await db
    .select()
    .from(warehouses)
    .where(eq(warehouses.id, data.warehouseId))
    .limit(1);

  if (!warehouse) {
    throw notFound("The warehouse");
  }

  if (warehouse.status !== "ACTIVE") {
    throw new DomainError(
      `"${warehouse.name}" is inactive, so new storage spaces cannot be added. ` +
        `Set the warehouse to active first.`,
      "CONFLICT",
    );
  }

  await assertNameIsFree(warehouse.id, warehouse.name, data.name);

  const [result] = await db
    .select({
      total: sql<number>`COALESCE(SUM(${storageSpaces.capacity}), 0)`,
    })
    .from(storageSpaces)
    .where(eq(storageSpaces.warehouseId, data.warehouseId));

  const usedCapacity = Number(result?.total ?? 0);
  const availableCapacity = warehouse.capacity - usedCapacity;

  if (data.capacity > availableCapacity) {
    throw new DomainError(
      availableCapacity <= 0
        ? `All ${warehouse.capacity} units of capacity in "${warehouse.name}" are already given to storage spaces. ` +
            `Increase the warehouse capacity first.`
        : `"${warehouse.name}" has ${availableCapacity} units of capacity left, but you asked for ${data.capacity}. ` +
            `Lower the capacity or increase the warehouse capacity first.`,
      "CAPACITY",
    );
  }

  try {
    const [storageSpace] = await db
      .insert(storageSpaces)
      .values({
        warehouseId: data.warehouseId,
        name: data.name,
        description: data.description,
        storageType: data.storageType,
        capacity: data.capacity,
      })
      .returning();

    return storageSpace;
  } catch (error) {
    if (isUniqueViolation(error, UNIQUE_NAME_INDEX)) {
      throw duplicateNameError(data.name, warehouse.name);
    }

    throw error;
  }
}

export async function updateStorageSpace(
  storageSpaceId: string,
  data: UpdateStorageSpaceInput,
) {
  const [existingStorageSpace] = await db
    .select()
    .from(storageSpaces)
    .where(eq(storageSpaces.id, storageSpaceId))
    .limit(1);

  if (!existingStorageSpace) {
    throw notFound("The storage space");
  }

  const [parentWarehouse] = await db
    .select({ name: warehouses.name })
    .from(warehouses)
    .where(eq(warehouses.id, existingStorageSpace.warehouseId))
    .limit(1);

  const warehouseName = parentWarehouse?.name ?? "This warehouse";

  if (
    data.name !== undefined &&
    data.name.toLowerCase() !== existingStorageSpace.name.toLowerCase()
  ) {
    await assertNameIsFree(
      existingStorageSpace.warehouseId,
      warehouseName,
      data.name,
      storageSpaceId,
    );
  }

  if (data.capacity !== undefined) {
    const allocatedQuantity = await getUsedCapacity(storageSpaceId);

    // A space can never be smaller than the stock already inside it.
    if (data.capacity < allocatedQuantity) {
      throw new DomainError(
        `"${existingStorageSpace.name}" holds ${allocatedQuantity} units, so its capacity cannot be lower than ${allocatedQuantity}. ` +
          `Move some stock out first.`,
        "CAPACITY",
      );
    }

    const [warehouse] = await db
      .select()
      .from(warehouses)
      .where(eq(warehouses.id, existingStorageSpace.warehouseId))
      .limit(1);

    if (!warehouse) {
      throw notFound("The warehouse");
    }

    const [result] = await db
      .select({
        total: sql<number>`COALESCE(SUM(${storageSpaces.capacity}), 0)`,
      })
      .from(storageSpaces)
      .where(eq(storageSpaces.warehouseId, existingStorageSpace.warehouseId));

    const capacityWithoutThisSpace =
      Number(result?.total ?? 0) - existingStorageSpace.capacity;

    const availableCapacity = warehouse.capacity - capacityWithoutThisSpace;

    if (data.capacity > availableCapacity) {
      throw new DomainError(
        `"${warehouse.name}" only has ${availableCapacity} units of capacity available for this storage space.`,
        "CAPACITY",
      );
    }
  }

  // Changing the type must not leave stock in a space that no longer suits it.
  if (
    data.storageType &&
    data.storageType !== existingStorageSpace.storageType
  ) {
    const storedItems = await db
      .select({
        itemName: items.name,
        requiredStorageType: items.requiredStorageType,
      })
      .from(allocations)
      .innerJoin(items, eq(allocations.itemId, items.id))
      .where(eq(allocations.storageSpaceId, storageSpaceId));

    const blocking = storedItems.find(
      (row) =>
        !canStore(row.requiredStorageType, data.storageType as StorageType),
    );

    if (blocking) {
      throw new DomainError(
        `"${blocking.itemName}" is stored here and needs ` +
          `${STORAGE_TYPE_LABELS[blocking.requiredStorageType].toLowerCase()} storage, ` +
          `so this space cannot be changed to ${STORAGE_TYPE_LABELS[data.storageType as StorageType].toLowerCase()}. ` +
          `Move that stock first.`,
        "CONFLICT",
      );
    }
  }

  try {
    const [updatedStorageSpace] = await db
      .update(storageSpaces)
      .set({
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.storageType !== undefined && {
          storageType: data.storageType,
        }),
        ...(data.capacity !== undefined && { capacity: data.capacity }),
        updatedAt: new Date(),
      })
      .where(eq(storageSpaces.id, storageSpaceId))
      .returning();

    return updatedStorageSpace;
  } catch (error) {
    if (data.name !== undefined && isUniqueViolation(error, UNIQUE_NAME_INDEX)) {
      throw duplicateNameError(data.name, warehouseName);
    }

    throw error;
  }
}

export async function deleteStorageSpace(storageSpaceId: string) {
  const [storageSpace] = await db
    .select()
    .from(storageSpaces)
    .where(eq(storageSpaces.id, storageSpaceId))
    .limit(1);

  if (!storageSpace) {
    throw notFound("The storage space");
  }

  const used = await getUsedCapacity(storageSpaceId);

  if (used > 0) {
    throw new DomainError(
      `"${storageSpace.name}" still holds ${used} units. ` +
        `Move or dispatch the stock before deleting this storage space.`,
      "CONFLICT",
    );
  }

  const [deletedStorageSpace] = await db
    .delete(storageSpaces)
    .where(eq(storageSpaces.id, storageSpaceId))
    .returning();

  return deletedStorageSpace;
}
