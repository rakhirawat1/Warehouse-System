"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { History } from "lucide-react";

import type { MovementRow } from "../queries";
import {
  MOVEMENT_TYPES,
  MOVEMENT_TYPE_LABELS,
  MOVEMENT_TYPE_TONE,
  type MovementType,
} from "../types";

import Badge from "@/components/ui/badge";
import DataTable, { type Column } from "@/components/ui/data-table";
import EmptyState from "@/components/ui/empty-state";

function formatDateTime(value: Date) {
  return new Date(value).toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function describe(movement: MovementRow) {
  const type = movement.type as MovementType;

  if (type === "RECEIPT") {
    return `into ${movement.toLabel ?? "a storage space"}`;
  }

  if (type === "TRANSFER") {
    return `${movement.fromLabel ?? "a storage space"} → ${
      movement.toLabel ?? "a storage space"
    }`;
  }

  if (type === "DISPATCH") {
    return `out of ${movement.fromLabel ?? "a storage space"}`;
  }

  return `corrected in ${movement.toLabel ?? movement.fromLabel ?? "a storage space"}`;
}

export default function MovementTable({
  movements,
  filterPanel,
  filtersActive = false,
}: {
  movements: MovementRow[];
  filterPanel?: ReactNode;
  filtersActive?: boolean;
}) {
  const [tab, setTab] = useState("all");

  const counts = useMemo(() => {
    const result: Record<string, number> = { all: movements.length };

    for (const type of MOVEMENT_TYPES) {
      result[type] = movements.filter(
        (movement) => movement.type === type,
      ).length;
    }

    return result;
  }, [movements]);

  const rows = useMemo(
    () =>
      tab === "all"
        ? movements
        : movements.filter((movement) => movement.type === tab),
    [movements, tab],
  );

  const columns: Column<MovementRow>[] = [
    {
      key: "type",
      header: "Type",
      sortValue: (row) => MOVEMENT_TYPE_LABELS[row.type as MovementType],
      cell: (row) => (
        <Badge variant={MOVEMENT_TYPE_TONE[row.type as MovementType]}>
          {MOVEMENT_TYPE_LABELS[row.type as MovementType]}
        </Badge>
      ),
    },
    {
      key: "item",
      header: "Item",
      sortValue: (row) => row.itemName,
      cell: (row) =>
        row.itemId ? (
          <Link
            href={`/items/${row.itemId}`}
            className="font-medium text-primary transition-colors hover:text-accent"
          >
            {row.itemName}
          </Link>
        ) : (
          <span className="font-medium text-primary">
            {row.itemName}
            <span className="ml-2 text-xs font-normal text-muted">
              (deleted)
            </span>
          </span>
        ),
    },
    {
      key: "quantity",
      header: "Units",
      align: "right",
      sortValue: (row) => row.quantity,
      cell: (row) => (
        <span className="font-semibold text-primary">
          {row.quantity.toLocaleString("en-US")}
        </span>
      ),
    },
    {
      key: "where",
      header: "Where",
      hideBelow: "md",
      sortValue: (row) => describe(row),
      cell: (row) => <span className="text-sm">{describe(row)}</span>,
    },
    {
      key: "actor",
      header: "By",
      hideBelow: "lg",
      sortValue: (row) => row.actorName,
      cell: (row) => row.actorName,
    },
    {
      key: "note",
      header: "Note",
      hideBelow: "xl",
      cell: (row) =>
        row.note ? (
          <span className="text-sm text-muted">{row.note}</span>
        ) : (
          <span className="text-muted">—</span>
        ),
    },
    {
      key: "when",
      header: "When",
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => (
        <span className="whitespace-nowrap text-sm">
          {formatDateTime(row.createdAt)}
        </span>
      ),
    },
  ];

  return (
    <DataTable
      rows={rows}
      columns={columns}
      rowKey={(row) => row.id}
      searchText={(row) =>
        `${row.itemName} ${row.fromLabel ?? ""} ${row.toLabel ?? ""} ${row.actorName} ${row.note ?? ""}`
      }
      searchPlaceholder="Search item, space or person..."
      noun="movements"
      pageSize={15}
      initialSort={{ key: "when", direction: "desc" }}
      tabs={[
        { value: "all", label: "All", count: counts.all },
        ...MOVEMENT_TYPES.map((type) => ({
          value: type,
          label: MOVEMENT_TYPE_LABELS[type],
          count: counts[type],
        })),
      ]}
      tabValue={tab}
      onTabChange={setTab}
      filterPanel={filterPanel}
      filtersOpenByDefault={filtersActive}
      empty={
        <EmptyState
          icon={History}
          title="No activity yet"
          description="Allocating, moving, correcting and dispatching stock is all recorded here."
        />
      }
    />
  );
}
