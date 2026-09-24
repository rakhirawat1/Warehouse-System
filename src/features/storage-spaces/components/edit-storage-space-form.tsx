"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { updateStorageSpaceAction } from "../actions";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { Input, Label, Select } from "@/components/ui/input";
import {
  STORAGE_TYPES,
  STORAGE_TYPE_LABELS,
  type StorageType,
} from "@/lib/storage";
import { useAction } from "@/lib/use-action";

type EditStorageSpaceFormProps = {
  storageSpace: {
    id: string;
    warehouseId: string;
    name: string;
    storageType: StorageType;
    capacity: number;
  };
  used: number;
  /** The largest capacity the warehouse can still give this space. */
  maxCapacity: number;
};

export default function EditStorageSpaceForm({
  storageSpace,
  used,
  maxCapacity,
}: EditStorageSpaceFormProps) {
  const router = useRouter();

  const update = useAction(updateStorageSpaceAction, {
    onSuccess: () => {
      router.push(`/warehouses/${storageSpace.warehouseId}`);
      router.refresh();
    },
  });

  async function handleSubmit(formData: FormData) {
    await update.run(storageSpace.id, {
      name: formData.get("name"),
      storageType: formData.get("storageType"),
      capacity: Number(formData.get("capacity")),
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Storage Space Name</Label>

        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={storageSpace.name}
          required
        />
      </div>

      <div>
        <Label htmlFor="storageType">Storage Type</Label>

        <Select
          id="storageType"
          name="storageType"
          defaultValue={storageSpace.storageType}
        >
          {STORAGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {STORAGE_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>

        {used > 0 && (
          <p className="mt-1 text-sm text-muted">
            This space holds {used} units. The type can only be changed to one
            that still suits the items stored here.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="capacity">Capacity</Label>

        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={Math.max(1, used)}
          max={maxCapacity}
          defaultValue={storageSpace.capacity}
          required
        />

        <p className="mt-1 text-sm text-muted">
          Between {Math.max(1, used)} and {maxCapacity} units
          {used > 0 ? ` (${used} units are already stored here).` : "."}
        </p>

        {update.fieldError("capacity") && (
          <p className="mt-1 text-sm text-danger">
            {update.fieldError("capacity")}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={update.pending}
        icon={<Pencil className="h-4 w-4" />}
      >
        {update.pending ? "Saving..." : "Update Storage Space"}
      </Button>

      <FormMessage error={update.error} success={update.message} />
    </form>
  );
}
