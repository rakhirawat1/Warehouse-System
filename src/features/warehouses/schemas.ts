import { z } from "zod";

export const warehouseSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Warehouse name is required")
    .max(150, "Warehouse name must be 150 characters or less"),

  location: z
    .string()
    .trim()
    .min(1, "Warehouse location is required")
    .max(255, "Warehouse location must be 255 characters or less"),

  capacity: z
    .number()
    .int("Capacity must be a whole number")
    .positive("Capacity must be greater than 0"),

  status: z.enum(["ACTIVE", "INACTIVE"]),
});

export const createWarehouseSchema = warehouseSchema;

export const updateWarehouseSchema = warehouseSchema.partial();