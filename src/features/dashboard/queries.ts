import { desc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  allocations,
  items,
  stockMovements,
  storageSpaces,
  warehouses,
} from "@/db/schema";

/**
 * Headline numbers. Stored stock is always derived from allocations, so these
 * figures can never disagree with the item or warehouse pages.
 */
export async function getDashboardStats() {
  const [counts, capacity, stock, itemStock, recentMovements] = await Promise.all([
    db
      .select({
        warehouses: sql<number>`COUNT(*)`,
        activeWarehouses: sql<number>`COUNT(*) FILTER (WHERE ${warehouses.status} = 'ACTIVE')`,
        warehousesThisMonth: sql<number>`COUNT(*) FILTER (WHERE ${warehouses.createdAt} >= date_trunc('month', now()))`,
      })
      .from(warehouses),

    db
      .select({
        storageSpaces: sql<number>`COUNT(*)`,
        totalCapacity: sql<number>`COALESCE(SUM(${storageSpaces.capacity}), 0)`,
        spacesThisMonth: sql<number>`COUNT(*) FILTER (WHERE ${storageSpaces.createdAt} >= date_trunc('month', now()))`,
      })
      .from(storageSpaces),

    db
      .select({
        used: sql<number>`COALESCE(SUM(${allocations.quantity}), 0)`,
        allocationCount: sql<number>`COUNT(*)`,
      })
      .from(allocations),

    db
      .select({
        totalItems: sql<number>`COUNT(*)`,
        storedItems: sql<number>`COUNT(*) FILTER (WHERE COALESCE(stock.quantity, 0) > 0)`,
        /** Nothing placed anywhere yet. */
        notAllocatedItems: sql<number>`COUNT(*) FILTER (WHERE COALESCE(stock.quantity, 0) = 0)`,
        /** Some units placed, some still waiting. */
        partiallyAllocatedItems: sql<number>`COUNT(*) FILTER (WHERE COALESCE(stock.quantity, 0) > 0 AND ${items.quantity} > COALESCE(stock.quantity, 0))`,
        /** Every unit has a storage space. */
        fullyAllocatedItems: sql<number>`COUNT(*) FILTER (WHERE ${items.quantity} > 0 AND ${items.quantity} = COALESCE(stock.quantity, 0))`,
        itemsThisMonth: sql<number>`COUNT(*) FILTER (WHERE ${items.createdAt} >= date_trunc('month', now()))`,
        /** Items that still have units waiting for a storage space. */
        partlyAllocatedItems: sql<number>`COUNT(*) FILTER (WHERE ${items.quantity} > COALESCE(stock.quantity, 0))`,
        /** Units owned but not placed in any storage space. */
        unallocatedUnits: sql<number>`COALESCE(SUM(${items.quantity} - COALESCE(stock.quantity, 0)), 0)`,
        /** Every unit the business owns, allocated or not. */
        totalUnits: sql<number>`COALESCE(SUM(${items.quantity}), 0)`,
      })
      .from(items)
      .leftJoin(
        db
          .select({
            itemId: allocations.itemId,
            quantity: sql<number>`SUM(${allocations.quantity})`.as("quantity"),
          })
          .from(allocations)
          .groupBy(allocations.itemId)
          .as("stock"),
        sql`stock.item_id = items.id`,
      ),

    db
      .select({
        thisWeek: sql<number>`COUNT(*) FILTER (WHERE ${stockMovements.createdAt} >= now() - interval '7 days')`,
        total: sql<number>`COUNT(*)`,
      })
      .from(stockMovements),
  ]);

  const totalCapacity = Number(capacity[0]?.totalCapacity ?? 0);
  const usedCapacity = Number(stock[0]?.used ?? 0);
  const totalItems = Number(itemStock[0]?.totalItems ?? 0);
  const storedItems = Number(itemStock[0]?.storedItems ?? 0);

  return {
    totalWarehouses: Number(counts[0]?.warehouses ?? 0),
    activeWarehouses: Number(counts[0]?.activeWarehouses ?? 0),
    warehousesThisMonth: Number(counts[0]?.warehousesThisMonth ?? 0),
    totalStorageSpaces: Number(capacity[0]?.storageSpaces ?? 0),
    spacesThisMonth: Number(capacity[0]?.spacesThisMonth ?? 0),
    itemsThisMonth: Number(itemStock[0]?.itemsThisMonth ?? 0),
    notAllocatedItems: Number(itemStock[0]?.notAllocatedItems ?? 0),
    partiallyAllocatedItems: Number(itemStock[0]?.partiallyAllocatedItems ?? 0),
    fullyAllocatedItems: Number(itemStock[0]?.fullyAllocatedItems ?? 0),
    totalMovements: Number(recentMovements[0]?.total ?? 0),
    movementsThisWeek: Number(recentMovements[0]?.thisWeek ?? 0),
    totalItems,
    storedItems,
    /** Items with a total but nothing placed in a storage space yet. */
    unallocatedItems: totalItems - storedItems,
    partlyAllocatedItems: Number(itemStock[0]?.partlyAllocatedItems ?? 0),
    unallocatedUnits: Number(itemStock[0]?.unallocatedUnits ?? 0),
    totalUnits: Number(itemStock[0]?.totalUnits ?? 0),
    totalAllocated: usedCapacity,
    allocationCount: Number(stock[0]?.allocationCount ?? 0),
    totalCapacity,
    usedCapacity,
    availableCapacity: totalCapacity - usedCapacity,
    usedPercent:
      totalCapacity > 0 ? Math.round((usedCapacity / totalCapacity) * 100) : 0,
  };
}

