import { notFound } from "next/navigation";
import Link from "next/link";
import { Boxes, Package, PackageOpen, Pencil } from "lucide-react";

import { requireAuth } from "@/lib/auth/guards";
import { can } from "@/lib/auth/permissions";

import { getStorageSpaceWithContents } from "@/features/storage-spaces/queries";
import { getMovements } from "@/features/movements/queries";

import StorageSpaceContentsTable from "@/features/storage-spaces/components/storage-space-contents-table";
import MovementList from "@/features/movements/components/movement-list";

import BackLink from "@/components/ui/back-link";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import Progress from "@/components/ui/progress";
import StatCard from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";
import {
  STORAGE_TYPE_DESCRIPTIONS,
  STORAGE_TYPE_LABELS,
} from "@/lib/storage";

type StorageSpaceDetailPageProps = {
  params: Promise<{ id: string; storageSpaceId: string }>;
};

export default async function StorageSpaceDetailPage({
  params,
}: StorageSpaceDetailPageProps) {
  const actor = await requireAuth();

  const { id, storageSpaceId } = await params;

  const result = await getStorageSpaceWithContents(storageSpaceId);

  if (!result || result.space.warehouseId !== id) {
    notFound();
  }

  const { space, contents } = result;

  const movements = await getMovements({ warehouseId: id, limit: 6 });

  const isInactive = space.warehouseStatus === "INACTIVE";

  return (
    <PageTransition>
      <BackLink href={`/warehouses/${space.warehouseId}`}>
        Back to {space.warehouseName}
      </BackLink>

      <div className="mt-4 mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-2xl font-bold tracking-tight text-primary">
              {space.name}
            </h2>

            <Badge variant="outline">
              {STORAGE_TYPE_LABELS[space.storageType]}
            </Badge>

            {isInactive ? (
              <Badge variant="warning" dot>
                Warehouse inactive
              </Badge>
            ) : space.available === 0 ? (
              <Badge variant="danger" dot>
                Full
              </Badge>
            ) : (
              <Badge variant="success" dot>
                Available
              </Badge>
            )}
          </div>

          <p className="mt-2 text-sm text-muted">
            In{" "}
            <Link
              href={`/warehouses/${space.warehouseId}`}
              className="text-accent underline-offset-4 hover:underline"
            >
              {space.warehouseName}
            </Link>{" "}
            · {STORAGE_TYPE_DESCRIPTIONS[space.storageType]}
          </p>

          {space.description && (
            <p className="mt-1 text-sm text-secondary">{space.description}</p>
          )}
        </div>

        {can(actor.role, "storageSpace:update") && (
          <Button
            href={`/warehouses/${space.warehouseId}/storage-spaces/${space.id}/edit`}
            variant="secondary"
            size="sm"
            icon={<Pencil className="h-4 w-4" />}
          >
            Edit
          </Button>
        )}
      </div>

      {isInactive && (
        <div className="mb-6 rounded-xl border border-warning-muted bg-warning-muted p-4">
          <p className="text-sm text-warning">
            {space.warehouseName} is inactive, so nothing new can be allocated
            to this storage space. The {space.used} units already here keep
            their history and can still be moved out or removed.
          </p>
        </div>
      )}

      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Capacity"
          value={space.capacity}
          icon={<Boxes className="h-5 w-5" />}
          tone="info"
          hint="units this space holds"
        />

        <StatCard
          label="Used"
          value={space.used}
          icon={<Boxes className="h-5 w-5" />}
          tone="accent"
          hint={`${space.usedPercent}% full`}
        />

        <StatCard
          label="Available"
          value={space.available}
          icon={<PackageOpen className="h-5 w-5" />}
          tone={space.available === 0 ? "danger" : "success"}
          hint="units that still fit"
        />

        <StatCard
          label="Different items"
          value={contents.length}
          icon={<Package className="h-5 w-5" />}
          hint="stored here"
        />
      </Stagger>

      <div className="mb-6 rounded-xl border border-border bg-surface p-5 shadow-card">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-medium text-primary">Space used</p>

          <p className="text-sm text-muted">
            {space.used.toLocaleString("en-US")} of{" "}
            {space.capacity.toLocaleString("en-US")} units
          </p>
        </div>

        <Progress value={space.used} max={space.capacity} className="mt-3" />

        <p className="mt-2 text-xs text-muted">
          {space.usedPercent}% full. Only items that need{" "}
          {STORAGE_TYPE_LABELS[space.storageType].toLowerCase()} storage can be
          allocated here.
        </p>
      </div>

      <section>
        <div className="mb-4">
          <h3 className="font-semibold text-primary">Items stored here</h3>

          <p className="mt-1 text-sm text-muted">
            One row per item, with how much of that item&apos;s total sits in
            this space.
          </p>
        </div>

        <StorageSpaceContentsTable
          contents={contents}
          capacity={space.capacity}
        />
      </section>

      <section className="mt-8">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="font-semibold text-primary">Recent activity</h3>

            <p className="mt-1 text-sm text-muted">
              The latest movements anywhere in {space.warehouseName}, not only
              this storage space.
            </p>
          </div>

          <Link
            href={`/activity?search=${encodeURIComponent(space.name)}`}
            className="text-sm font-medium text-accent underline-offset-4 hover:underline"
          >
            Movements for {space.name}
          </Link>
        </div>

        <MovementList movements={movements} />
      </section>
    </PageTransition>
  );
}
