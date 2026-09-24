import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { warehouses } from "@/db/schema";

export type WarehouseFilters = {
  search?: string;
  status?: "ACTIVE" | "INACTIVE";
};

/**
 * Per-warehouse space count, assigned capacity and units stored, in one query.
 * Subqueries name their tables explicitly: inside `sql` Drizzle renders a bare "id".
 */
const spaceCountSql = sql<number>`(
  SELECT COUNT(*)
  FROM storage_spaces s
  WHERE s.warehouse_id = warehouses.id
)`;

const allocatedCapacitySql = sql<number>`(
  SELECT COALESCE(SUM(s.capacity), 0)
  FROM storage_spaces s
  WHERE s.warehouse_id = warehouses.id
)`;

const usedSql = sql<number>`(
  SELECT COALESCE(SUM(a.quantity), 0)
  FROM allocations a
  JOIN storage_spaces s ON s.id = a.storage_space_id
  WHERE s.warehouse_id = warehouses.id
)`;

function mapWarehouse<
  T extends {
    capacity: number;
    spaceCount: number;
    allocatedCapacity: number;
    used: number;
  },
>(row: T) {
  const capacity = Number(row.capacity);
  const used = Number(row.used);
  const allocatedCapacity = Number(row.allocatedCapacity);

  return {
    ...row,
    capacity,
    used,
    allocatedCapacity,
    spaceCount: Number(row.spaceCount),
    /** Capacity not yet given to any storage space. */
    unassignedCapacity: capacity - allocatedCapacity,
    /** Free room inside existing storage spaces. */
    available: allocatedCapacity - used,
    usedPercent:
      allocatedCapacity > 0 ? Math.round((used / allocatedCapacity) * 100) : 0,
  };
}

const warehouseColumns = {
  id: warehouses.id,
  name: warehouses.name,
  location: warehouses.location,
  capacity: warehouses.capacity,
  status: warehouses.status,
  createdAt: warehouses.createdAt,
  updatedAt: warehouses.updatedAt,
  spaceCount: spaceCountSql,
  allocatedCapacity: allocatedCapacitySql,
  used: usedSql,
};

export async function getWarehouses(filters: WarehouseFilters = {}) {
  const search = filters.search?.trim();

  const conditions: (SQL | undefined)[] = [
    filters.status ? eq(warehouses.status, filters.status) : undefined,

    search
      ? or(
          ilike(warehouses.name, `%${search}%`),
          ilike(warehouses.location, `%${search}%`),
        )
      : undefined,
  ];

  const rows = await db
    .select(warehouseColumns)
    .from(warehouses)
    .where(and(...conditions))
    .orderBy(desc(warehouses.createdAt));

  return rows.map(mapWarehouse);
}

export type WarehouseRow = Awaited<ReturnType<typeof getWarehouses>>[number];

export async function getWarehouseWithUsage(warehouseId: string) {
  const [row] = await db
    .select(warehouseColumns)
    .from(warehouses)
    .where(eq(warehouses.id, warehouseId))
    .limit(1);

  return row ? mapWarehouse(row) : null;
}
