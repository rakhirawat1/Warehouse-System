import type { z } from "zod";

import {
  adjustAllocationSchema,
  allocateStockSchema,
  dispatchStockSchema,
  transferStockSchema,
} from "./schemas";

export type AllocateStockInput = z.output<typeof allocateStockSchema>;

export type TransferStockInput = z.output<typeof transferStockSchema>;

export type AdjustAllocationInput = z.output<typeof adjustAllocationSchema>;

export type DispatchStockInput = z.output<typeof dispatchStockSchema>;
