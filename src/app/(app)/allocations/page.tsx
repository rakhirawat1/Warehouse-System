import { ArrowLeftRight, Boxes, Layers, Warehouse } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

import { getAllocations } from "@/features/allocations/queries";
import { getStorageSpacesWithUsage } from "@/features/storage-spaces/queries";
import AllocationTable from "@/features/allocations/components/allocation-table";

import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";

export default async function AllocationsPage() {
  const actor = await requireAuth();

  const [allocations, storageSpaces] = await Promise.all([
    getAllocations(),
    getStorageSpacesWithUsage(),
  ]);

  const totalStored = allocations.reduce(
    (total, allocation) => total + allocation.quantity,
    0,
  );

  const warehouseCount = new Set(
    allocations.map((allocation) => allocation.warehouseId),
  ).size;

  const perItem = new Map<string, number>();

  for (const allocation of allocations) {
    perItem.set(allocation.itemId, (perItem.get(allocation.itemId) ?? 0) + 1);
  }

  const splitItems = [...perItem.values()].filter((count) => count > 1).length;

  return (
    <PageTransition>
      <PageHeader
        action={
          <Button href="/items" variant="secondary">
            Allocate from an item
          </Button>
        }
      />

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Allocations"
          value={allocations.length}
          icon={<ArrowLeftRight className="h-5 w-5" />}
        />

        <StatCard
          label="Units stored"
          value={totalStored}
          icon={<Layers className="h-5 w-5" />}
          tone="success"
        />

        <StatCard
          label="Warehouses in use"
          value={warehouseCount}
          icon={<Warehouse className="h-5 w-5" />}
          tone="info"
        />

        <StatCard
          label="Items split across places"
          value={splitItems}
          icon={<Boxes className="h-5 w-5" />}
          tone={splitItems > 0 ? "warning" : "success"}
          hint="stored in more than one space"
        />
      </Stagger>

      <AllocationTable
        allocations={allocations}
        storageSpaces={storageSpaces}
        canMove={can(actor.role, "stock:transfer")}
        canAdjust={can(actor.role, "stock:adjust")}
        canDispatch={can(actor.role, "stock:dispatch")}
        emptyAction={
          <Button href="/items">Go to items</Button>
        }
      />
    </PageTransition>
  );
}
