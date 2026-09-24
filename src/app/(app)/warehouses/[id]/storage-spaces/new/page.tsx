import { notFound } from "next/navigation";

import { requirePagePermission } from "@/lib/auth/guards";

import { getWarehouseWithUsage } from "@/features/warehouses/queries";
import StorageSpaceForm from "@/features/storage-spaces/components/storage-space-form";
import BackLink from "@/components/ui/back-link";

type CreateStorageSpacePageProps = {
  params: Promise<{ id: string }>;
};

export default async function CreateStorageSpacePage({
  params,
}: CreateStorageSpacePageProps) {
  await requirePagePermission("storageSpace:create");

  const { id } = await params;

  const warehouse = await getWarehouseWithUsage(id);

  if (!warehouse) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <BackLink href={`/warehouses/${warehouse.id}`}>
          Back to {warehouse.name}
        </BackLink>

        <h1 className="mt-4 text-2xl text-primary">Add Storage Space</h1>

        <p className="mt-1 text-sm text-muted">
          A storage space takes part of the warehouse capacity and holds items
          of one storage type.
        </p>
      </div>

      {warehouse.status !== "ACTIVE" ? (
        <div className="rounded-lg border border-warning-muted bg-warning-muted p-4">
          <p className="text-sm text-warning">
            {warehouse.name} is inactive, so storage spaces cannot be added.
            Set the warehouse to active first.
          </p>
        </div>
      ) : (
        <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
          <StorageSpaceForm
            warehouse={{ id: warehouse.id, name: warehouse.name }}
            availableCapacity={warehouse.unassignedCapacity}
          />
        </section>
      )}
    </div>
  );
}
