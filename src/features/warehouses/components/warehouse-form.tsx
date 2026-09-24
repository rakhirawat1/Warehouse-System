"use client";

import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";

import { createWarehouseAction } from "../actions";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { Input, Label, Select } from "@/components/ui/input";
import { useAction } from "@/lib/use-action";

export default function WarehouseForm() {
  const router = useRouter();

  const create = useAction(createWarehouseAction, {
    onSuccess: (warehouse) => {
      router.push(`/warehouses/${warehouse.id}`);
      router.refresh();
    },
  });

  async function handleSubmit(formData: FormData) {
    await create.run({
      name: formData.get("name"),
      location: formData.get("location"),
      capacity: Number(formData.get("capacity")),
      status: formData.get("status"),
    });
  }

  return (
    <form action={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Warehouse Name</Label>

        <Input id="name" name="name" type="text" required />

        {create.fieldError("name") && (
          <p className="mt-1 text-sm text-danger">
            {create.fieldError("name")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="location">Location</Label>

        <Input id="location" name="location" type="text" required />

        {create.fieldError("location") && (
          <p className="mt-1 text-sm text-danger">
            {create.fieldError("location")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="capacity">Capacity</Label>

        <Input
          id="capacity"
          name="capacity"
          type="number"
          min="1"
          required
        />

        <p className="mt-1 text-sm text-muted">
          Total units this warehouse can hold. Storage spaces share this
          capacity between them.
        </p>

        {create.fieldError("capacity") && (
          <p className="mt-1 text-sm text-danger">
            {create.fieldError("capacity")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="status">Status</Label>

        <Select id="status" name="status" defaultValue="ACTIVE">
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>

        <p className="mt-1 text-sm text-muted">
          Inactive warehouses keep their stock and history, but cannot receive
          new stock.
        </p>
      </div>

      <Button
        type="submit"
        disabled={create.pending}
        icon={<Plus className="h-4 w-4" />}
      >
        {create.pending ? "Creating..." : "Create Warehouse"}
      </Button>

      <FormMessage error={create.error} success={create.message} />
    </form>
  );
}
