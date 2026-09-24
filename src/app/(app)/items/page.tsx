import Link from "next/link";
import { Layers, Package, PackageCheck, Plus, X } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

import { getItems } from "@/features/items/queries";
import ItemTable from "@/features/items/components/item-table";

import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";

type ItemsPageProps = {
  searchParams: Promise<{ search?: string; filter?: string }>;
};

export default async function ItemsPage({ searchParams }: ItemsPageProps) {
  const actor = await requireAuth();

  const params = await searchParams;

  const search = params.search?.trim() || undefined;

  // Only the deep link from the alerts panel pre-filters the rows; the tabs
  // inside the table handle the everyday filtering.
  const onlyUnallocated = params.filter === "unallocated";

  const items = await getItems({
    search,
    stock: onlyUnallocated ? "unallocated" : undefined,
  });

  const allItems = search || onlyUnallocated ? await getItems() : items;

  const totalUnits = allItems.reduce((sum, item) => sum + item.quantity, 0);
  const allocatedUnits = allItems.reduce(
    (sum, item) => sum + item.allocated,
    0,
  );

  return (
    <PageTransition>
      <PageHeader
        action={
          can(actor.role, "item:create") && (
            <Button href="/items/new" icon={<Plus className="h-4 w-4" />}>
              Add Item
            </Button>
          )
        }
      />

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Items" value={allItems.length} icon={<Package className="h-5 w-5" />} />

        <StatCard
          label="Total units"
          value={totalUnits}
          icon={<Layers className="h-5 w-5" />}
          tone="info"
        />

        <StatCard
          label="Allocated"
          value={allocatedUnits}
          icon={<PackageCheck className="h-5 w-5" />}
          tone="success"
          hint="in storage spaces"
        />

        <StatCard
          label="Waiting to allocate"
          value={totalUnits - allocatedUnits}
          icon={<Package className="h-5 w-5" />}
          tone={totalUnits - allocatedUnits > 0 ? "warning" : "success"}
          hint="not in a storage space yet"
        />
      </Stagger>

      {(search || onlyUnallocated) && (
        <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
          <span className="text-muted">Showing</span>

          <span className="inline-flex items-center gap-2 rounded-full bg-accent-muted px-3 py-1 font-medium text-accent">
            {onlyUnallocated
              ? "units waiting to be allocated"
              : `matches for "${search}"`}

            <Link href="/items" aria-label="Clear filter">
              <X className="h-3.5 w-3.5" />
            </Link>
          </span>

          <span className="text-muted">
            {items.length} of {allItems.length} items
          </span>
        </div>
      )}

      <ItemTable
        items={items}
        canCreate={can(actor.role, "item:create")}
        canUpdate={can(actor.role, "item:update")}
        canDelete={can(actor.role, "item:delete")}
        canAllocate={can(actor.role, "stock:receive")}
        pageFilters={{
          search,
          filter: onlyUnallocated ? "unallocated" : undefined,
        }}
      />
    </PageTransition>
  );
}
