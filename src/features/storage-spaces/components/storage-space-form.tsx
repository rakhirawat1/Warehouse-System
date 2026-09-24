"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createStorageSpaceAction } from "../actions";
import { suggestStorageSpaceAction } from "@/features/ai/actions";
import AIAssistBox from "@/features/ai/components/ai-assist-box";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import {
  STORAGE_TYPE_DESCRIPTIONS,
  STORAGE_TYPES,
  STORAGE_TYPE_LABELS,
  type StorageType,
} from "@/lib/storage";
import { useAction } from "@/lib/use-action";

type StorageSpaceFormProps = {
  warehouse: {
    id: string;
    name: string;
  };
  /** Warehouse capacity not yet given to another storage space. */
  availableCapacity: number;
};

export default function StorageSpaceForm({
  warehouse,
  availableCapacity,
}: StorageSpaceFormProps) {
  const router = useRouter();

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [storageType, setStorageType] = useState<StorageType>("NORMAL");

  const create = useAction(createStorageSpaceAction, {
    onSuccess: () => {
      router.push(`/warehouses/${warehouse.id}`);
      router.refresh();
    },
  });

  async function handleSubmit(formData: FormData) {
    await create.run({
      warehouseId: warehouse.id,
      name: formData.get("name"),
      description: formData.get("description"),
      storageType: formData.get("storageType"),
      capacity: Number(formData.get("capacity")),
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      {/* AI fills name, type and description only; capacity is always typed by the user. */}
      <AIAssistBox
        label="Describe the storage space and let AI suggest the details"
        placeholder='e.g. "Temperature controlled room for frozen food"'
        suggest={(prompt) =>
          suggestStorageSpaceAction({ prompt, warehouseId: warehouse.id })
        }
        onApply={(suggestion) => {
          setName(suggestion.name);
          setStorageType(suggestion.storageType);
          setDescription(suggestion.description);
        }}
      />

      <div>
        <Label htmlFor="name">Storage Space Name</Label>

        <Input
          id="name"
          name="name"
          type="text"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Rack A1"
          required
        />

        {create.fieldError("name") && (
          <p className="mt-1 text-sm text-danger">
            {create.fieldError("name")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="storageType">Storage Type</Label>

        <Select
          id="storageType"
          name="storageType"
          value={storageType}
          onChange={(event) =>
            setStorageType(event.target.value as StorageType)
          }
        >
          {STORAGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {STORAGE_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>

        <p className="mt-1 text-sm text-muted">
          Only items that need this kind of storage can be stored here.{" "}
          {STORAGE_TYPE_DESCRIPTIONS[storageType]}
        </p>
      </div>

      <div>
        <Label htmlFor="description">Description (optional)</Label>

        <Textarea
          id="description"
          name="description"
          rows={2}
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What this space is used for"
          maxLength={1000}
        />
      </div>

      <div>
        <Label htmlFor="capacity">Capacity</Label>

        <Input
          id="capacity"
          name="capacity"
          type="number"
          min="1"
          max={availableCapacity > 0 ? availableCapacity : undefined}
          placeholder="e.g. 500"
          required
          disabled={availableCapacity <= 0}
        />

        <p className="mt-1 text-sm text-muted">
          {availableCapacity > 0
            ? `${warehouse.name} has ${availableCapacity} units of capacity left to give to storage spaces.`
            : `${warehouse.name} has no capacity left. Increase the warehouse capacity first.`}
        </p>

        {create.fieldError("capacity") && (
          <p className="mt-1 text-sm text-danger">
            {create.fieldError("capacity")}
          </p>
        )}
      </div>

      <Button
        type="submit"
        disabled={create.pending || availableCapacity <= 0}
        icon={<Plus className="h-4 w-4" />}
      >
        {create.pending ? "Creating..." : "Create Storage Space"}
      </Button>

      <FormMessage error={create.error} success={create.message} />
    </form>
  );
}
