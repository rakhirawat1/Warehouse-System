import { and, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { stockMovements } from "@/db/schema";

import type { MovementType } from "./types";

export type MovementFilters = {
  type?: MovementType;
  search?: string;
  itemId?: string;
  warehouseId?: string;
  /** Exact name of the person who made the movement. */
  actorName?: string;
  /** Inclusive calendar dates, YYYY-MM-DD. */
  from?: string;
  to?: string;
  limit?: number;
};

/** Movement history. Rows keep copied names, so they stay readable after deletes. */
export async function getMovements(filters: MovementFilters = {}) {
  const search = filters.search?.trim();

  const conditions: (SQL | undefined)[] = [
    filters.type ? eq(stockMovements.type, filters.type) : undefined,
    filters.itemId ? eq(stockMovements.itemId, filters.itemId) : undefined,

    filters.warehouseId
      ? or(
          eq(stockMovements.fromWarehouseId, filters.warehouseId),
          eq(stockMovements.toWarehouseId, filters.warehouseId),
        )
      : undefined,

    filters.actorName
      ? eq(stockMovements.actorName, filters.actorName)
      : undefined,

    filters.from
      ? sql`${stockMovements.createdAt} >= ${filters.from}::date`
      : undefined,

    // "to" is inclusive: everything before the start of the following day.
    filters.to
      ? sql`${stockMovements.createdAt} < ${filters.to}::date + 1`
      : undefined,

    search
      ? or(
          ilike(stockMovements.itemName, `%${search}%`),
          ilike(stockMovements.fromLabel, `%${search}%`),
          ilike(stockMovements.toLabel, `%${search}%`),
          ilike(stockMovements.actorName, `%${search}%`),
        )
      : undefined,
  ];

  return db
    .select()
    .from(stockMovements)
    .where(and(...conditions))
    .orderBy(desc(stockMovements.createdAt))
    .limit(filters.limit ?? 100);
}

export type MovementRow = Awaited<ReturnType<typeof getMovements>>[number];

export async function getMovementTotals() {
  const rows = await db
    .select({
      type: stockMovements.type,
      operations: sql<number>`COUNT(DISTINCT ${stockMovements.batchId})`,
      units: sql<number>`COALESCE(SUM(${stockMovements.quantity}), 0)`,
    })
    .from(stockMovements)
    .groupBy(stockMovements.type);

  return rows.map((row) => ({
    ...row,
    operations: Number(row.operations),
    units: Number(row.units),
  }));
}

export async function getMovementActors() {
  const rows = await db
    .selectDistinct({ actorName: stockMovements.actorName })
    .from(stockMovements)
    .orderBy(stockMovements.actorName);

  return rows.map((row) => row.actorName);
}
