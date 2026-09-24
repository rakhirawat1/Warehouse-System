import { notFound } from "next/navigation";

import { requirePagePermission } from "@/lib/auth/guards";

import { getItemWithStock } from "@/features/items/queries";
import EditItemForm from "@/features/items/components/edit-item-form";
import BackLink from "@/components/ui/back-link";

type EditItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditItemPage({ params }: EditItemPageProps) {
  await requirePagePermission("item:update");

  const { id } = await params;

  const item = await getItemWithStock(id);

  if (!item) {
    notFound();
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <BackLink href={`/items/${item.id}`}>Back to Item</BackLink>

        <h1 className="mt-4 text-2xl text-primary">Edit Item</h1>

        <p className="mt-1 text-sm text-muted">
          Update the item information.
        </p>
      </div>

      <section className="rounded-xl border border-border bg-surface p-6 shadow-card">
        <EditItemForm
          item={{
            id: item.id,
            name: item.name,
            sku: item.sku,
            description: item.description,
            requiredStorageType: item.requiredStorageType,
            quantity: item.quantity,
          }}
          allocatedQuantity={item.allocated}
        />
      </section>
    </div>
  );
}
