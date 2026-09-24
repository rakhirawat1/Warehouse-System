"use client";

import { useState } from "react";

import type { AllocationRow } from "@/features/allocations/queries";
import AllocationTable from "@/features/allocations/components/allocation-table";

import Button from "@/components/ui/button";
import Tabs from "@/components/ui/tabs";
import { STORAGE_TYPE_DESCRIPTIONS, STORAGE_TYPE_LABELS } from "@/lib/storage";
import type { StorageType } from "@/lib/storage";

type StorageSpaceOption = {
  id: string;
  name: string;
  storageType: StorageType;
  capacity: number;
  used: number;
  available: number;
  warehouseId: string;
  warehouseName: string;
  warehouseStatus: "ACTIVE" | "INACTIVE";
};

type ItemDetailTabsProps = {
  item: {
    id: string;
    name: string;
    sku: string;
    description: string | null;
    requiredStorageType: StorageType;
    quantity: number;
    allocated: number;
    remaining: number;
    locationCount: number;
    warehouseCount: number;
    createdAt: Date;
    updatedAt: Date;
  };
  allocations: AllocationRow[];
  storageSpaces: StorageSpaceOption[];
  canAllocate: boolean;
  canMove: boolean;
  canAdjust: boolean;
  canDispatch: boolean;
};

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function ItemDetailTabs({
  item,
  allocations,
  storageSpaces,
  canAllocate,
  canMove,
  canAdjust,
  canDispatch,
}: ItemDetailTabsProps) {
  const [tab, setTab] = useState("locations");

  return (
    <div>
      <div className="mb-5">
        <Tabs
          variant="underline"
          layoutId="item-detail-tabs"
          value={tab}
          onChange={setTab}
          options={[
            {
              value: "locations",
              label: "Storage Locations",
              count: allocations.length,
            },
            { value: "details", label: "Details" },
          ]}
        />
      </div>

      {tab === "locations" && (
        <AllocationTable
          allocations={allocations}
          storageSpaces={storageSpaces}
          canMove={canMove}
          canAdjust={canAdjust}
          canDispatch={canDispatch}
          hideItem
          emptyAction={
            canAllocate &&
            item.remaining > 0 && (
              <Button href={`/items/${item.id}/allocate`}>
                Allocate {item.remaining} units
              </Button>
            )
          }
        />
      )}

      {tab === "details" && (
        <div className="rounded-xl border border-border bg-surface shadow-card">
          <dl className="divide-y divide-border">
            {[
              ["Name", item.name],
              ["Item code", item.sku],
              ["Description", item.description || "No description provided."],
              [
                "Storage needed",
                `${STORAGE_TYPE_LABELS[item.requiredStorageType]} — ${
                  STORAGE_TYPE_DESCRIPTIONS[item.requiredStorageType]
                }`,
              ],
              [
                "Total quantity",
                `${item.quantity.toLocaleString("en-US")} units the business owns`,
              ],
              [
                "Allocated",
                `${item.allocated.toLocaleString("en-US")} units across ${item.locationCount} storage space${
                  item.locationCount === 1 ? "" : "s"
                } in ${item.warehouseCount} warehouse${
                  item.warehouseCount === 1 ? "" : "s"
                }`,
              ],
              [
                "Remaining",
                `${item.remaining.toLocaleString("en-US")} units are not in a storage space yet`,
              ],
              ["Created", formatDate(item.createdAt)],
              ["Last updated", formatDate(item.updatedAt)],
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
