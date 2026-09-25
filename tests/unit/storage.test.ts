import test from "node:test";
import assert from "node:assert/strict";

import {
  canStore,
  storageMismatchMessage,
} from "../../src/lib/storage";

test("NORMAL items can be stored in NORMAL, COLD_STORAGE and SECURE spaces", () => {
  assert.equal(canStore("NORMAL", "NORMAL"), true);
  assert.equal(canStore("NORMAL", "COLD_STORAGE"), true);
  assert.equal(canStore("NORMAL", "SECURE"), true);
});

test("NORMAL items cannot be stored in HAZARDOUS spaces", () => {
  assert.equal(canStore("NORMAL", "HAZARDOUS"), false);
});

test("COLD_STORAGE items require COLD_STORAGE", () => {
  assert.equal(canStore("COLD_STORAGE", "COLD_STORAGE"), true);
  assert.equal(canStore("COLD_STORAGE", "NORMAL"), false);
  assert.equal(canStore("COLD_STORAGE", "SECURE"), false);
});

test("SECURE items require SECURE storage", () => {
  assert.equal(canStore("SECURE", "SECURE"), true);
  assert.equal(canStore("SECURE", "NORMAL"), false);
});

test("HAZARDOUS items require HAZARDOUS storage", () => {
  assert.equal(canStore("HAZARDOUS", "HAZARDOUS"), true);
  assert.equal(canStore("HAZARDOUS", "NORMAL"), false);
});

test("storage mismatch message explains the problem", () => {
  const message = storageMismatchMessage(
    "Milk",
    "COLD_STORAGE",
    "Shelf A",
    "NORMAL",
  );

  assert.match(message, /Milk/);
  assert.match(message, /cold storage/);
  assert.match(message, /Shelf A/);
  assert.match(message, /normal/);
});
