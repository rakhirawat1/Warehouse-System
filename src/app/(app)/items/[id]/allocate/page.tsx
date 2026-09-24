import { notFound, redirect } from "next/navigation";
import { Layers, PackageCheck, PackageOpen } from "lucide-react";

import { requirePagePermission } from "@/lib/auth/guards";

import { getItemWithStock } from "@/features/items/queries";
import { getStorageSpacesWithUsage } from "@/features/storage-spaces/queries";
import AllocateItemForm from "@/features/allocations/components/allocate-item-form";

import BackLink from "@/components/ui/back-link";
import Badge from "@/components/ui/badge";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";

type AllocateItemPageProps = {
  params: Promise<{ id: string }>;
};

export default async function AllocateItemPage({
  params,
}: AllocateItemPageProps) {
  await requirePagePermission("stock:receive");

  const { id } = await params;

  const item = await getItemWithStock(id);

  if (!item) {
    notFound();
  }

  // Nothing left to place: the detail page is the useful screen instead.
  if (item.remaining === 0) {
    redirect(`/items/${item.id}`);
  }

  const storageSpaces = await getStorageSpacesWithUsage();

  return (
    <PageTransition>
      <BackLink href={`/items/${item.id}`}>Back to {item.name}</BackLink>

      <div className="mt-4 mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-primary">Allocate Item</h2>

          <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted">
            Allocate {item.name}
            <Badge variant="outline" className="font-mono">
              {item.sku}
            </Badge>
            to storage spaces.
          </p>
        </div>

        <Stagger className="grid w-full max-w-2xl gap-4 sm:grid-cols-3">
          <StatCard label="Total quantity" value={item.quantity} icon={<Layers className="h-5 w-5" />} />

          <StatCard
            label="Already allocated"
            value={item.allocated}
            icon={<PackageCheck className="h-5 w-5" />}
            tone="success"
          />

          <StatCard
            label="Remaining"
            value={item.remaining}
            icon={<PackageOpen className="h-5 w-5" />}
            tone="warning"
          />
        </Stagger>
      </div>

      <AllocateItemForm
        item={{
          id: item.id,
          name: item.name,
          sku: item.sku,
          requiredStorageType: item.requiredStorageType,
          quantity: item.quantity,
          allocated: item.allocated,
          remaining: item.remaining,
        }}
        storageSpaces={storageSpaces}
      />
    </PageTransition>
  );
}
