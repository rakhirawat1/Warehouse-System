import Link from "next/link";
import {
  ArrowLeftRight,
  Clock3,
  PackageCheck,
  PackageMinus,
  Pencil,
} from "lucide-react";

import {
  MOVEMENT_TYPE_LABELS,
  type MovementType,
} from "../types";

export type MovementListItem = {
  id: string;
  type: MovementType | string;
  itemId: string | null;
  itemName: string;
  fromLabel: string | null;
  toLabel: string | null;
  quantity: number;
  actorName: string;
  createdAt: Date;
  note?: string | null;
};

type MovementListProps = {
  movements: MovementListItem[];
};

const MOVEMENT_ICONS = {
  RECEIPT: PackageCheck,
  TRANSFER: ArrowLeftRight,
  ADJUSTMENT: Pencil,
  DISPATCH: PackageMinus,
} as const;

const MOVEMENT_ICON_STYLES = {
  RECEIPT: "bg-success-muted text-success",
  TRANSFER: "bg-info-muted text-info",
  ADJUSTMENT: "bg-warning-muted text-warning",
  DISPATCH: "bg-danger-muted text-danger",
} as const;

function getMovementType(type: MovementListItem["type"]): MovementType {
  if (
    type === "RECEIPT" ||
    type === "TRANSFER" ||
    type === "ADJUSTMENT" ||
    type === "DISPATCH"
  ) {
    return type;
  }

  return "ADJUSTMENT";
}

function formatTime(value: Date) {
  return new Date(value).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateLabel(value: Date) {
  const date = new Date(value);
  const today = new Date();

  const isToday =
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear();

  if (isToday) {
    return "Today";
  }

  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const isYesterday =
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear();

  if (isYesterday) {
    return "Yesterday";
  }

  return formatDate(date);
}

/** Where it happened. The type is shown separately, so it is not repeated here. */
function describe(movement: MovementListItem) {
  const type = getMovementType(movement.type);

  if (type === "RECEIPT") {
    return movement.toLabel ?? "Storage space";
  }

  if (type === "TRANSFER") {
    return `${movement.fromLabel ?? "Storage space"} → ${
      movement.toLabel ?? "Storage space"
    }`;
  }

  if (type === "DISPATCH") {
    return movement.fromLabel ?? "Storage space";
  }

  return movement.toLabel ?? movement.fromLabel ?? "Storage space";
}

function getActorInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function MovementList({ movements }: MovementListProps) {
  if (movements.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-border bg-surface p-8 text-center">
        <Clock3 className="mx-auto h-8 w-8 text-muted" />

        <p className="mt-3 font-medium text-primary">No activity yet.</p>

        <p className="mt-1 text-sm text-muted">
          Allocating, moving, correcting and dispatching stock is recorded
          here.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-card">
      <div className="hidden grid-cols-[100px_minmax(180px,1fr)_minmax(220px,1.5fr)_160px] gap-4 bg-surface-subtle px-5 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
        <div>Time</div>
        <div>Activity</div>
        <div>Details</div>
        <div>Performed by</div>
      </div>

      <div className="divide-y divide-border">
        {movements.map((movement) => {
          const type = getMovementType(movement.type);
          const Icon = MOVEMENT_ICONS[type];
          const iconStyle = MOVEMENT_ICON_STYLES[type];

          return (
            <div
              key={movement.id}
              className="grid gap-4 px-5 py-4 transition-colors hover:bg-surface-subtle md:grid-cols-[100px_minmax(180px,1fr)_minmax(220px,1.5fr)_160px] md:items-center"
            >
              <div className="flex items-start gap-2 md:block">
                <Clock3 className="mt-0.5 h-4 w-4 shrink-0 text-muted md:hidden" />

                <div>
                  <p className="text-sm font-medium text-primary">
                    {formatTime(movement.createdAt)}
                  </p>

                  <p className="text-xs text-muted">
                    {formatDateLabel(movement.createdAt)}
                  </p>
                </div>
              </div>

              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${iconStyle}`}
                >
                  <Icon className="h-4 w-4" />
                </div>

                <p className="font-medium text-primary">
                  {MOVEMENT_TYPE_LABELS[type]}
                </p>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium text-primary">
                  {movement.quantity.toLocaleString("en-US")} units of{" "}
                  {movement.itemId ? (
                    <Link
                      href={`/items/${movement.itemId}`}
                      className="underline decoration-border-strong underline-offset-2 transition-colors hover:text-accent"
                    >
                      {movement.itemName}
                    </Link>
                  ) : (
                    movement.itemName
                  )}
                </p>

                <p className="mt-1 truncate text-sm text-secondary">
                  {describe(movement)}
                </p>

                {movement.note && (
                  <p className="mt-1 truncate text-xs text-muted">
                    {movement.note}
                  </p>
                )}
              </div>

              <div className="flex min-w-0 items-center gap-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent-muted text-xs font-semibold text-accent">
                  {getActorInitials(movement.actorName)}
                </div>

                <p className="truncate text-sm font-medium text-primary">
                  {movement.actorName}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}