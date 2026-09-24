import { and, asc, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { allocations, items, storageSpaces, warehouses } from "@/db/schema";

import type { StorageType } from "@/lib/storage";

/**
 * How much of each item is allocated, and in how many places.
 * The item's own `quantity` column is the total the business owns.
 */
const itemStock = db
  .select({
    itemId: allocations.itemId,
    allocated: sql<number>`SUM(${allocations.quantity})`.as("allocated"),
    locationCount: sql<number>`COUNT(*)`.as("location_count"),
    warehouseCount:
      sql<number>`COUNT(DISTINCT ${storageSpaces.warehouseId})`.as(
        "warehouse_count",
      ),
  })
  .from(allocations)
  .innerJoin(storageSpaces, eq(allocations.storageSpaceId, storageSpaces.id))
  .groupBy(allocations.itemId)
  .as("item_stock");

export type ItemFilters = {
  search?: string;
  storageType?: StorageType;
  /**
   * "out-of-stock": nothing left to allocate (remaining = 0), i.e. the item is
   * fully stored. "unallocated": some units still need a storage space.
   */
  stock?: "out-of-stock" | "unallocated";
};

export async function getItems(filters: ItemFilters = {}) {
  const search = filters.search?.trim();

  const conditions: (SQL | undefined)[] = [
    filters.storageType
      ? eq(items.requiredStorageType, filters.storageType)
      : undefined,

    search
      ? or(
          ilike(items.name, `%${search}%`),
          ilike(items.sku, `%${search}%`),
          ilike(items.description, `%${search}%`),
        )
      : undefined,

    // Out of stock / fully stored: remaining = total - allocated = 0.
    // It is NOT "allocated = 0"; that would describe unplaced stock instead.
    filters.stock === "out-of-stock"
      ? sql`${items.quantity} - COALESCE(${itemStock.allocated}, 0) = 0`
      : undefined,

    filters.stock === "unallocated"
      ? sql`${items.quantity} - COALESCE(${itemStock.allocated}, 0) > 0`
      : undefined,

  ];

  const rows = await db
    .select({
      id: items.id,
      name: items.name,
      sku: items.sku,
      description: items.description,
      requiredStorageType: items.requiredStorageType,
      createdAt: items.createdAt,
      updatedAt: items.updatedAt,
      quantity: items.quantity,
      allocated: sql<number>`COALESCE(${itemStock.allocated}, 0)`,
      locationCount: sql<number>`COALESCE(${itemStock.locationCount}, 0)`,
      warehouseCount: sql<number>`COALESCE(${itemStock.warehouseCount}, 0)`,
    })
    .from(items)
    .leftJoin(itemStock, eq(itemStock.itemId, items.id))
    .where(and(...conditions))
    .orderBy(desc(items.createdAt));

  return rows.map((row) => {
    const quantity = Number(row.quantity);
    const allocated = Number(row.allocated);

    return {
      ...row,
      quantity,
      allocated,
      remaining: quantity - allocated,
      locationCount: Number(row.locationCount),
      warehouseCount: Number(row.warehouseCount),
    };
  });
}

export type ItemRow = Awaited<ReturnType<typeof getItems>>[number];

export async function getItemById(itemId: string) {
  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);

  return item;
}

export async function getItemWithStock(itemId: string) {
  const item = await getItemById(itemId);

  if (!item) {
    return null;
  }

  const [row] = await db
    .select({
      allocated: sql<number>`COALESCE(SUM(${allocations.quantity}), 0)`,
      locationCount: sql<number>`COUNT(${allocations.id})`,
      warehouseCount:
        sql<number>`COUNT(DISTINCT ${storageSpaces.warehouseId})`,
    })
    .from(allocations)
    .innerJoin(
      storageSpaces,
      eq(allocations.storageSpaceId, storageSpaces.id),
    )
    .where(eq(allocations.itemId, itemId));

  const allocated = Number(row?.allocated ?? 0);

  return {
    ...item,
    allocated,
    remaining: item.quantity - allocated,
    locationCount: Number(row?.locationCount ?? 0),
    warehouseCount: Number(row?.warehouseCount ?? 0),
  };
}

/** Items whose every unit is already stored (remaining is 0). */
export async function getOutOfStockItems() {
  return getItems({ stock: "out-of-stock" });
}

/** Items stored in two or more spaces, one row per location. */
export async function getSplitItems() {
  const splitItemIds = db
    .select({ itemId: allocations.itemId })
    .from(allocations)
    .groupBy(allocations.itemId)
    .having(sql`COUNT(DISTINCT ${allocations.storageSpaceId}) >= 2`);

  const rows = await db
    .select({
      itemId: items.id,
      itemName: items.name,
      itemSku: items.sku,
      warehouseName: warehouses.name,
      warehouseStatus: warehouses.status,
      storageSpaceName: storageSpaces.name,
      quantity: allocations.quantity,
    })
    .from(allocations)
    .innerJoin(items, eq(allocations.itemId, items.id))
    .innerJoin(
      storageSpaces,
      eq(allocations.storageSpaceId, storageSpaces.id),
    )
    .innerJoin(warehouses, eq(storageSpaces.warehouseId, warehouses.id))
    .where(inArray(allocations.itemId, splitItemIds))
    .orderBy(asc(items.name), desc(allocations.quantity));

  return rows;
}
