import test from "node:test";
import assert from "node:assert/strict";

import {
  can,
  toRole,
} from "../../src/lib/auth/permissions";

test("admin can delete warehouses", () => {
  assert.equal(can("admin", "warehouse:delete"), true);
});

test("staff cannot delete warehouses", () => {
  assert.equal(can("staff", "warehouse:delete"), false);
});

test("admin can manage users", () => {
  assert.equal(can("admin", "users:manage"), true);
});

test("staff cannot manage users", () => {
  assert.equal(can("staff", "users:manage"), false);
});

test("staff can create items", () => {
  assert.equal(can("staff", "item:create"), true);
});


test("missing role is denied", () => {
  assert.equal(can(null, "warehouse:create"), false);
  assert.equal(can(undefined, "warehouse:create"), false);
});

test("toRole normalizes unknown values to staff", () => {
  assert.equal(toRole("admin"), "admin");
  assert.equal(toRole("staff"), "staff");
  assert.equal(toRole("unknown"), "staff");
  assert.equal(toRole(undefined), "staff");
});
