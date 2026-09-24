import { pgEnum } from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "ADMIN",
  "STAFF",
]);

export const warehouseStatusEnum = pgEnum("warehouse_status", [
  "ACTIVE",
  "INACTIVE",
]);

export const storageTypeEnum = pgEnum("storage_type", [
  "NORMAL",
  "COLD_STORAGE",
  "SECURE",
  "HAZARDOUS",
]);

export const movementTypeEnum = pgEnum("movement_type", [
  "RECEIPT",
  "TRANSFER",
  "ADJUSTMENT",
  "DISPATCH",
]);
