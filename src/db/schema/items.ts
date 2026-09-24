import { sql } from "drizzle-orm";
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

import { storageTypeEnum } from "./enums";

/**
 * `quantity` is the total the business owns; SUM(allocations.quantity) is how
 * much is placed. Services and database triggers keep allocated <= quantity.
 */
export const items = pgTable(
  "items",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    name: varchar("name", { length: 150 }).notNull(),

    /** Short human code such as LAP-001, unique ignoring case. */
    sku: varchar("sku", { length: 40 }).notNull(),

    description: text("description"),

    quantity: integer("quantity").notNull().default(0),

    /** Items can only go in spaces whose type is allowed for this requirement. */
    requiredStorageType: storageTypeEnum("required_storage_type")
      .default("NORMAL")
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
    check("items_quantity_not_negative", sql`${table.quantity} >= 0`),
    uniqueIndex("items_sku_unique").on(sql`UPPER(${table.sku})`),
  ],
);
