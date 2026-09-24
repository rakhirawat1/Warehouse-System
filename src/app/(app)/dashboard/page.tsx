import Link from "next/link";
import {
  ArrowLeftRight,
  LayoutGrid,
  Package,
  Warehouse,
} from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";

import {
  getCapacityByWarehouse,
  getDashboardStats,
  getInventoryDistribution,
  getLowSpaceAlerts,
  getRecentMovements,
} from "@/features/dashboard/queries";

import CapacityChart from "@/features/dashboard/components/capacity-chart";
import InventoryDistributionChart from "@/features/dashboard/components/inventory-distribution-chart";
import ItemStatusChart from "@/features/dashboard/components/item-status-chart";
import MovementList from "@/features/movements/components/movement-list";
import WarehouseHealthSummary from "@/features/ai/components/warehouse-health-summary";
import AttentionPanel from "@/features/dashboard/components/attention-panel";

import Progress from "@/components/ui/progress";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger, StaggerItem } from "@/components/motion/stagger";

export default async function DashboardPage() {
  const actor = await requireAuth();

  const [stats, movements, capacityByWarehouse, distribution, lowSpace] =
    await Promise.all([
      getDashboardStats(),
      getRecentMovements(6),
      getCapacityByWarehouse(),
      getInventoryDistribution(),
      getLowSpaceAlerts(),
    ]);

  return (
    <PageTransition>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-primary">
          Welcome back, {actor.name}
        </h2>

        <p className="mt-1 text-sm text-muted">
          {stats.activeWarehouses} of {stats.totalWarehouses} warehouses are
          active, {stats.usedPercent}% of the storage space is used, and{" "}
          {stats.unallocatedUnits.toLocaleString("en-US")} of{" "}
          {stats.totalUnits.toLocaleString("en-US")} units are still waiting
          for a storage space.
        </p>
      </div>

      <WarehouseHealthSummary />

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Link
          href="/warehouses"
          className="block h-full"
          aria-label="View all warehouses"
        >
          <StatCard
            label="Total Warehouses"
            value={stats.totalWarehouses}
            icon={<Warehouse className="h-5 w-5" />}
            tone="accent"
            hint={
              stats.warehousesThisMonth > 0
                ? `+${stats.warehousesThisMonth} this month`
                : `${stats.activeWarehouses} active`
            }
            trend={stats.warehousesThisMonth > 0 ? "up" : undefined}
          />
        </Link>

        <Link
          href="/storage-spaces"
          className="block h-full"
          aria-label="View all storage spaces"
        >
          <StatCard
            label="Storage Spaces"
            value={stats.totalStorageSpaces}
            icon={<LayoutGrid className="h-5 w-5" />}
            tone="info"
            hint={
              stats.spacesThisMonth > 0
                ? `+${stats.spacesThisMonth} this month`
                : "across all warehouses"
            }
            trend={stats.spacesThisMonth > 0 ? "up" : undefined}
          />
        </Link>

        <Link
          href="/items"
          className="block h-full"
          aria-label="View all items"
        >
          <StatCard
            label="Total Items"
            value={stats.totalItems}
            icon={<Package className="h-5 w-5" />}
            tone="warning"
            hint={
              stats.itemsThisMonth > 0
                ? `+${stats.itemsThisMonth} this month`
                : `${stats.totalUnits.toLocaleString("en-US")} units owned`
            }
            trend={stats.itemsThisMonth > 0 ? "up" : undefined}
          />
        </Link>

        <Link
          href="/activity"
          className="block h-full"
          aria-label="View activity and movements"
        >
          <StatCard
            label="Movements"
            value={stats.totalMovements}
            icon={<ArrowLeftRight className="h-5 w-5" />}
            tone="success"
            hint={
              stats.movementsThisWeek > 0
                ? `+${stats.movementsThisWeek} this week`
                : "no movements this week"
            }
            trend={stats.movementsThisWeek > 0 ? "up" : undefined}
          />
        </Link>
      </Stagger>

      <AttentionPanel
        nearlyFull={lowSpace}
        unallocatedUnits={stats.unallocatedUnits}
        unallocatedItems={
          stats.notAllocatedItems + stats.partiallyAllocatedItems
        }
      />

      <Stagger className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <StaggerItem className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-primary">
                Overall storage capacity
              </h3>

              <p className="mt-1 text-sm text-muted">
                {stats.usedCapacity.toLocaleString("en-US")} /{" "}
                {stats.totalCapacity.toLocaleString("en-US")} units
              </p>
            </div>

            <span className="rounded-full bg-accent-muted px-3 py-1 text-xs font-semibold text-accent">
              {stats.usedPercent}% used
            </span>
          </div>

          <Progress
            value={stats.usedCapacity}
            max={stats.totalCapacity}
            className="mt-4"
          />

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-surface-subtle px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-medium text-muted">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Used capacity
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {stats.usedCapacity.toLocaleString("en-US")}
              </p>
            </div>

            <div className="rounded-lg bg-surface-subtle px-4 py-3">
              <p className="flex items-center gap-2 text-xs font-medium text-muted">
                <span className="h-2 w-2 rounded-full bg-border-strong" />
                Available capacity
              </p>

              <p className="mt-1 text-lg font-bold text-primary">
                {stats.availableCapacity.toLocaleString("en-US")}
              </p>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-semibold text-primary">
              Capacity per warehouse
            </h4>

            <div className="mt-3">
              <CapacityChart data={capacityByWarehouse} />
            </div>
          </div>
        </StaggerItem>

        <StaggerItem className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h3 className="font-semibold text-primary">Items by status</h3>

          <p className="mt-1 text-sm text-muted">
            How much of each item has a storage space.
          </p>

          <div className="mt-5">
            <ItemStatusChart
              fullyAllocated={stats.fullyAllocatedItems}
              partiallyAllocated={stats.partiallyAllocatedItems}
              notAllocated={stats.notAllocatedItems}
            />
          </div>

          <div className="mt-6 border-t border-border pt-5">
            <h4 className="text-sm font-semibold text-primary">
              Where stock is
            </h4>

            <p className="mt-1 text-xs text-muted">
              Units stored per warehouse.
            </p>

            <div className="mt-3">
              <InventoryDistributionChart data={distribution} />
            </div>
          </div>
        </StaggerItem>
      </Stagger>

      <section className="mt-6">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-primary">Recent activity</h3>

            <p className="mt-1 text-sm text-muted">
              The latest stock movements.
            </p>
          </div>

          <Link
            href="/activity"
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            View all
          </Link>
        </div>

        <MovementList movements={movements} />
      </section>
    </PageTransition>
  );
}