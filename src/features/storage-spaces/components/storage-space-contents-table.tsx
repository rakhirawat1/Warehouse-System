"use client";

import Link from "next/link";
import { PackageOpen } from "lucide-react";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import DataTable, { type Column } from "@/components/ui/data-table";
import EmptyState from "@/components/ui/empty-state";
import Progress from "@/components/ui/progress";
import { STORAGE_TYPE_LABELS, type StorageType } from "@/lib/storage";

export type StorageSpaceContentRow = {
  allocationId: string;
  itemId: string;
  itemName: string;
  itemSku: string;
  requiredStorageType: StorageType;
  quantity: number;
  /** The item's whole total, so the share stored here is clear. */
  itemTotal: number;
  updatedAt: Date;
};

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function StorageSpaceContentsTable({
  contents,
  capacity,
}: {
  contents: StorageSpaceContentRow[];
  capacity: number;
}) {
  const columns: Column<StorageSpaceContentRow>[] = [
    {
      key: "item",
      header: "Item",
      sortValue: (row) => row.itemName,
      cell: (row) => (
        <div>
          <Link
            href={`/items/${row.itemId}`}
            className="font-medium text-primary transition-colors hover:text-accent"
          >
            {row.itemName}
          </Link>

          <p className="mt-0.5 font-mono text-xs whitespace-nowrap text-muted">{row.itemSku}</p>
        </div>
      ),
    },
    {
      key: "type",
      header: "Needs",
      hideBelow: "md",
      sortValue: (row) => STORAGE_TYPE_LABELS[row.requiredStorageType],
      cell: (row) => (
        <Badge variant="outline">
          {STORAGE_TYPE_LABELS[row.requiredStorageType]}
        </Badge>
      ),
    },
    {
      key: "quantity",
      header: "Units here",
      align: "right",
      sortValue: (row) => row.quantity,
      cell: (row) => (
        <span className="font-semibold text-primary">
          {row.quantity.toLocaleString("en-US")}
        </span>
      ),
    },
    {
      key: "shareOfItem",
      header: "Share of the item",
      align: "right",
      hideBelow: "lg",
      sortValue: (row) => (row.itemTotal > 0 ? row.quantity / row.itemTotal : 0),
      cell: (row) => (
        <div className="inline-flex w-32 flex-col items-end">
          <span className="text-xs text-muted">
            {row.itemTotal > 0
              ? `${Math.round((row.quantity / row.itemTotal) * 100)}% of ${row.itemTotal}`
              : "—"}
          </span>

          <Progress
            value={row.quantity}
            max={Math.max(row.itemTotal, 1)}
            warnWhenFull={false}
            size="sm"
            className="mt-1.5"
          />
        </div>
      ),
    },
    {
      key: "shareOfSpace",
      header: "Share of this space",
      align: "right",
      hideBelow: "xl",
      sortValue: (row) => row.quantity / Math.max(capacity, 1),
      cell: (row) =>
        `${Math.round((row.quantity / Math.max(capacity, 1)) * 100)}%`,
    },
    {
      key: "updated",
      header: "Last changed",
      hideBelow: "xl",
      sortValue: (row) => new Date(row.updatedAt).getTime(),
      cell: (row) => formatDate(row.updatedAt),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <Button href={`/items/${row.itemId}`} variant="link" size="xs">
          View item
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      rows={contents}
      columns={columns}
      rowKey={(row) => row.allocationId}
      searchText={(row) => `${row.itemName} ${row.itemSku}`}
      searchPlaceholder="Search items here..."
      noun="items"
      initialSort={{ key: "quantity", direction: "desc" }}
      empty={
        <EmptyState
          icon={PackageOpen}
          title="This storage space is empty"
          description="Open an item and use Allocate to place units here."
        />
      }
    />
  );
}
