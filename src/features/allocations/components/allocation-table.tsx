"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeftRight, PackageMinus, Pencil, Warehouse } from "lucide-react";

import type { AllocationRow } from "../queries";
import { CorrectQuantityDialog, DispatchStockDialog } from "./allocation-dialogs";
import MoveAllocationForm from "./move-allocation-form";

import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import DataTable, { type Column } from "@/components/ui/data-table";
import DropdownMenu from "@/components/ui/dropdown-menu";
import EmptyState from "@/components/ui/empty-state";
import FormMessage from "@/components/ui/form-message";
import Progress from "@/components/ui/progress";
import { STORAGE_TYPE_LABELS, type StorageType } from "@/lib/storage";

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

type AllocationTableProps = {
  allocations: AllocationRow[];
  storageSpaces: StorageSpaceOption[];
  canMove: boolean;
  canAdjust: boolean;
  canDispatch: boolean;
  hideItem?: boolean;
  emptyAction?: React.ReactNode;
};

function formatDate(value: Date) {
  return new Date(value).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AllocationTable({
  allocations,
  storageSpaces,
  canMove,
  canAdjust,
  canDispatch,
  hideItem = false,
  emptyAction,
}: AllocationTableProps) {
  const [moving, setMoving] = useState<AllocationRow | null>(null);
  const [correcting, setCorrecting] = useState<AllocationRow | null>(null);
  const [dispatching, setDispatching] = useState<AllocationRow | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const columns: Column<AllocationRow>[] = [
    ...(hideItem
      ? []
      : [
          {
            key: "item",
            header: "Item",
            sortValue: (row: AllocationRow) => row.itemName,
            cell: (row: AllocationRow) => (
              <div>
                <Link
                  href={`/items/${row.itemId}`}
                  className="font-medium text-primary transition-colors hover:text-accent"
                >
                  {row.itemName}
                </Link>

                <p className="mt-0.5 font-mono text-xs whitespace-nowrap text-muted">
                  {row.itemSku}
                </p>
              </div>
            ),
          } satisfies Column<AllocationRow>,
        ]),
    {
      key: "warehouse",
      header: "Warehouse",
      sortValue: (row) => row.warehouseName,
      cell: (row) => (
        <div>
          <Link
            href={`/warehouses/${row.warehouseId}`}
            className="font-medium text-primary transition-colors hover:text-accent"
          >
            {row.warehouseName}
          </Link>

          {row.warehouseStatus === "INACTIVE" && (
            <Badge variant="warning" className="mt-1">
              Inactive — stock can only move out
            </Badge>
          )}
        </div>
      ),
    },
    {
      key: "space",
      header: "Storage Space",
      sortValue: (row) => row.storageSpaceName,
      cell: (row) => (
        <div>
          <Link
            href={`/warehouses/${row.warehouseId}/storage-spaces/${row.storageSpaceId}`}
            className="transition-colors hover:text-accent"
          >
            {row.storageSpaceName}
          </Link>

          <p className="mt-0.5 text-xs text-muted">
            {STORAGE_TYPE_LABELS[row.storageType]}
          </p>
        </div>
      ),
    },
    {
      key: "quantity",
      header: "Quantity",
      align: "right",
      sortValue: (row) => row.quantity,
      cell: (row) => (
        <span className="font-semibold text-primary">
          {row.quantity.toLocaleString("en-US")}
        </span>
      ),
    },
    {
      key: "spaceUsage",
      header: "Space Usage",
      align: "right",
      hideBelow: "lg",
      sortValue: (row) => row.storageSpaceUsed / row.storageSpaceCapacity,
      cell: (row) => (
        <div className="inline-flex w-28 flex-col items-end">
          <span className="text-xs text-muted">
            {row.storageSpaceUsed} / {row.storageSpaceCapacity}
          </span>

          <Progress
            value={row.storageSpaceUsed}
            max={row.storageSpaceCapacity}
            size="sm"
            className="mt-1.5"
          />
        </div>
      ),
    },
    {
      key: "allocatedOn",
      header: "Allocated On",
      hideBelow: "xl",
      sortValue: (row) => new Date(row.createdAt).getTime(),
      cell: (row) => formatDate(row.createdAt),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button href={`/allocations/${row.id}`} variant="link" size="xs">
            View
          </Button>

          <DropdownMenu
            items={[
              {
                label: "Move to another space",
                icon: <ArrowLeftRight className="h-4 w-4" />,
                disabled: !canMove,
                onSelect: () => setMoving(row),
              },
              {
                label: "Correct quantity",
                icon: <Pencil className="h-4 w-4" />,
                disabled: !canAdjust,
                onSelect: () => setCorrecting(row),
              },
              {
                label: "Dispatch Stock",
                icon: <PackageMinus className="h-4 w-4" />,
                destructive: true,
                disabled: !canDispatch,
                onSelect: () => setDispatching(row),
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {successMessage && (
        <div className="mb-4">
          <FormMessage success={successMessage} />
        </div>
      )}

      <DataTable
        rows={allocations}
        columns={columns}
        rowKey={(row) => row.id}
        searchText={(row) =>
          `${row.itemName} ${row.itemSku} ${row.warehouseName} ${row.storageSpaceName}`
        }
        searchPlaceholder="Search allocations..."
        noun="allocations"
        initialSort={{ key: "quantity", direction: "desc" }}
        empty={
          <EmptyState
            icon={Warehouse}
            title="Nothing is allocated yet"
            description="Open an item and use Allocate to place its units into a storage space."
            action={emptyAction}
          />
        }
      />

      {moving && (
        <MoveAllocationForm
          allocation={{
            id: moving.id,
            itemName: moving.itemName,
            requiredStorageType: moving.requiredStorageType,
            storageSpaceId: moving.storageSpaceId,
            storageSpaceName: moving.storageSpaceName,
            warehouseName: moving.warehouseName,
            quantity: moving.quantity,
          }}
          storageSpaces={storageSpaces}
          open={Boolean(moving)}
          onOpenChange={(open) => {
            if (!open) {
              setMoving(null);
            }
          }}
        />
      )}

      <CorrectQuantityDialog
        allocation={correcting}
        onClose={() => setCorrecting(null)}
        onDone={setSuccessMessage}
      />

      <DispatchStockDialog
        allocation={dispatching}
        onClose={() => setDispatching(null)}
        onDone={setSuccessMessage}
      />
    </>
  );
}
