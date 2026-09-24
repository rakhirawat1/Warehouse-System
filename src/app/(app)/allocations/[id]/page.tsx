import Link from "next/link";
import { notFound } from "next/navigation";
import {
  Boxes,
  Layers,
  PackageCheck,
  PackageOpen,
  PackageSearch,
} from "lucide-react";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

import { getAllocationById } from "@/features/allocations/queries";
import { getStorageSpacesWithUsage } from "@/features/storage-spaces/queries";
import AllocationActions from "@/features/allocations/components/allocation-actions";

import BackLink from "@/components/ui/back-link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import EmptyState from "@/components/ui/empty-state";
import Progress from "@/components/ui/progress";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";
import { STORAGE_TYPE_LABELS } from "@/lib/storage";

type AllocationDetailPageProps = {
  params: Promise<{ id: string }>;
};

function formatDate(value: Date) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function AllocationDetailPage({
  params,
}: AllocationDetailPageProps) {
  const actor = await requireAuth();

  const { id } = await params;

  // A malformed id can never match; answer 404 instead of a database error.
  if (!z.string().uuid().safeParse(id).success) {
    notFound();
  }

  const [allocation, storageSpaces] = await Promise.all([
    getAllocationById(id),
    getStorageSpacesWithUsage(),
  ]);

  // Moving or dispatching everything deletes the allocation, so a link to it
  // can outlive it. Say so plainly rather than showing a bare 404.
  if (!allocation) {
    return (
      <PageTransition>
        <BackLink href="/allocations">Back to Allocations</BackLink>

        <div className="mt-6 rounded-xl border border-border bg-surface shadow-card">
          <EmptyState
            icon={PackageSearch}
            title="This allocation no longer exists"
            description="Its stock was fully moved or dispatched, or it never existed. The activity log still has its history."
            action={<Button href="/activity">Open the activity log</Button>}
          />
        </div>
      </PageTransition>
    );
  }

  const isActive = allocation.warehouseStatus === "ACTIVE";

  return (
    <PageTransition>
      <BackLink href="/allocations">Back to Allocations</BackLink>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              {allocation.itemName}
            </h2>

            <Badge variant="outline" className="font-mono">
              {allocation.itemSku}
            </Badge>

            <Badge variant={isActive ? "success" : "warning"} dot>
              {isActive ? "Warehouse active" : "Warehouse inactive"}
            </Badge>
          </div>

          <p className="mt-2 text-sm text-muted">
            {allocation.quantity.toLocaleString("en-US")} units in{" "}
            <Link
              href={`/warehouses/${allocation.warehouseId}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {allocation.warehouseName}
            </Link>{" "}
            /{" "}
            <Link
              href={`/warehouses/${allocation.warehouseId}/storage-spaces/${allocation.storageSpaceId}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {allocation.storageSpaceName}
            </Link>
          </p>
        </div>

        <AllocationActions
          allocation={allocation}
          storageSpaces={storageSpaces}
          canMove={can(actor.role, "stock:transfer")}
          canAdjust={can(actor.role, "stock:adjust")}
          canDispatch={can(actor.role, "stock:dispatch")}
        />
      </div>

      {!isActive && (
        <div className="mb-6 rounded-xl border border-warning-muted bg-warning-muted p-4">
          <p className="text-sm text-warning">
            {allocation.warehouseName} is inactive. This stock can still be
            moved out, corrected downwards or dispatched, but nothing new can be
            allocated here.
          </p>
        </div>
      )}

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="In this allocation"
          value={allocation.quantity}
          icon={<Boxes className="h-5 w-5" />}
          hint="units in this storage space"
        />

        <StatCard
          label="Item total"
          value={allocation.itemTotal}
          icon={<Layers className="h-5 w-5" />}
          tone="info"
          hint="units the business owns"
        />

        <StatCard
          label="Item allocated"
          value={allocation.itemAllocated}
          icon={<PackageCheck className="h-5 w-5" />}
          tone="success"
          hint="across all storage spaces"
        />

        <StatCard
          label="Item remaining"
          value={allocation.itemRemaining}
          icon={<PackageOpen className="h-5 w-5" />}
          tone={allocation.itemRemaining > 0 ? "warning" : "success"}
          hint="not allocated yet"
        />
      </Stagger>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <h3 className="font-semibold text-primary">Storage space capacity</h3>

          <p className="mt-1 text-sm text-muted">
            {allocation.storageSpaceName} ·{" "}
            {STORAGE_TYPE_LABELS[allocation.storageType]} storage
          </p>

          <Progress
            value={allocation.storageSpaceUsed}
            max={allocation.storageSpaceCapacity}
            className="mt-4"
          />

          <dl className="mt-4 grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-surface-subtle px-3 py-3">
              <dt className="text-xs text-muted">Capacity</dt>
              <dd className="mt-1 font-semibold text-primary">
                {allocation.storageSpaceCapacity.toLocaleString("en-US")}
              </dd>
            </div>

            <div className="rounded-lg bg-surface-subtle px-3 py-3">
              <dt className="text-xs text-muted">Used</dt>
              <dd className="mt-1 font-semibold text-primary">
                {allocation.storageSpaceUsed.toLocaleString("en-US")}
              </dd>
            </div>

            <div className="rounded-lg bg-surface-subtle px-3 py-3">
              <dt className="text-xs text-muted">Available</dt>
              <dd className="mt-1 font-semibold text-primary">
                {allocation.storageSpaceAvailable.toLocaleString("en-US")}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface shadow-card">
          <dl className="divide-y divide-border">
            {[
              ["Item", allocation.itemName],
              ["SKU", allocation.itemSku],
              [
                "Storage needed",
                STORAGE_TYPE_LABELS[allocation.requiredStorageType],
              ],
              ["Warehouse", allocation.warehouseName],
              [
                "Warehouse status",
                isActive
                  ? "Active — can receive new stock"
                  : "Inactive — stock can only move out",
              ],
              ["Storage space", allocation.storageSpaceName],
              ["First allocated", formatDate(allocation.createdAt)],
              ["Last changed", formatDate(allocation.updatedAt)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 px-5 py-3 sm:grid-cols-[160px_1fr] sm:gap-4"
              >
                <dt className="text-sm font-medium text-muted">{label}</dt>
                <dd className="text-sm text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        <Button href={`/items/${allocation.itemId}`} variant="secondary" size="sm">
          View item
        </Button>

        <Button
          href={`/warehouses/${allocation.warehouseId}/storage-spaces/${allocation.storageSpaceId}`}
          variant="secondary"
          size="sm"
        >
          View storage space
        </Button>
      </div>
    </PageTransition>
  );
}
