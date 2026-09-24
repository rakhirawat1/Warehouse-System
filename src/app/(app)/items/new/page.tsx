import { requirePagePermission } from "@/lib/auth/guards";

import { getItems } from "@/features/items/queries";
import ItemForm from "@/features/items/components/item-form";
import BackLink from "@/components/ui/back-link";
import PageTransition from "@/components/motion/page-transition";

export default async function CreateItemPage() {
  await requirePagePermission("item:create");

  // The suggested code continues the numbering rather than restarting at 1.
  const existing = await getItems();

  return (
    <PageTransition className="mx-auto max-w-3xl">
      <BackLink href="/items">Back to Items</BackLink>

      <h2 className="mt-4 text-xl font-semibold text-primary">Add Item</h2>

      <p className="mt-1 text-sm text-muted">
        Record the item and how many units the business owns. Nothing is placed
        in a storage space yet — you allocate the units in the next step.
      </p>

      <section className="mt-6 rounded-xl border border-border bg-surface p-6 shadow-card">
        <ItemForm nextSequence={existing.length + 1} />
      </section>
    </PageTransition>
  );
}
