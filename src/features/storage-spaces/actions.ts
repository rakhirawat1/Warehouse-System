"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import { runAction } from "@/lib/action";
import { authorize } from "@/lib/auth/guards";

import {
  createStorageSpaceSchema,
  updateStorageSpaceSchema,
} from "./schemas";

import {
  createStorageSpace,
  deleteStorageSpace,
  updateStorageSpace,
} from "./service";

const storageSpaceId = z.string().uuid("Invalid storage space.");

function refresh() {
  revalidatePath("/", "layout");
}

export async function createStorageSpaceAction(input: unknown) {
  return runAction(
    async () => {
      await authorize("storageSpace:create");

      const data = createStorageSpaceSchema.parse(input);
      const storageSpace = await createStorageSpace(data);

      refresh();

      return {
        id: storageSpace.id,
        name: storageSpace.name,
        warehouseId: storageSpace.warehouseId,
      };
    },
    (storageSpace) => `"${storageSpace.name}" was added.`,
  );
}

export async function updateStorageSpaceAction(id: string, input: unknown) {
  return runAction(
    async () => {
      await authorize("storageSpace:update");

      const data = updateStorageSpaceSchema.parse(input);
      const storageSpace = await updateStorageSpace(
        storageSpaceId.parse(id),
        data,
      );

      refresh();

      return {
        id: storageSpace.id,
        name: storageSpace.name,
        warehouseId: storageSpace.warehouseId,
      };
    },
    (storageSpace) => `"${storageSpace.name}" was updated.`,
  );
}

export async function deleteStorageSpaceAction(id: string) {
  return runAction(
    async () => {
      await authorize("storageSpace:delete");

      const storageSpace = await deleteStorageSpace(
        storageSpaceId.parse(id),
      );

      refresh();

      return {
        name: storageSpace.name,
        warehouseId: storageSpace.warehouseId,
      };
    },
    (storageSpace) => `"${storageSpace.name}" was deleted.`,
  );
}
