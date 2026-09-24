import {
  check,
  index,
  integer,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import { items } from "./items";
import { storageSpaces } from "./storage-spaces";

/** Units of one item in one space. At most one row per (item, space) pair. */
export const allocations = pgTable(
  "allocations",
  {
    id: uuid("id").defaultRandom().primaryKey(),

    itemId: uuid("item_id")
      .notNull()
      .references(() => items.id, {
        onDelete: "restrict",
      }),

    storageSpaceId: uuid("storage_space_id")
      .notNull()
      .references(() => storageSpaces.id, {
        onDelete: "restrict",
      }),

    quantity: integer("quantity").notNull(),

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
    uniqueIndex("allocations_item_space_unique").on(
      table.itemId,
      table.storageSpaceId,
    ),

    index("allocations_storage_space_idx").on(table.storageSpaceId),

    check("allocations_quantity_positive", sql`${table.quantity} > 0`),
  ],
);
