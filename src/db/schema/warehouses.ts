import {
  check,
  integer,
  pgTable,
  timestamp,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { warehouseStatusEnum } from "./enums";

export const warehouses = pgTable(
  "warehouses",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 150 }).notNull(),

    location: varchar("location", { length: 255 }).notNull(),

    capacity: integer("capacity").notNull(),

    status: warehouseStatusEnum("status")
      .default("ACTIVE")
      .notNull(),

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
      "warehouses_capacity_positive",
      sql`${table.capacity} > 0`
    ),
  ]
);