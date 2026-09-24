import { z } from "zod";

export const storageSpaceSchema = z.object({
  warehouseId: z
    .string()
    .uuid("Invalid warehouse ID"),

  name: z
    .string()
    .trim()
    .min(1, "Storage space name is required")
    .max(
      150,
      "Storage space name must be 150 characters or less"
    ),

  description: z
    .string()
    .trim()
    .max(1000, "Description must be 1000 characters or less")
    .nullish()
    .transform((value) => value || null),

  storageType: z.enum([
    "NORMAL",
    "COLD_STORAGE",
    "SECURE",
    "HAZARDOUS",
  ]),

  capacity: z
    .number()
    .int("Capacity must be a whole number")
    .positive("Capacity must be greater than 0"),
});

export const createStorageSpaceSchema =
  storageSpaceSchema;

export const updateStorageSpaceSchema =
  storageSpaceSchema
    .omit({
      warehouseId: true,
    })
    .partial();