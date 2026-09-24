import { notFound } from "next/navigation";

import { requirePagePermission } from "@/lib/auth/guards";

import { getWarehouseWithUsage } from "@/features/warehouses/queries";
import { getStorageSpacesWithUsage } from "@/features/storage-spaces/queries";
import EditStorageSpaceForm from "@/features/storage-spaces/components/edit-storage-space-form";
import BackLink from "@/components/ui/back-link";

type EditStorageSpacePageProps = {
  params: Promise<{ id: string; storageSpaceId: string }>;
};

export default async function EditStorageSpacePage({
  params,
}: EditStorageSpacePageProps) {
  await requirePagePermission("storageSpace:update");

  const { id, storageSpaceId } = await params;

  const [warehouse, spaces] = await Promise.all([
    getWarehouseWithUsage(id),
    getStorageSpacesWithUsage({ storageSpaceId }),
  ]);

  const storageSpace = spaces[0];

  if (!warehouse || !storageSpace || storageSpace.warehouseId !== id) {
    notFound();
  }

  // The space may grow into the capacity that is not used by other spaces.
  const maxCapacity =
    warehouse.unassignedCapacity + storageSpace.capacity;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <BackLink href={`/warehouses/${warehouse.id}`}>
          Back to {warehouse.name}
        </BackLink>

        <h1 className="mt-4 text-2xl text-primary">Edit Storage Space</h1>

        <p className="mt-1 text-sm text-muted">
          Update the storage space information.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <EditStorageSpaceForm
          storageSpace={{
            id: storageSpace.id,
            warehouseId: storageSpace.warehouseId,
            name: storageSpace.name,
            storageType: storageSpace.storageType,
            capacity: storageSpace.capacity,
          }}
          used={storageSpace.used}
          maxCapacity={maxCapacity}
        />
      </section>
    </div>
  );
}
