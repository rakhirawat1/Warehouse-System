import test from "node:test";
import assert from "node:assert/strict";

import {
  itemSchema,
  suggestSku,
} from "../../src/features/items/schemas";

test("valid item passes validation", () => {
  const result = itemSchema.safeParse({
    name: "Laptop",
    sku: "lap-001",
    description: "Office laptop",
    quantity: 50,
    requiredStorageType: "NORMAL",
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.sku, "LAP-001");
    assert.equal(result.data.quantity, 50);
  }
});

test("negative quantity is rejected", () => {
  const result = itemSchema.safeParse({
    name: "Laptop",
    sku: "LAP-001",
    quantity: -5,
    requiredStorageType: "NORMAL",
  });

  assert.equal(result.success, false);
});

test("invalid SKU is rejected", () => {
  const result = itemSchema.safeParse({
    name: "Laptop",
    sku: "@@@",
    quantity: 10,
    requiredStorageType: "NORMAL",
  });

  assert.equal(result.success, false);
});

test("empty item name is rejected", () => {
  const result = itemSchema.safeParse({
    name: "",
    sku: "LAP-001",
    quantity: 10,
    requiredStorageType: "NORMAL",
  });

  assert.equal(result.success, false);
});

test("SKU is converted to uppercase", () => {
  const result = itemSchema.safeParse({
    name: "Laptop",
    sku: "lap-xyz",
    quantity: 10,
    requiredStorageType: "NORMAL",
  });

  assert.equal(result.success, true);

  if (result.success) {
    assert.equal(result.data.sku, "LAP-XYZ");
  }
});

test("SKU suggestion is generated from item name", () => {
  assert.equal(suggestSku("Laptop Computer", 1), "LAP-001");
  assert.equal(suggestSku("Cold Storage Box", 12), "COL-012");
});

test("SKU suggestion uses ITM when name has no usable characters", () => {
  assert.equal(suggestSku("!!!", 3), "ITM-003");
});
