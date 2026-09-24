import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Boxes,
  CalendarDays,
  Clock,
  LayoutGrid,
  MapPin,
  PackageOpen,
  Pencil,
} from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

import { getWarehouseWithUsage } from "@/features/warehouses/queries";
import { getStorageSpacesWithUsage } from "@/features/storage-spaces/queries";
import { getAllocations } from "@/features/allocations/queries";
import { getMovements } from "@/features/movements/queries";

import WarehouseDetailTabs, {
  type WarehouseItemRow,
} from "@/features/warehouses/components/warehouse-detail-tabs";
import WarehouseStatusToggle from "@/features/warehouses/components/warehouse-status-toggle";
import MovementList from "@/features/movements/components/movement-list";

import BackLink from "@/components/ui/back-link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";

type WarehousePageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default async function WarehouseDetailPage({
  params,
}: WarehousePageProps) {
  const actor = await requireAuth();

  const { id } = await params;

  const warehouse = await getWarehouseWithUsage(id);

  if (!warehouse) {
    notFound();
  }

  const [storageSpaces, allocations, movements] = await Promise.all([
    getStorageSpacesWithUsage({ warehouseId: id }),
    getAllocations({ warehouseId: id }),
    getMovements({ warehouseId: id, limit: 8 }),
  ]);

  // One row per item, adding up everything it has in this warehouse.
  const itemRows: WarehouseItemRow[] = [
    ...allocations
      .reduce((map, allocation) => {
        const existing = map.get(allocation.itemId);

        if (existing) {
          existing.quantity += allocation.quantity;
          existing.spaceCount += 1;
          existing.spaceNames += `, ${allocation.storageSpaceName}`;

          return map;
        }

        map.set(allocation.itemId, {
          itemId: allocation.itemId,
          itemName: allocation.itemName,
          itemSku: allocation.itemSku,
          requiredStorageType: allocation.requiredStorageType,
          quantity: allocation.quantity,
          spaceCount: 1,
          spaceNames: allocation.storageSpaceName,
        });

        return map;
      }, new Map<string, WarehouseItemRow>())
      .values(),
  ];

  const isActive = warehouse.status === "ACTIVE";

  return (
    <PageTransition>
      <BackLink href="/warehouses">Back to Warehouses</BackLink>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              {warehouse.name}
            </h2>

            <Badge variant={isActive ? "success" : "danger"} dot>
              {isActive ? "Active" : "Inactive"}
            </Badge>
          </div>

          <div className="mt-2 flex flex-wrap items-center gap-x-5 gap-y-1 text-sm text-muted">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {warehouse.location}
            </span>

            <span className="flex items-center gap-1.5">
              <CalendarDays className="h-4 w-4" />
              Created {formatDate(warehouse.createdAt)}
            </span>

            <span className="flex items-center gap-1.5">
              <Clock className="h-4 w-4" />
              Updated {formatDate(warehouse.updatedAt)}
            </span>
          </div>
        </div>

        <div className="flex shrink-0 gap-2">
          {can(actor.role, "warehouse:update") && (
            <>
              <Button
                href={`/warehouses/${warehouse.id}/edit`}
                variant="secondary"
                size="sm"
                icon={<Pencil className="h-4 w-4" />}
              >
                Edit
              </Button>

              <WarehouseStatusToggle
                warehouse={{
                  id: warehouse.id,
                  name: warehouse.name,
                  status: warehouse.status,
                  used: warehouse.used,
                }}
              />
            </>
          )}
        </div>
      </div>

      {!isActive && (
        <div className="mb-6 rounded-xl border border-warning-muted bg-warning-muted p-4">
          <p className="text-sm text-warning">
            This warehouse is inactive. It keeps its stock
            {warehouse.used > 0 ? ` (${warehouse.used} units)` : ""} and all of
            its history, but nothing new can be allocated here. Stock can still
            be moved out or removed.
          </p>
        </div>
      )}

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total capacity"
          value={warehouse.capacity}
          icon={<Boxes className="h-5 w-5" />}
          tone="info"
          hint="units the building holds"
        />

        <StatCard
          label="Used capacity"
          value={warehouse.used}
          icon={<Boxes className="h-5 w-5" />}
          tone="accent"
          hint={`${warehouse.usedPercent}% of its storage spaces`}
        />

        <StatCard
          label="Available capacity"
          value={warehouse.available}
          icon={<PackageOpen className="h-5 w-5" />}
          tone="success"
          hint="free room inside storage spaces"
        />

        <StatCard
          label="Storage spaces"
          value={warehouse.spaceCount}
          icon={<LayoutGrid className="h-5 w-5" />}
          hint={
            warehouse.unassignedCapacity > 0
              ? `${warehouse.unassignedCapacity} units not assigned yet`
              : "all capacity assigned"
          }
        />
      </Stagger>

      <div className="mb-6 rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-primary">
            Storage space used
          </p>

          <p className="text-sm text-muted">
            {warehouse.used.toLocaleString("en-US")} of{" "}
            {warehouse.allocatedCapacity.toLocaleString("en-US")} units
          </p>
        </div>

        <Progress
          value={warehouse.used}
          max={warehouse.allocatedCapacity}
          className="mt-3"
        />

        <p className="mt-2 text-xs text-muted">
          {warehouse.usedPercent}% of the room inside this warehouse&apos;s
          storage spaces is used.
          {warehouse.unassignedCapacity > 0
            ? ` ${warehouse.unassignedCapacity} units of the building's capacity are not inside any storage space yet, so they cannot hold stock.`
            : ""}
        </p>
      </div>

      <WarehouseDetailTabs
        warehouse={{
          id: warehouse.id,
          name: warehouse.name,
          location: warehouse.location,
          status: warehouse.status,
          capacity: warehouse.capacity,
          allocatedCapacity: warehouse.allocatedCapacity,
          unassignedCapacity: warehouse.unassignedCapacity,
          used: warehouse.used,
          available: warehouse.available,
          spaceCount: warehouse.spaceCount,
          createdAt: warehouse.createdAt,
          updatedAt: warehouse.updatedAt,
        }}
        storageSpaces={storageSpaces}
        items={itemRows}
        canUpdateSpace={can(actor.role, "storageSpace:update")}
        canDeleteSpace={can(actor.role, "storageSpace:delete")}
        canAddSpace={can(actor.role, "storageSpace:create")}
      />

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary">Recent activity</h3>

            <p className="mt-1 text-sm text-muted">
              The last {movements.length} stock movements in this warehouse.
            </p>
          </div>

          <Link
            href={`/activity?search=${encodeURIComponent(warehouse.name)}`}
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
