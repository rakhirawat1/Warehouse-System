import { notFound } from "next/navigation";

import { requirePagePermission } from "@/lib/auth/guards";

import { getWarehouseWithUsage } from "@/features/warehouses/queries";
import EditWarehouseForm from "@/features/warehouses/components/edit-warehouse-form";
import BackLink from "@/components/ui/back-link";

type EditWarehousePageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditWarehousePage({
  params,
}: EditWarehousePageProps) {
  await requirePagePermission("warehouse:update");

  const { id } = await params;

  const warehouse = await getWarehouseWithUsage(id);

  if (!warehouse) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <BackLink href={`/warehouses/${warehouse.id}`}>
          Back to Warehouse
        </BackLink>

        <h1 className="mt-4 text-2xl text-primary">Edit Warehouse</h1>

        <p className="mt-1 text-sm text-muted">
          Update the warehouse information.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <EditWarehouseForm
          warehouse={{
            id: warehouse.id,
            name: warehouse.name,
            location: warehouse.location,
            capacity: warehouse.capacity,
            status: warehouse.status,
          }}
          allocatedCapacity={warehouse.allocatedCapacity}
          used={warehouse.used}
        />
      </section>
    </div>
  );
}
