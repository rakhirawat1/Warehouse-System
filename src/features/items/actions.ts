"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/action";
import { authorize } from "@/lib/auth/guards";

import { createItemSchema, updateItemSchema } from "./schemas";
import { createItem, deleteItem, updateItem } from "./service";

const itemId = z.string().uuid("Invalid item.");

function refresh() {
  revalidatePath("/", "layout");
}

export async function createItemAction(input: unknown) {
  return runAction(
    async () => {
      await authorize("item:create");

      const data = createItemSchema.parse(input);
      const item = await createItem(data);

      refresh();

      return { id: item.id, name: item.name, quantity: item.quantity };
    },
    (item) =>
      item.quantity > 0
        ? `"${item.name}" was created with ${item.quantity} units. Allocate them to storage spaces next.`
        : `"${item.name}" was created.`,
  );
}

export async function updateItemAction(id: string, input: unknown) {
  return runAction(
    async () => {
      await authorize("item:update");

      const data = updateItemSchema.parse(input);
      const item = await updateItem(itemId.parse(id), data);

      refresh();

      return { id: item.id, name: item.name };
    },
    (item) => `"${item.name}" was updated.`,
  );
}

export async function deleteItemAction(id: string) {
  return runAction(
    async () => {
      await authorize("item:delete");

      const item = await deleteItem(itemId.parse(id));

      refresh();

      return { name: item.name };
    },
    (item) => `"${item.name}" was deleted. Its movement history is kept.`,
  );
}
