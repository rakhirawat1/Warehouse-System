import { Boxes, LayoutGrid, Plus, Warehouse } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

import { getWarehouses } from "@/features/warehouses/queries";
import WarehouseTable from "@/features/warehouses/components/warehouse-table";

import Button from "@/components/ui/button";
import PageHeader from "@/components/ui/page-header";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";

export default async function WarehousesPage() {
  const actor = await requireAuth();

  const warehouses = await getWarehouses();

  const totals = warehouses.reduce(
    (sum, warehouse) => ({
      capacity: sum.capacity + warehouse.capacity,
      used: sum.used + warehouse.used,
      spaces: sum.spaces + warehouse.spaceCount,
    }),
    { capacity: 0, used: 0, spaces: 0 },
  );

  const active = warehouses.filter((row) => row.status === "ACTIVE").length;

  return (
    <PageTransition>
      <PageHeader
        action={
          can(actor.role, "warehouse:create") && (
            <Button href="/warehouses/new" icon={<Plus className="h-4 w-4" />}>
              Add Warehouse
            </Button>
          )
        }
      />

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Warehouses"
          value={warehouses.length}
          icon={<Warehouse className="h-5 w-5" />}
          hint={`${active} active`}
        />

        <StatCard
          label="Storage spaces"
          value={totals.spaces}
          icon={<LayoutGrid className="h-5 w-5" />}
          tone="info"
        />

        <StatCard
          label="Total capacity"
          value={totals.capacity}
          icon={<Boxes className="h-5 w-5" />}
          tone="info"
          hint="units across all warehouses"
        />

        <StatCard
          label="Units stored"
          value={totals.used}
          icon={<Boxes className="h-5 w-5" />}
          tone="success"
          hint={
            totals.capacity > 0
              ? `${Math.round((totals.used / totals.capacity) * 100)}% of capacity`
              : undefined
          }
        />
      </Stagger>

      <WarehouseTable
        warehouses={warehouses}
        canCreate={can(actor.role, "warehouse:create")}
        canUpdate={can(actor.role, "warehouse:update")}
        canDelete={can(actor.role, "warehouse:delete")}
        canAddSpace={can(actor.role, "storageSpace:create")}
      />
    </PageTransition>
  );
}
