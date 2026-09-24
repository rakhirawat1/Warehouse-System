"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, LayoutGrid, Pencil, Plus, Trash2 } from "lucide-react";

import { deleteWarehouseAction } from "../actions";
import type { WarehouseRow } from "../queries";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import DataTable, { type Column } from "@/components/ui/data-table";
import DropdownMenu from "@/components/ui/dropdown-menu";
import EmptyState from "@/components/ui/empty-state";
import FormMessage from "@/components/ui/form-message";
import Progress from "@/components/ui/progress";
import { useAction } from "@/lib/use-action";

type WarehouseTableProps = {
  warehouses: WarehouseRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAddSpace: boolean;
};

export default function WarehouseTable({
  warehouses,
  canCreate,
  canUpdate,
  canDelete,
  canAddSpace,
}: WarehouseTableProps) {
  const router = useRouter();

  const [tab, setTab] = useState("all");
  const [pendingDelete, setPendingDelete] = useState<WarehouseRow | null>(null);

  const remove = useAction(deleteWarehouseAction, {
    onSuccess: () => {
      setPendingDelete(null);
      router.refresh();
    },
  });

  const counts = useMemo(
    () => ({
      all: warehouses.length,
      active: warehouses.filter((row) => row.status === "ACTIVE").length,
      inactive: warehouses.filter((row) => row.status === "INACTIVE").length,
    }),
    [warehouses],
  );

  const rows = useMemo(() => {
    if (tab === "active") {
      return warehouses.filter((row) => row.status === "ACTIVE");
    }

    if (tab === "inactive") {
      return warehouses.filter((row) => row.status === "INACTIVE");
    }

    return warehouses;
  }, [warehouses, tab]);

  const columns: Column<WarehouseRow>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (row) => row.name,
      cell: (row) => (
        <Link
          href={`/warehouses/${row.id}`}
          className="font-medium text-primary transition-colors hover:text-accent"
        >
          {row.name}
        </Link>
      ),
    },
    {
      key: "location",
      header: "Location",
      sortValue: (row) => row.location,
      hideBelow: "md",
      cell: (row) => row.location,
    },
    {
      key: "spaceCount",
      header: "Storage Spaces",
      align: "center",
      sortValue: (row) => row.spaceCount,
      cell: (row) => row.spaceCount,
    },
    {
      key: "capacity",
      header: "Total Capacity",
      align: "right",
      sortValue: (row) => row.capacity,
      cell: (row) => row.capacity.toLocaleString("en-US"),
    },
    {
      key: "used",
      header: "Used",
      align: "right",
      sortValue: (row) => row.used,
      cell: (row) => (
        <div className="inline-flex w-28 flex-col items-end">
          <span className="font-medium text-primary">
            {row.used.toLocaleString("en-US")}
          </span>

          <Progress
            value={row.used}
            max={row.allocatedCapacity}
            size="sm"
            className="mt-1.5"
          />

          <span className="mt-1 text-xs text-muted">
            {row.usedPercent}% of its spaces
          </span>
        </div>
      ),
    },
    {
      key: "available",
      header: "Available",
      align: "right",
      hideBelow: "lg",
      sortValue: (row) => row.available,
      cell: (row) => row.available.toLocaleString("en-US"),
    },
    {
      key: "status",
      header: "Status",
      sortValue: (row) => row.status,
      cell: (row) => (
        <Badge
          variant={row.status === "ACTIVE" ? "success" : "danger"}
          dot
        >
          {row.status === "ACTIVE" ? "Active" : "Inactive"}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (row) => (
        <div className="flex items-center justify-end gap-1">
          <Button href={`/warehouses/${row.id}`} variant="link" size="xs">
            View
          </Button>

          {canUpdate && (
            <Button
              href={`/warehouses/${row.id}/edit`}
              variant="link"
              size="xs"
            >
              Edit
            </Button>
          )}

          <DropdownMenu
            items={[
              {
                label: "Add storage space",
                href: `/warehouses/${row.id}/storage-spaces/new`,
                icon: <Plus className="h-4 w-4" />,
                disabled: !canAddSpace || row.status === "INACTIVE",
              },
              {
                label: "Edit warehouse",
                href: `/warehouses/${row.id}/edit`,
                icon: <Pencil className="h-4 w-4" />,
                disabled: !canUpdate,
              },
              {
                label: "Delete warehouse",
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
        searchText={(row) => `${row.name} ${row.location}`}
        searchPlaceholder="Search warehouses..."
        noun="warehouses"
        initialSort={{ key: "name", direction: "asc" }}
        tabs={[
          { value: "all", label: "All", count: counts.all },
          { value: "active", label: "Active", count: counts.active },
          { value: "inactive", label: "Inactive", count: counts.inactive },
        ]}
        tabValue={tab}
        onTabChange={setTab}
        empty={
          <EmptyState
            icon={Boxes}
            title="No warehouses yet"
            description="Create a warehouse, then add storage spaces inside it."
            action={
              canCreate && (
                <Button
                  href="/warehouses/new"
                  icon={<Plus className="h-4 w-4" />}
                >
                  Add Warehouse
                </Button>
              )
            }
          />
        }
      />

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={() => pendingDelete && remove.run(pendingDelete.id)}
        title="Delete warehouse"
        description="This cannot be undone."
        confirmLabel="Delete warehouse"
        pendingLabel="Deleting..."
        destructive
        pending={remove.pending}
        error={remove.error}
      >
        {pendingDelete && (
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="font-medium text-primary">{pendingDelete.name}</p>

            <p className="mt-1 text-sm text-secondary">
              {pendingDelete.location} · {pendingDelete.spaceCount} storage
              space
              {pendingDelete.spaceCount === 1 ? "" : "s"}
            </p>

            <p className="mt-2 flex items-start gap-2 text-sm text-secondary">
              <LayoutGrid className="mt-0.5 h-4 w-4 shrink-0 text-muted" />

              {pendingDelete.used > 0
                ? `It still holds ${pendingDelete.used} units. Move or dispatch that stock first, or set the warehouse to inactive to keep its history.`
                : "Setting it to inactive instead keeps its history and stops new stock arriving."}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
