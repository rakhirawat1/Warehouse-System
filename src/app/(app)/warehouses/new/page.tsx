import { requirePagePermission } from "@/lib/auth/guards";

import WarehouseForm from "@/features/warehouses/components/warehouse-form";
import BackLink from "@/components/ui/back-link";

export default async function CreateWarehousePage() {
  await requirePagePermission("warehouse:create");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <BackLink href="/warehouses">Back to Warehouses</BackLink>

        <h1 className="mt-4 text-2xl text-primary">Create Warehouse</h1>

        <p className="mt-1 text-sm text-muted">
          Add a warehouse, then divide its capacity into storage spaces.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <WarehouseForm />
      </section>
    </div>
  );
}
