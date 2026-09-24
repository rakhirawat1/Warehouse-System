import type { z } from "zod";

import { createItemSchema, updateItemSchema } from "./schemas";

export type CreateItemInput = z.output<typeof createItemSchema>;

export type UpdateItemInput = z.output<typeof updateItemSchema>;
