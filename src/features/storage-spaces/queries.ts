import { and, asc, desc, eq, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { allocations, items, storageSpaces, warehouses } from "@/db/schema";

/** Storage spaces with usage. Without a scope, returns every space in one query. */
export async function getStorageSpacesWithUsage(
  scope: { warehouseId?: string; storageSpaceId?: string } = {},
) {
  const conditions: (SQL | undefined)[] = [
    scope.warehouseId
      ? eq(storageSpaces.warehouseId, scope.warehouseId)
      : undefined,
    scope.storageSpaceId
      ? eq(storageSpaces.id, scope.storageSpaceId)
      : undefined,
  ];

  const rows = await db
    .select({
      id: storageSpaces.id,
      name: storageSpaces.name,
      description: storageSpaces.description,
      storageType: storageSpaces.storageType,
      capacity: storageSpaces.capacity,
      createdAt: storageSpaces.createdAt,
      warehouseId: storageSpaces.warehouseId,
      warehouseName: warehouses.name,
      warehouseStatus: warehouses.status,
      used: sql<number>`(
        SELECT COALESCE(SUM(a.quantity), 0)
        FROM allocations a
        WHERE a.storage_space_id = storage_spaces.id
      )`,
      itemCount: sql<number>`(
        SELECT COUNT(*)
        FROM allocations a
        WHERE a.storage_space_id = storage_spaces.id
      )`,
    })
    .from(storageSpaces)
    .innerJoin(warehouses, eq(storageSpaces.warehouseId, warehouses.id))
    .where(and(...conditions))
    .orderBy(asc(warehouses.name), asc(storageSpaces.name));

  return rows.map((row) => {
    const used = Number(row.used);

    return {
      ...row,
      used,
      itemCount: Number(row.itemCount),
      available: row.capacity - used,
      usedPercent:
        row.capacity > 0 ? Math.round((used / row.capacity) * 100) : 0,
    };
  });
}

export type StorageSpaceRow = Awaited<
  ReturnType<typeof getStorageSpacesWithUsage>
>[number];

/** Kept for existing callers. */
export async function getStorageSpacesWithUsageByWarehouseId(
  warehouseId: string,
) {
  return getStorageSpacesWithUsage({ warehouseId });
}

export async function getStorageSpaceWithContents(storageSpaceId: string) {
  const [space] = await getStorageSpacesWithUsage({ storageSpaceId });

  if (!space) {
    return null;
  }

  const contents = await db
    .select({
      allocationId: allocations.id,
      itemId: items.id,
      itemName: items.name,
      itemSku: items.sku,
      requiredStorageType: items.requiredStorageType,
      quantity: allocations.quantity,
      updatedAt: allocations.updatedAt,
      /** The item's total, so the page can show what share sits here. */
      itemTotal: items.quantity,
    })
    .from(allocations)
    .innerJoin(items, eq(allocations.itemId, items.id))
    .where(eq(allocations.storageSpaceId, storageSpaceId))
    .orderBy(desc(allocations.quantity));

  return { space, contents };
}
