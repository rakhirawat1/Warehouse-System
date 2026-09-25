import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

import {
  allocateStockSchema,
  transferStockSchema,
  adjustAllocationSchema,
  dispatchStockSchema,
} from "../../src/features/allocations/schemas";

test("valid split allocation passes validation", () => {
  const result = allocateStockSchema.safeParse({
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
    note: "Split across two storage spaces",
  });

  assert.equal(result.success, true);
});

test("allocation rejects zero quantity", () => {
  const result = allocateStockSchema.safeParse({
    itemId: randomUUID(),
    lines: [
      {
        storageSpaceId: randomUUID(),
        quantity: 0,
      },
    ],
  });

  assert.equal(result.success, false);
});

test("allocation rejects negative quantity", () => {
  const result = allocateStockSchema.safeParse({
    itemId: randomUUID(),
    lines: [
      {
        storageSpaceId: randomUUID(),
        quantity: -10,
      },
    ],
  });

  assert.equal(result.success, false);
});

test("allocation rejects duplicate storage spaces", () => {
  const storageSpaceId = randomUUID();

  const result = allocateStockSchema.safeParse({
    itemId: randomUUID(),
    lines: [
      {
        storageSpaceId,
        quantity: 20,
      },
      {
        storageSpaceId,
        quantity: 30,
      },
    ],
  });

  assert.equal(result.success, false);
});

test("transfer schema accepts valid data", () => {
  const result = transferStockSchema.safeParse({
    allocationId: randomUUID(),
    destinationStorageSpaceId: randomUUID(),
    quantity: 10,
    note: null,
  });

  assert.equal(result.success, true);
});

test("adjustment schema rejects invalid allocation id", () => {
  const result = adjustAllocationSchema.safeParse({
    allocationId: "invalid-id",
    quantity: 10,
    note: null,
  });

  assert.equal(result.success, false);
});

test("dispatch can be submitted without quantity", () => {
  const result = dispatchStockSchema.safeParse({
    allocationId: randomUUID(),
    quantity: null,
    note: "Dispatch all",
  });

  assert.equal(result.success, true);
});
