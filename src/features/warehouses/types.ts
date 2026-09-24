import type { z } from "zod";

import type {
  createWarehouseSchema,
  updateWarehouseSchema,
} from "./schemas";

export type CreateWarehouseInput = z.infer<
  typeof createWarehouseSchema
>;

export type UpdateWarehouseInput = z.infer<
  typeof updateWarehouseSchema
>;