export async function getCapacityByWarehouse() {
  const rows = await db
    .select({
      name: warehouses.name,
      status: warehouses.status,
      capacity: sql<number>`(
        SELECT COALESCE(SUM(s.capacity), 0)
        FROM storage_spaces s
        WHERE s.warehouse_id = warehouses.id
      )`,
      used: sql<number>`(
        SELECT COALESCE(SUM(a.quantity), 0)
        FROM allocations a
        JOIN storage_spaces s ON s.id = a.storage_space_id
        WHERE s.warehouse_id = warehouses.id
      )`,
    })
    .from(warehouses)
    .orderBy(warehouses.name);

  return rows.map((row) => ({
    name: row.name,
    status: row.status,
    capacity: Number(row.capacity),
    used: Number(row.used),
  }));
}

export async function getInventoryDistribution() {
  const rows = await db
    .select({
      name: warehouses.name,
      quantity: sql<number>`COALESCE(SUM(${allocations.quantity}), 0)`,
    })
    .from(allocations)
    .innerJoin(
      storageSpaces,
      eq(allocations.storageSpaceId, storageSpaces.id),
    )
    .innerJoin(warehouses, eq(storageSpaces.warehouseId, warehouses.id))
    .groupBy(warehouses.id, warehouses.name);

  return rows.map((row) => ({
    name: row.name,
    quantity: Number(row.quantity),
  }));
}

export async function getRecentMovements(limit = 6) {
  return db
    .select({
      id: stockMovements.id,
      type: stockMovements.type,
      itemId: stockMovements.itemId,
      itemName: stockMovements.itemName,
      fromLabel: stockMovements.fromLabel,
      toLabel: stockMovements.toLabel,
      quantity: stockMovements.quantity,
      actorName: stockMovements.actorName,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .orderBy(desc(stockMovements.createdAt))
    .limit(limit);
}

/** Nearly full spaces in active warehouses (inactive ones take no new stock). */
export async function getLowSpaceAlerts(threshold = 85) {
  const rows = await db
    .select({
      id: storageSpaces.id,
      name: storageSpaces.name,
      capacity: storageSpaces.capacity,
      warehouseId: warehouses.id,
      warehouseName: warehouses.name,
      used: sql<number>`(
        SELECT COALESCE(SUM(a.quantity), 0)
        FROM allocations a
        WHERE a.storage_space_id = storage_spaces.id
      )`,
    })
    .from(storageSpaces)
    .innerJoin(warehouses, eq(storageSpaces.warehouseId, warehouses.id))
    .where(eq(warehouses.status, "ACTIVE"));

  return rows
    .map((row) => {
      const used = Number(row.used);

      return {
        ...row,
        used,
        available: row.capacity - used,
        usedPercent:
          row.capacity > 0 ? Math.round((used / row.capacity) * 100) : 0,
      };
    })
    .filter((row) => row.usedPercent >= threshold)
    .sort((a, b) => b.usedPercent - a.usedPercent);
}
