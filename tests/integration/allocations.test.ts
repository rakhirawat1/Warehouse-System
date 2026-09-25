import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import { itemSchema } from "../../src/features/items/schemas";
import { allocateStockSchema } from "../../src/features/allocations/schemas";
import { canStore } from "../../src/lib/storage";

test("inventory allocation flow accepts a compatible item and storage space", () => {
  const item = itemSchema.safeParse({
    name: "Milk",
    sku: "MILK-001",
    quantity: 100,
    requiredStorageType: "COLD_STORAGE",
  });

  assert.equal(item.success, true);

  const compatible = canStore("COLD_STORAGE", "COLD_STORAGE");

  assert.equal(compatible, true);

  const allocation = allocateStockSchema.safeParse({
    itemId: randomUUID(),
    lines: [
      {
        storageSpaceId: randomUUID(),
        quantity: 40,
      },
      {
        storageSpaceId: randomUUID(),
        quantity: 30,
      },
    ],
  });

  assert.equal(allocation.success, true);
});

test("inventory allocation flow rejects incompatible storage", () => {
  const itemType = "COLD_STORAGE";
  const storageType = "NORMAL";

  assert.equal(canStore(itemType, storageType), false);
});
