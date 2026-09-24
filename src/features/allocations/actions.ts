"use server";

import { revalidatePath } from "next/cache";

import { runAction } from "@/lib/action";
import { authorize } from "@/lib/auth/guards";

import {
  adjustAllocationSchema,
  allocateStockSchema,
  dispatchStockSchema,
  transferStockSchema,
} from "./schemas";

import {
  adjustAllocation,
  allocateStock,
  dispatchStock,
  transferStock,
} from "./service";

function refresh() {
  // Stock changes affect the dashboard, warehouses, items and allocations,
  // so the whole app shell is revalidated.
  revalidatePath("/", "layout");
}

export async function allocateStockAction(input: unknown) {
  return runAction(
    async () => {
      const actor = await authorize("stock:receive");
      const data = allocateStockSchema.parse(input);
      const result = await allocateStock(data, actor);

      refresh();

      return result;
    },
    (result) =>
      result.lines.length === 1
        ? `${result.quantity} units of "${result.itemName}" allocated to ${result.lines[0].warehouseName} / ${result.lines[0].storageSpaceName}.`
        : `${result.quantity} units of "${result.itemName}" allocated across ${result.lines.length} storage spaces.`,
  );
}

export async function transferStockAction(input: unknown) {
  return runAction(
    async () => {
      const actor = await authorize("stock:transfer");
      const data = transferStockSchema.parse(input);
      const result = await transferStock(data, actor);

      refresh();

      return result;
    },
    (result) =>
      `${result.quantity} units of "${result.itemName}" moved from ${result.fromName} to ${result.toName}.`,
  );
}

export async function adjustAllocationAction(input: unknown) {
  return runAction(
    async () => {
      const actor = await authorize("stock:adjust");
      const data = adjustAllocationSchema.parse(input);
      const result = await adjustAllocation(data, actor);

      refresh();

      return result;
    },
    (result) =>
      result.unchanged
        ? "Nothing changed: the quantity was already correct."
        : `Quantity of "${result.itemName}" changed from ${result.before} to ${result.after}.`,
  );
}

export async function dispatchStockAction(input: unknown) {
  return runAction(
    async () => {
      const actor = await authorize("stock:dispatch");
      const data = dispatchStockSchema.parse(input);
      const result = await dispatchStock(data, actor);

      refresh();

      return result;
    },
    (result) =>
      `${result.quantity} units of "${result.itemName}" dispatched.`,
  );
}
