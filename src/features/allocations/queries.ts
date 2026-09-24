import { and, desc, eq, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { allocations, items, storageSpaces, warehouses } from "@/db/schema";

export type AllocationFilters = {
  allocationId?: string;
  itemId?: string;
  warehouseId?: string;
};

/**
 * Allocations with everything the UI needs to show capacity: the space's
 * capacity, how full it is, and whether its warehouse still accepts stock.
 */
export async function getAllocations(filters: AllocationFilters = {}) {
  const conditions: (SQL | undefined)[] = [
    filters.allocationId
      ? eq(allocations.id, filters.allocationId)
      : undefined,
    filters.itemId ? eq(allocations.itemId, filters.itemId) : undefined,
    filters.warehouseId
      ? eq(storageSpaces.warehouseId, filters.warehouseId)
      : undefined,
  ];

  const rows = await db
    .select({
      id: allocations.id,
      quantity: allocations.quantity,
      createdAt: allocations.createdAt,
      updatedAt: allocations.updatedAt,

      itemId: allocations.itemId,
      itemName: items.name,
      itemSku: items.sku,
      requiredStorageType: items.requiredStorageType,
      itemTotal: items.quantity,

      /** Everything allocated of this item, across every storage space. */
      itemAllocated: sql<number>`(
        SELECT COALESCE(SUM(a3.quantity), 0)
        FROM allocations a3
        WHERE a3.item_id = allocations.item_id
      )`,

      storageSpaceId: allocations.storageSpaceId,
      storageSpaceName: storageSpaces.name,
      storageSpaceCapacity: storageSpaces.capacity,
      storageType: storageSpaces.storageType,

      warehouseId: warehouses.id,
      warehouseName: warehouses.name,
      warehouseStatus: warehouses.status,

      /** Everything stored in that space, including this allocation. */
      storageSpaceUsed: sql<number>`(
        SELECT COALESCE(SUM(a2.quantity), 0)
        FROM allocations a2
        WHERE a2.storage_space_id = allocations.storage_space_id
      )`,
    })
    .from(allocations)
    .innerJoin(items, eq(allocations.itemId, items.id))
    .innerJoin(
      storageSpaces,
      eq(allocations.storageSpaceId, storageSpaces.id),
    )
    .innerJoin(warehouses, eq(storageSpaces.warehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(desc(allocations.updatedAt));

  return rows.map((row) => {
    const storageSpaceUsed = Number(row.storageSpaceUsed);
    const itemAllocated = Number(row.itemAllocated);
    const itemRemaining = row.itemTotal - itemAllocated;

    // Two ceilings apply at once: the room left in the space, and the units
    // of the item that are not allocated anywhere else. Whichever is lower
    // wins, so the form never offers a number the server would reject.
    const spaceCeiling =
      row.storageSpaceCapacity - storageSpaceUsed + row.quantity;
    const itemCeiling = row.quantity + itemRemaining;

    return {
      ...row,
      itemAllocated,
      itemRemaining,
      storageSpaceUsed,
      storageSpaceAvailable: row.storageSpaceCapacity - storageSpaceUsed,
      maxQuantity: Math.min(spaceCeiling, itemCeiling),
      /** Which of the two ceilings is the binding one. */
      limitedBy: (itemCeiling <= spaceCeiling ? "item" : "space") as
        | "item"
        | "space",
    };
  });
}

export type AllocationRow = Awaited<ReturnType<typeof getAllocations>>[number];

export async function getAllocationById(allocationId: string) {
  const [allocation] = await getAllocations({ allocationId });

  return allocation ?? null;
}

export async function getAllocationsByItemId(itemId: string) {
  return getAllocations({ itemId });
}
