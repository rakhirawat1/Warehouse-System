import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { user } from "./auth";
import { items } from "./items";
import { storageSpaces } from "./storage-spaces";
import { warehouses } from "./warehouses";
import { movementTypeEnum } from "./enums";

/**
 * Append-only movement log. Names are copied at write time and foreign keys
 * use ON DELETE SET NULL, so history survives deletes. Rows written by one
 * operation share a batch id.
 */
export const stockMovements = pgTable(
  "stock_movements",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    batchId: uuid("batch_id").notNull(),

    type: movementTypeEnum("type").notNull(),

    itemId: uuid("item_id").references(() => items.id, {
      onDelete: "set null",
    }),

    itemName: varchar("item_name", { length: 150 }).notNull(),

    fromSpaceId: uuid("from_space_id").references(() => storageSpaces.id, {
      onDelete: "set null",
    }),

    fromLabel: varchar("from_label", { length: 300 }),

    fromWarehouseId: uuid("from_warehouse_id").references(
      () => warehouses.id,
      { onDelete: "set null" },
    ),

    toSpaceId: uuid("to_space_id").references(() => storageSpaces.id, {
      onDelete: "set null",
    }),

    toLabel: varchar("to_label", { length: 300 }),

    toWarehouseId: uuid("to_warehouse_id").references(() => warehouses.id, {
      onDelete: "set null",
    }),

    quantity: integer("quantity").notNull(),

    note: text("note"),

    actorId: text("actor_id").references(() => user.id, {
      onDelete: "set null",
    }),

    actorName: varchar("actor_name", { length: 150 }).notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    index("stock_movements_created_at_idx").on(table.createdAt),
    index("stock_movements_item_idx").on(table.itemId),
    index("stock_movements_batch_idx").on(table.batchId),

    check("stock_movements_quantity_positive", sql`${table.quantity} > 0`),
  ],
);
