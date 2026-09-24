import { Suspense } from "react";
import { ArrowLeftRight, PackageMinus, PackagePlus, Pencil } from "lucide-react";
import { z } from "zod";

import { requireAuth } from "@/lib/auth/guards";

import {
  getMovementActors,
  getMovements,
  getMovementTotals,
} from "@/features/movements/queries";
import MovementTable from "@/features/movements/components/movement-table";
import MovementFilters from "@/features/movements/components/movement-filters";
import { getItems } from "@/features/items/queries";
import { getWarehouses } from "@/features/warehouses/queries";

import StatCard, { type StatTone } from "@/components/ui/stat-card";
import PageTransition from "@/components/motion/page-transition";
import { Stagger } from "@/components/motion/stagger";
import { MOVEMENT_TYPES, MOVEMENT_TYPE_LABELS } from "@/features/movements/types";

const TYPE_ICONS = {
  RECEIPT: PackagePlus,
  TRANSFER: ArrowLeftRight,
  ADJUSTMENT: Pencil,
  DISPATCH: PackageMinus,
} as const;

const TYPE_TONES: Record<string, StatTone> = {
  RECEIPT: "success",
  TRANSFER: "info",
  ADJUSTMENT: "warning",
  DISPATCH: "danger",
};

type ActivityPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

/** URL filters are validated; anything malformed is ignored. */
const date = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

const filterSchema = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  warehouse: z.string().uuid().optional().catch(undefined),
  item: z.string().uuid().optional().catch(undefined),
  actor: z.string().trim().max(200).optional().catch(undefined),
  from: date.optional().catch(undefined),
  to: date.optional().catch(undefined),
});

export default async function ActivityPage({
  searchParams,
}: ActivityPageProps) {
  await requireAuth();

  const raw = await searchParams;

  const filters = filterSchema.parse({
    search: typeof raw.search === "string" ? raw.search : undefined,
    warehouse: typeof raw.warehouse === "string" ? raw.warehouse : undefined,
    item: typeof raw.item === "string" ? raw.item : undefined,
    actor: typeof raw.actor === "string" ? raw.actor : undefined,
    from: typeof raw.from === "string" ? raw.from : undefined,
    to: typeof raw.to === "string" ? raw.to : undefined,
  });

  const filtersActive = Boolean(
    filters.warehouse || filters.item || filters.actor || filters.from || filters.to,
  );

  const [movements, totals, warehouses, items, actors] = await Promise.all([
    getMovements({
      search: filters.search || undefined,
      warehouseId: filters.warehouse,
      itemId: filters.item,
      actorName: filters.actor || undefined,
      from: filters.from,
      to: filters.to,
      limit: 300,
    }),
    getMovementTotals(),
    getWarehouses(),
    getItems(),
    getMovementActors(),
  ]);

  return (
    <PageTransition>
      <Stagger className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {MOVEMENT_TYPES.map((type) => {
          const total = totals.find((row) => row.type === type);
          const Icon = TYPE_ICONS[type];

          return (
            <StatCard
              key={type}
              label={`${MOVEMENT_TYPE_LABELS[type]} (units)`}
              value={total?.units ?? 0}
              icon={<Icon className="h-5 w-5" />}
              tone={TYPE_TONES[type]}
              hint={`in ${total?.operations ?? 0} operations`}
            />
          );
        })}
      </Stagger>

      <MovementTable
        movements={movements}
        filtersActive={filtersActive}
        filterPanel={
          <Suspense fallback={null}>
            <MovementFilters
              options={{
                warehouses: warehouses
                  .map((warehouse) => ({ id: warehouse.id, name: warehouse.name }))
                  .sort((a, b) => a.name.localeCompare(b.name)),
                items: items
                  .map((item) => ({ id: item.id, name: item.name, sku: item.sku }))
                  .sort((a, b) => a.name.localeCompare(b.name)),
                actors,
              }}
            />
          </Suspense>
        }
      />
    </PageTransition>
  );
}
