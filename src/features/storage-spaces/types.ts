import type { z } from "zod";

import {
  createStorageSpaceSchema,
  updateStorageSpaceSchema,
} from "./schemas";

export type CreateStorageSpaceInput =
  z.infer<typeof createStorageSpaceSchema>;

export type UpdateStorageSpaceInput =
  z.infer<typeof updateStorageSpaceSchema>;