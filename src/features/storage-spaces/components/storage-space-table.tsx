"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { LayoutGrid, Pencil, Trash2 } from "lucide-react";

import { deleteStorageSpaceAction } from "../actions";
import type { StorageSpaceRow } from "../queries";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import DataTable, { type Column } from "@/components/ui/data-table";
import DropdownMenu from "@/components/ui/dropdown-menu";
import EmptyState from "@/components/ui/empty-state";
import FormMessage from "@/components/ui/form-message";
import Progress from "@/components/ui/progress";
import { STORAGE_TYPE_LABELS } from "@/lib/storage";
import { useAction } from "@/lib/use-action";

type StorageSpaceTableProps = {
  storageSpaces: StorageSpaceRow[];
  canUpdate: boolean;
  canDelete: boolean;
  hideWarehouse?: boolean;
  emptyAction?: React.ReactNode;
};

export default function StorageSpaceTable({
  storageSpaces,
  canUpdate,
  canDelete,
  hideWarehouse = false,
  emptyAction,
}: StorageSpaceTableProps) {
  const router = useRouter();

  const [tab, setTab] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<StorageSpaceRow | null>(
    null,
  );

  const remove = useAction(deleteStorageSpaceAction, {
    onSuccess: () => {
      setPendingDelete(null);
      router.refresh();
    },
  });

  const counts = useMemo(
    () => ({
      all: storageSpaces.length,
      available: storageSpaces.filter((row) => row.available > 0).length,
      full: storageSpaces.filter((row) => row.available === 0).length,
      empty: storageSpaces.filter((row) => row.used === 0).length,
    }),
    [storageSpaces],
  );

  const rows = useMemo(() => {
    if (tab === "available") {
      return storageSpaces.filter((row) => row.available > 0);
    }

    if (tab === "full") {
      return storageSpaces.filter((row) => row.available === 0);
    }

    if (tab === "empty") {
      return storageSpaces.filter((row) => row.used === 0);
    }

    return storageSpaces;
  }, [storageSpaces, tab]);

  const columns: Column<StorageSpaceRow>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (row) => row.name,
      cell: (row) => (
        <Link
          href={`/warehouses/${row.warehouseId}/storage-spaces/${row.id}`}
          className="font-medium text-primary transition-colors hover:text-accent"
        >
          {row.name}
        </Link>
      ),
    },
    ...(hideWarehouse
      ? []
      : [
          {
            key: "warehouse",
            header: "Warehouse",
            sortValue: (row: StorageSpaceRow) => row.warehouseName,
            cell: (row: StorageSpaceRow) => (
              <Link
                href={`/warehouses/${row.warehouseId}`}
                className="transition-colors hover:text-accent"
              >
                {row.warehouseName}
              </Link>
            ),
          } satisfies Column<StorageSpaceRow>,
        ]),
    {
      key: "type",
      header: "Type",
      sortValue: (row) => STORAGE_TYPE_LABELS[row.storageType],
      hideBelow: "md",
      cell: (row) => (
        <Badge variant="outline">{STORAGE_TYPE_LABELS[row.storageType]}</Badge>
      ),
    },
    {
      key: "capacity",
      header: "Capacity (units)",
      align: "right",
      sortValue: (row) => row.capacity,
      cell: (row) => row.capacity.toLocaleString("en-US"),
    },
    {
      key: "used",
      header: "Used (units)",
      align: "right",
      sortValue: (row) => row.used,
      cell: (row) => (
        <div className="inline-flex w-28 flex-col items-end">
          <span className="font-medium text-primary">
            {row.used.toLocaleString("en-US")}
          </span>

          <Progress
            value={row.used}
            max={row.capacity}
            size="sm"
            className="mt-1.5"
          />

          <span className="mt-1 text-xs text-muted">{row.usedPercent}% full</span>
        </div>
      ),
    },
    {
      key: "available",
      header: "Available (units)",
      align: "right",
      sortValue: (row) => row.available,
      cell: (row) => row.available.toLocaleString("en-US"),
    },
    {
      key: "items",
      header: "Items",
      align: "center",
      hideBelow: "lg",
      sortValue: (row) => row.itemCount,
      cell: (row) => row.itemCount,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => (row.available === 0 ? "Full" : "Available"),
      cell: (row) =>
        row.warehouseStatus === "INACTIVE" ? (
          <Badge variant="warning" dot>
            Warehouse inactive
          </Badge>
        ) : row.available === 0 ? (
          <Badge variant="danger" dot>
            Full
          </Badge>
        ) : row.usedPercent >= 90 ? (
          <Badge variant="warning" dot>
            Nearly full
          </Badge>
        ) : (
          <Badge variant="success" dot>
            Available
          </Badge>
        ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button
            href={`/warehouses/${row.warehouseId}/storage-spaces/${row.id}`}
            variant="link"
            size="xs"
          >
            View
          </Button>

          {canUpdate && (
            <Button
              href={`/warehouses/${row.warehouseId}/storage-spaces/${row.id}/edit`}
              variant="link"
              size="xs"
            >
              Edit
            </Button>
          )}

          <DropdownMenu
            items={[
              {
                label: "Edit storage space",
                href: `/warehouses/${row.warehouseId}/storage-spaces/${row.id}/edit`,
                icon: <Pencil className="h-4 w-4" />,
                disabled: !canUpdate,
              },
              {
                label: "Delete storage space",
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                disabled: !canDelete,
                onSelect: () => {
                  remove.reset();
                  setPendingDelete(row);
                },
              },
            ]}
          />
        </div>
      ),
    },
  ];

  return (
    <>
      {remove.message && (
        <div className="mb-4">
          <FormMessage success={remove.message} />
        </div>
      )}

      <DataTable
        rows={rows}
        columns={columns}
        rowKey={(row) => row.id}
        searchText={(row) =>
          `${row.name} ${row.warehouseName} ${STORAGE_TYPE_LABELS[row.storageType]}`
        }
        searchPlaceholder="Search storage spaces..."
        noun="storage spaces"
        initialSort={{ key: "name", direction: "asc" }}
        tabs={[
          { value: "all", label: "All", count: counts.all },
          { value: "available", label: "Has room", count: counts.available },
          { value: "full", label: "Full", count: counts.full },
          { value: "empty", label: "Empty", count: counts.empty },
        ]}
        tabValue={tab}
        onTabChange={setTab}
        empty={
          <EmptyState
            icon={LayoutGrid}
            title="No storage spaces yet"
            description="A warehouse can only hold stock once it has storage spaces inside it."
            action={emptyAction}
          />
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove.run(pendingDelete.id)}
        title="Delete storage space"
        description="This cannot be undone."
        confirmLabel="Delete storage space"
        pendingLabel="Deleting..."
        destructive
        pending={remove.pending}
        error={remove.error}
      >
        {pendingDelete && (
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="font-medium text-primary">{pendingDelete.name}</p>

            <p className="mt-1 text-sm text-secondary">
              {pendingDelete.warehouseName} ·{" "}
              {STORAGE_TYPE_LABELS[pendingDelete.storageType]}
            </p>

            <p className="mt-2 text-sm text-secondary">
              {pendingDelete.used > 0
                ? `It holds ${pendingDelete.used} units of ${pendingDelete.itemCount} item${
                    pendingDelete.itemCount === 1 ? "" : "s"
                  }. Move that stock elsewhere first.`
                : "It is empty, so nothing will be lost."}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
