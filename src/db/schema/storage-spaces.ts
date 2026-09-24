import {
  check,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { storageTypeEnum } from "./enums";
import { warehouses } from "./warehouses";

export const storageSpaces = pgTable(
  "storage_spaces",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    warehouseId: uuid("warehouse_id")
      .notNull()
      .references(() => warehouses.id, {
        onDelete: "restrict",
      }),

    name: varchar("name", { length: 150 }).notNull(),

    description: text("description"),

    storageType: storageTypeEnum("storage_type")
      .default("NORMAL")
      .notNull(),

    capacity: integer("capacity").notNull(),

    createdAt: timestamp("created_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),

    updatedAt: timestamp("updated_at", {
      withTimezone: true,
    })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      "storage_spaces_capacity_positive",
      sql`${table.capacity} > 0`
    ),
    // Unique per warehouse, ignoring case. Different warehouses may reuse a name.
    uniqueIndex("storage_spaces_warehouse_name_unique").on(
      table.warehouseId,
      sql`LOWER(${table.name})`
    ),
  ]
);