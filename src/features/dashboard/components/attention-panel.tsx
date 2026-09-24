import Link from "next/link";
import { ChevronRight, Gauge, PackageOpen, TriangleAlert } from "lucide-react";

import Progress from "@/components/ui/progress";
import { cn } from "@/lib/utils";

type NearlyFullSpace = {
  id: string;
  name: string;
  warehouseId: string;
  warehouseName: string;
  capacity: number;
  used: number;
  available: number;
  usedPercent: number;
};

type AttentionPanelProps = {
  nearlyFull: NearlyFullSpace[];
  unallocatedUnits: number;
  unallocatedItems: number;
};

export default function AttentionPanel({
  nearlyFull,
  unallocatedUnits,
  unallocatedItems,
}: AttentionPanelProps) {
  const spaces = nearlyFull.slice(0, 4);
  const total = spaces.length + (unallocatedUnits > 0 ? 1 : 0);

  if (total === 0) {
    return null;
  }

  return (
    <section className="mb-6 overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-muted text-warning">
            <TriangleAlert className="h-[18px] w-[18px]" />
          </span>

          <div>
            <h3 className="font-semibold text-primary">Things to look at</h3>

            <p className="text-xs text-muted">
              Spaces running out of room and stock without a place yet.
            </p>
          </div>
        </div>

        <span className="rounded-full bg-warning-muted px-2.5 py-1 text-xs font-semibold text-warning">
          {total} {total === 1 ? "issue" : "issues"}
        </span>
      </div>

      <ul className="divide-y divide-border">
        {spaces.map((space) => (
          <li key={space.id}>
            <Link
              href={`/warehouses/${space.warehouseId}/storage-spaces/${space.id}`}
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-subtle"
            >
              <span
                className={cn(
                  "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
                  space.usedPercent >= 95
                    ? "bg-danger-muted text-danger"
                    : "bg-warning-muted text-warning",
                )}
              >
                <Gauge className="h-[18px] w-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium text-primary">
                  {space.name}
                  <span className="font-normal text-muted">
                    {" "}
                    · {space.warehouseName}
                  </span>
                </span>

                <span className="block text-xs text-muted">
                  Nearly full: {space.available.toLocaleString("en-US")} of{" "}
                  {space.capacity.toLocaleString("en-US")} units free
                </span>
              </span>

              <span className="hidden w-36 shrink-0 sm:block">
                <span className="mb-1 flex justify-end text-xs font-semibold text-primary">
                  {space.usedPercent}%
                </span>

                <Progress value={space.used} max={space.capacity} size="sm" />
              </span>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </li>
        ))}

        {unallocatedUnits > 0 && (
          <li>
            <Link
              href="/items?filter=unallocated"
              className="group flex items-center gap-4 px-5 py-3.5 transition-colors hover:bg-surface-subtle"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-accent-muted text-accent">
                <PackageOpen className="h-[18px] w-[18px]" />
              </span>

              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium text-primary">
                  {unallocatedUnits.toLocaleString("en-US")} units waiting to be
                  allocated
                </span>

                <span className="block text-xs text-muted">
                  Across {unallocatedItems} item
                  {unallocatedItems === 1 ? "" : "s"} with no storage space yet
                </span>
              </span>

              <span className="hidden shrink-0 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-secondary transition-colors group-hover:border-border-strong group-hover:text-primary sm:inline">
                Allocate
              </span>

              <ChevronRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
            </Link>
          </li>
        )}
      </ul>
    </section>
  );
}
