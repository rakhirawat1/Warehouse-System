"use client";

import { useRouter } from "next/navigation";
import { Pencil } from "lucide-react";

import { updateWarehouseAction } from "../actions";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { Input, Label, Select } from "@/components/ui/input";
import { useAction } from "@/lib/use-action";

type EditWarehouseFormProps = {
  warehouse: {
    id: string;
    name: string;
    location: string;
    capacity: number;
    status: "ACTIVE" | "INACTIVE";
  };
  /** Capacity already given to storage spaces, and units currently stored. */
  allocatedCapacity: number;
  used: number;
};

export default function EditWarehouseForm({
  warehouse,
  allocatedCapacity,
  used,
}: EditWarehouseFormProps) {
  const router = useRouter();

  const update = useAction(updateWarehouseAction, {
    onSuccess: () => {
      router.push(`/warehouses/${warehouse.id}`);
      router.refresh();
    },
  });

  async function handleSubmit(formData: FormData) {
    await update.run(warehouse.id, {
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

        <Input
          id="name"
          name="name"
          type="text"
          defaultValue={warehouse.name}
          required
        />

        {update.fieldError("name") && (
          <p className="mt-1 text-sm text-danger">
            {update.fieldError("name")}
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="location">Location</Label>

        <Input
          id="location"
          name="location"
          type="text"
          defaultValue={warehouse.location}
          required
        />
      </div>

      <div>
        <Label htmlFor="capacity">Capacity</Label>

        <Input
          id="capacity"
          name="capacity"
          type="number"
          min={Math.max(1, allocatedCapacity)}
          defaultValue={warehouse.capacity}
          required
        />

        {allocatedCapacity > 0 && (
          <p className="mt-1 text-sm text-muted">
            Storage spaces already use {allocatedCapacity} units of this
            capacity, so it cannot be set lower than that.
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="status">Status</Label>

        <Select
          id="status"
          name="status"
          defaultValue={warehouse.status}
        >
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </Select>

        <p className="mt-1 text-sm text-muted">
          {used > 0
            ? `This warehouse holds ${used} units. Setting it to inactive keeps that stock and its history, but blocks new stock.`
            : "Inactive warehouses cannot receive new stock."}
        </p>
      </div>

      <Button
        type="submit"
        disabled={update.pending}
        icon={<Pencil className="h-4 w-4" />}
      >
        {update.pending ? "Saving..." : "Update Warehouse"}
      </Button>

      <FormMessage error={update.error} success={update.message} />
    </form>
  );
}
