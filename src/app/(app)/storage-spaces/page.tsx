import { Boxes, LayoutGrid, PackageOpen, TriangleAlert } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

import { getStorageSpacesWithUsage } from "@/features/storage-spaces/queries";
import StorageSpaceTable from "@/features/storage-spaces/components/storage-space-table";

import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";

export default async function StorageSpacesPage() {
  const actor = await requireAuth();

  const storageSpaces = await getStorageSpacesWithUsage();

  const totals = storageSpaces.reduce(
    (sum, space) => ({
      capacity: sum.capacity + space.capacity,
      used: sum.used + space.used,
    }),
    { capacity: 0, used: 0 },
  );

  const nearlyFull = storageSpaces.filter(
    (space) => space.usedPercent >= 90,
  ).length;

  return (
    <PageTransition>
      <PageHeader
        action={
          can(actor.role, "storageSpace:create") && (
            <Button href="/warehouses" variant="secondary">
              Add one from a warehouse
            </Button>
          )
        }
      />

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Storage spaces"
          value={storageSpaces.length}
          icon={<LayoutGrid className="h-5 w-5" />}
        />

        <StatCard
          label="Total capacity"
          value={totals.capacity}
          icon={<Boxes className="h-5 w-5" />}
          tone="info"
          hint="units"
        />

        <StatCard
          label="Free room"
          value={totals.capacity - totals.used}
          icon={<PackageOpen className="h-5 w-5" />}
          tone="success"
          hint="units that can still be stored"
        />

        <StatCard
          label="Nearly full"
          value={nearlyFull}
          icon={<TriangleAlert className="h-5 w-5" />}
          tone={nearlyFull > 0 ? "warning" : "success"}
          hint="at 90% or more"
        />
      </Stagger>

      <StorageSpaceTable
        storageSpaces={storageSpaces}
        canUpdate={can(actor.role, "storageSpace:update")}
        canDelete={can(actor.role, "storageSpace:delete")}
      />
    </PageTransition>
  );
}
