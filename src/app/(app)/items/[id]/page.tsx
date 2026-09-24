import { notFound } from "next/navigation";
import Link from "next/link";
import {
  Layers,
  PackageCheck,
  PackageOpen,
  Pencil,
  Plus,
  Warehouse,
} from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

import { getItemWithStock } from "@/features/items/queries";
import { getAllocationsByItemId } from "@/features/allocations/queries";
import { getStorageSpacesWithUsage } from "@/features/storage-spaces/queries";
import { getMovements } from "@/features/movements/queries";

import ItemDetailTabs from "@/features/items/components/item-detail-tabs";
import MovementList from "@/features/movements/components/movement-list";

import BackLink from "@/components/ui/back-link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";
import { STORAGE_TYPE_LABELS } from "@/lib/storage";

type ItemDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  const actor = await requireAuth();

  const { id } = await params;

  const item = await getItemWithStock(id);

  if (!item) {
    notFound();
  }

  const [allocations, storageSpaces, movements] = await Promise.all([
    getAllocationsByItemId(id),
    getStorageSpacesWithUsage(),
    getMovements({ itemId: id, limit: 8 }),
  ]);

  const status =
    item.allocated === 0
      ? { label: "Not Allocated", variant: "neutral" as const }
      : item.remaining > 0
        ? { label: "Partially Allocated", variant: "info" as const }
        : { label: "Fully Allocated", variant: "success" as const };

  const canAllocate = can(actor.role, "stock:receive");

  return (
    <PageTransition>
      <BackLink href="/items">Back to Items</BackLink>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              {item.name}
            </h2>

            <Badge variant="outline" className="font-mono">
              {item.sku}
            </Badge>

            <Badge variant={status.variant} dot>
              {status.label}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-muted">
            Storage type: {STORAGE_TYPE_LABELS[item.requiredStorageType]}
            {item.description ? ` · ${item.description}` : ""}
          </p>
        </div>

        <div className="flex shrink-0 gap-2">
          {can(actor.role, "item:update") && (
            <Button
              href={`/items/${item.id}/edit`}
              variant="secondary"
              size="sm"
              icon={<Pencil className="h-4 w-4" />}
            >
              Edit
            </Button>
          )}

          {canAllocate && item.remaining > 0 && (
            <Button
              href={`/items/${item.id}/allocate`}
              size="sm"
              icon={<Plus className="h-4 w-4" />}
            >
              Allocate
            </Button>
          )}
        </div>
      </div>

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Total quantity"
          value={item.quantity}
          icon={<Layers className="h-5 w-5" />}
          tone="info"
          hint="units the business owns"
        />

        <StatCard
          label="Allocated"
          value={item.allocated}
          icon={<PackageCheck className="h-5 w-5" />}
          tone="success"
          hint={`in ${item.locationCount} storage space${
            item.locationCount === 1 ? "" : "s"
          }`}
        />

        <StatCard
          label="Remaining"
          value={item.remaining}
          icon={<PackageOpen className="h-5 w-5" />}
          tone={item.remaining > 0 ? "warning" : "success"}
          hint="not allocated yet"
        />

        <StatCard
          label="Warehouses"
          value={item.warehouseCount}
          icon={<Warehouse className="h-5 w-5" />}
          hint="holding this item"
        />
      </Stagger>

      {item.quantity > 0 && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-5 shadow-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-medium text-primary">
              Allocation progress
            </p>

            <p className="text-sm text-muted">
              {item.allocated.toLocaleString("en-US")} of{" "}
              {item.quantity.toLocaleString("en-US")} units
            </p>
          </div>

          <Progress
            value={item.allocated}
            max={item.quantity}
            warnWhenFull={false}
            className="mt-3"
          />

          {item.remaining > 0 ? (
            <p className="mt-3 text-sm text-warning">
              {item.remaining} units are not in a storage space yet. Use
              Allocate to place them, in one go or a few at a time.
            </p>
          ) : (
            <p className="mt-3 text-sm text-muted">
              Every unit of this item is in a storage space.
            </p>
          )}
        </div>
      )}

      <ItemDetailTabs
        item={{
          id: item.id,
          name: item.name,
          sku: item.sku,
          description: item.description,
          requiredStorageType: item.requiredStorageType,
          quantity: item.quantity,
          allocated: item.allocated,
          remaining: item.remaining,
          locationCount: item.locationCount,
          warehouseCount: item.warehouseCount,
          createdAt: item.createdAt,
          updatedAt: item.updatedAt,
        }}
        allocations={allocations}
        storageSpaces={storageSpaces}
        canAllocate={canAllocate}
        canMove={can(actor.role, "stock:transfer")}
        canAdjust={can(actor.role, "stock:adjust")}
        canDispatch={can(actor.role, "stock:dispatch")}
      />

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary">History</h3>

            <p className="mt-1 text-sm text-muted">
              Every allocation, move, correction and removal for this item.
              Entries stay readable even after a storage space is deleted.
            </p>
          </div>

          <Link
            href={`/activity?search=${encodeURIComponent(item.name)}`}
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
