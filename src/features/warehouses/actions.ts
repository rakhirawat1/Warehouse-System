"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/action";
import { authorize } from "@/lib/auth/guards";

import { createWarehouseSchema, updateWarehouseSchema } from "./schemas";
import { createWarehouse, deleteWarehouse, updateWarehouse } from "./service";

const warehouseId = z.string().uuid("Invalid warehouse.");

function refresh() {
  revalidatePath("/", "layout");
}

export async function createWarehouseAction(input: unknown) {
  return runAction(
    async () => {
      await authorize("warehouse:create");

      const data = createWarehouseSchema.parse(input);
      const warehouse = await createWarehouse(data);

      refresh();

      return { id: warehouse.id, name: warehouse.name };
    },
    (warehouse) => `"${warehouse.name}" was created.`,
  );
}

export async function updateWarehouseAction(id: string, input: unknown) {
  return runAction(
    async () => {
      await authorize("warehouse:update");

      const data = updateWarehouseSchema.parse(input);
      const warehouse = await updateWarehouse(warehouseId.parse(id), data);

      refresh();

      return {
        id: warehouse.id,
        name: warehouse.name,
        status: warehouse.status,
      };
    },
    (warehouse) =>
      warehouse.status === "INACTIVE"
        ? `"${warehouse.name}" is now inactive. Its stock and history are kept, but no new stock can be stored there.`
        : `"${warehouse.name}" was updated.`,
  );
}

export async function deleteWarehouseAction(id: string) {
  return runAction(
    async () => {
      await authorize("warehouse:delete");

      const warehouse = await deleteWarehouse(warehouseId.parse(id));

      refresh();

      return { name: warehouse.name };
    },
    (warehouse) =>
      `"${warehouse.name}" was deleted. Its movement history is kept.`,
  );
}
