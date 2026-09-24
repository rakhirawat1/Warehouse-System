"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { updateItemAction } from "../actions";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import {
  FieldHint,
  Input,
  Label,
  Select,
  Textarea,
} from "@/components/ui/input";
import {
  STORAGE_TYPES,
  STORAGE_TYPE_LABELS,
  type StorageType,
} from "@/lib/storage";
import { useAction } from "@/lib/use-action";

type EditItemFormProps = {
  item: {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    requiredStorageType: StorageType;
    quantity: number;
  };
  allocatedQuantity: number;
};

export default function EditItemForm({
  item,
  allocatedQuantity,
}: EditItemFormProps) {
  const router = useRouter();

  const update = useAction(updateItemAction, {
    onSuccess: () => {
      router.push(`/items/${item.id}`);
      router.refresh();
    },
  });

  async function handleSubmit(formData: FormData) {
    await update.run(item.id, {
      name: formData.get("name"),
      sku: formData.get("sku"),
      description: formData.get("description"),
      requiredStorageType: formData.get("requiredStorageType"),
      quantity: formData.get("quantity"),
    });
  }

  return (
    <form action={handleSubmit} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-[1fr_200px]">
        <div>
          <Label htmlFor="name">Item name</Label>

          <Input
            id="name"
            name="name"
            type="text"
            defaultValue={item.name}
            required
          />

          {update.fieldError("name") && (
            <FieldHint error>{update.fieldError("name")}</FieldHint>
          )}
        </div>

        <div>
          <Label htmlFor="sku">Item code</Label>

          <Input
            id="sku"
            name="sku"
            type="text"
            defaultValue={item.sku}
            className="font-mono uppercase"
            required
          />

          <FieldHint error={Boolean(update.fieldError("sku"))}>
            {update.fieldError("sku") ??
              "Changing this changes the code people quote for the item."}
          </FieldHint>
        </div>
      </div>

      <div>
        <Label htmlFor="description">Description</Label>

        <Textarea
          id="description"
          name="description"
          defaultValue={item.description ?? ""}
          rows={4}
        />
      </div>

      <div>
        <Label htmlFor="requiredStorageType">Storage needed</Label>

        <Select
          id="requiredStorageType"
          name="requiredStorageType"
          defaultValue={item.requiredStorageType}
        >
          {STORAGE_TYPES.map((type) => (
            <option key={type} value={type}>
              {STORAGE_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>

        {allocatedQuantity > 0 && (
          <FieldHint>
            {allocatedQuantity} units are allocated at the moment. The storage
            type can only be changed if every storage space holding this item
            still matches the new type.
          </FieldHint>
        )}
      </div>

      <div>
        <Label htmlFor="quantity">Total quantity</Label>

        <Input
          id="quantity"
          name="quantity"
          type="number"
          min={allocatedQuantity}
          defaultValue={item.quantity}
          required
        />

        <FieldHint error={Boolean(update.fieldError("quantity"))}>
          {update.fieldError("quantity") ??
            (allocatedQuantity > 0
              ? `${allocatedQuantity} units are allocated to storage spaces, so the total cannot go below ${allocatedQuantity}.`
              : "No units are allocated yet, so any total is allowed.")}
        </FieldHint>
      </div>

      <FormMessage error={update.error} success={update.message} />

      <div className="flex justify-end gap-2 border-t border-border pt-5">
        <Button href={`/items/${item.id}`} variant="secondary" type="button">
          Cancel
        </Button>

        <Button
          type="submit"
          disabled={update.pending}
          icon={<Pencil className="h-4 w-4" />}
        >
          {update.pending ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}
