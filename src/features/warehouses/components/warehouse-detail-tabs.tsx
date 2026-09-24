"use client";

import { useState } from "react";
import Link from "next/link";
import { Package, Plus } from "lucide-react";

import type { StorageSpaceRow } from "@/features/storage-spaces/queries";
import StorageSpaceTable from "@/features/storage-spaces/components/storage-space-table";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import DataTable, { type Column } from "@/components/ui/data-table";
import EmptyState from "@/components/ui/empty-state";
import Tabs from "@/components/ui/tabs";
import { STORAGE_TYPE_LABELS, type StorageType } from "@/lib/storage";

export type WarehouseItemRow = {
  itemId: string;
  itemName: string;
  itemSku: string;
  requiredStorageType: StorageType;
  quantity: number;
  spaceCount: number;
  spaceNames: string;
};

type WarehouseDetailTabsProps = {
  warehouse: {
    id: string;
    name: string;
    location: string;
    status: "ACTIVE" | "INACTIVE";
    capacity: number;
    allocatedCapacity: number;
    unassignedCapacity: number;
    used: number;
    available: number;
    spaceCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  storageSpaces: StorageSpaceRow[];
  items: WarehouseItemRow[];
  canUpdateSpace: boolean;
  canDeleteSpace: boolean;
  canAddSpace: boolean;
};

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function WarehouseDetailTabs({
  warehouse,
  storageSpaces,
  items,
  canUpdateSpace,
  canDeleteSpace,
  canAddSpace,
}: WarehouseDetailTabsProps) {
  const [tab, setTab] = useState("spaces");

  const itemColumns: Column<WarehouseItemRow>[] = [
    {
      key: "name",
      header: "Item",
      sortValue: (row) => row.itemName,
      cell: (row) => (
        <Link
          href={`/items/${row.itemId}`}
          className="font-medium text-primary transition-colors hover:text-accent"
        >
          {row.itemName}
        </Link>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      sortValue: (row) => row.itemSku,
      hideBelow: "md",
      cell: (row) => (
        <span className="font-mono text-xs whitespace-nowrap text-secondary">{row.itemSku}</span>
      ),
    },
    {
      key: "type",
      header: "Storage Type",
      hideBelow: "lg",
      sortValue: (row) => STORAGE_TYPE_LABELS[row.requiredStorageType],
      cell: (row) => (
        <Badge variant="outline">
          {STORAGE_TYPE_LABELS[row.requiredStorageType]}
        </Badge>
      ),
    },
    {
      key: "spaces",
      header: "Stored in",
      sortValue: (row) => row.spaceCount,
      cell: (row) => (
        <span title={row.spaceNames}>
          {row.spaceCount} space{row.spaceCount === 1 ? "" : "s"}
        </span>
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
    <div>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Tabs
          variant="underline"
          layoutId="warehouse-detail-tabs"
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "spaces",
              label: "Storage Spaces",
              count: storageSpaces.length,
            },
            { value: "items", label: "Items", count: items.length },
            { value: "details", label: "Details" },
          ]}
        />

        {tab === "spaces" && canAddSpace && warehouse.status === "ACTIVE" && (
          <Button
            href={`/warehouses/${warehouse.id}/storage-spaces/new`}
            icon={<Plus className="h-4 w-4" />}
            size="sm"
          >
            Add Storage Space
          </Button>
        )}
      </div>

      {tab === "spaces" && (
        <StorageSpaceTable
          storageSpaces={storageSpaces}
          canUpdate={canUpdateSpace}
          canDelete={canDeleteSpace}
          hideWarehouse
          emptyAction={
            canAddSpace &&
            warehouse.status === "ACTIVE" && (
              <Button
                href={`/warehouses/${warehouse.id}/storage-spaces/new`}
                icon={<Plus className="h-4 w-4" />}
              >
                Add Storage Space
              </Button>
            )
          }
        />
      )}

      {tab === "items" && (
        <DataTable
          rows={items}
          columns={itemColumns}
          rowKey={(row) => row.itemId}
          searchText={(row) => `${row.itemName} ${row.itemSku}`}
          searchPlaceholder="Search items here..."
          noun="items"
          initialSort={{ key: "quantity", direction: "desc" }}
          empty={
            <EmptyState
              icon={Package}
              title="Nothing is stored here yet"
              description={`No item has been allocated to a storage space in ${warehouse.name}.`}
            />
          }
        />
      )}

      {tab === "details" && (
        <div className="rounded-xl border border-border bg-surface shadow-card">
          <dl className="divide-y divide-border">
            {[
              ["Name", warehouse.name],
              ["Location", warehouse.location],
              [
                "Status",
                warehouse.status === "ACTIVE"
                  ? "Active — can receive new stock"
                  : "Inactive — stock can only move out",
              ],
              [
                "Warehouse capacity",
                `${warehouse.capacity.toLocaleString("en-US")} units`,
              ],
              [
                "Given to storage spaces",
                `${warehouse.allocatedCapacity.toLocaleString("en-US")} units across ${warehouse.spaceCount} space${
                  warehouse.spaceCount === 1 ? "" : "s"
                }`,
              ],
              [
                "Not yet assigned",
                `${warehouse.unassignedCapacity.toLocaleString("en-US")} units of capacity are not inside any storage space, so they cannot be used yet`,
              ],
              ["Units stored", `${warehouse.used.toLocaleString("en-US")} units`],
              [
                "Free room",
                `${warehouse.available.toLocaleString("en-US")} units inside existing storage spaces`,
              ],
              ["Created", formatDate(warehouse.createdAt)],
              ["Last updated", formatDate(warehouse.updatedAt)],
            ].map(([label, value]) => (
              <div
                key={label}
                className="grid gap-1 px-5 py-4 sm:grid-cols-[220px_1fr] sm:gap-4"
              >
                <dt className="text-sm font-medium text-muted">{label}</dt>

                <dd className="text-sm text-primary">{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </div>
  );
}
