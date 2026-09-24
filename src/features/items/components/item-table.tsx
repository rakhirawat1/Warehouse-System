"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Package, Pencil, Plus, Trash2 } from "lucide-react";

import { deleteItemAction } from "../actions";
import type { ItemRow } from "../queries";
import Badge from "@/components/ui/badge";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import DataTable, { type Column } from "@/components/ui/data-table";
import DropdownMenu from "@/components/ui/dropdown-menu";
import EmptyState from "@/components/ui/empty-state";
import FormMessage from "@/components/ui/form-message";
import { STORAGE_TYPE_LABELS } from "@/lib/storage";
import { useAction } from "@/lib/use-action";

type ItemTableProps = {
  items: ItemRow[];
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
  canAllocate: boolean;
  /** Filters the page itself applied, so the export matches the screen. */
  pageFilters?: { search?: string; filter?: string };
};

type AllocationStatus = "none" | "partial" | "full";

function statusOf(item: ItemRow): AllocationStatus {
  if (item.allocated === 0) {
    return "none";
  }

  return item.remaining > 0 ? "partial" : "full";
}

const STATUS_LABELS: Record<AllocationStatus, string> = {
  none: "Not Allocated",
  partial: "Partially Allocated",
  full: "Fully Allocated",
};

const STATUS_VARIANTS = {
  none: "neutral",
  partial: "info",
  full: "success",
} as const;

export default function ItemTable({
  items,
  canCreate,
  canUpdate,
  canDelete,
  canAllocate,
  pageFilters = {},
}: ItemTableProps) {
  const router = useRouter();

  const [tab, setTab] = useState("all");
  const [tableSearch, setTableSearch] = useState("");

  const exportParams = new URLSearchParams();
  if (pageFilters.search) exportParams.set("search", pageFilters.search);
  if (pageFilters.filter) exportParams.set("filter", pageFilters.filter);
  if (tab !== "all") exportParams.set("status", tab);
  if (tableSearch.trim()) exportParams.set("q", tableSearch.trim());
  const exportHref = `/api/items/export?${exportParams.toString()}`;
  const [pendingDelete, setPendingDelete] = useState<ItemRow | null>(null);

  const remove = useAction(deleteItemAction, {
    onSuccess: () => {
      setPendingDelete(null);
      router.refresh();
    },
  });

  const counts = useMemo(() => {
    const result = { all: items.length, none: 0, partial: 0, full: 0 };

    for (const item of items) {
      result[statusOf(item)] += 1;
    }

    return result;
  }, [items]);

  const rows = useMemo(
    () => (tab === "all" ? items : items.filter((item) => statusOf(item) === tab)),
    [items, tab],
  );

  const columns: Column<ItemRow>[] = [
    {
      key: "name",
      header: "Name",
      sortValue: (item) => item.name,
      cell: (item) => (
        <Link
          href={`/items/${item.id}`}
          className="font-medium text-primary transition-colors hover:text-accent"
        >
          {item.name}
        </Link>
      ),
    },
    {
      key: "sku",
      header: "SKU",
      sortValue: (item) => item.sku,
      hideBelow: "md",
      cell: (item) => (
        <span className="font-mono text-xs whitespace-nowrap text-secondary">{item.sku}</span>
      ),
    },
    {
      key: "quantity",
      header: "Total Quantity",
      align: "right",
      sortValue: (item) => item.quantity,
      cell: (item) => (
        <span className="font-semibold text-primary">
          {item.quantity.toLocaleString("en-US")}
        </span>
      ),
    },
    {
      key: "allocated",
      header: "Allocated",
      align: "right",
      sortValue: (item) => item.allocated,
      cell: (item) => item.allocated.toLocaleString("en-US"),
    },
    {
      key: "remaining",
      header: "Remaining",
      align: "right",
      sortValue: (item) => item.remaining,
      cell: (item) => (
        <span
          className={
            item.remaining > 0 ? "font-medium text-warning" : "text-muted"
          }
        >
          {item.remaining.toLocaleString("en-US")}
        </span>
      ),
    },
    {
      key: "storageType",
      header: "Storage Type",
      hideBelow: "lg",
      sortValue: (item) => STORAGE_TYPE_LABELS[item.requiredStorageType],
      cell: (item) => STORAGE_TYPE_LABELS[item.requiredStorageType],
    },
    {
      key: "locations",
      header: "Locations",
      align: "center",
      hideBelow: "lg",
      sortValue: (item) => item.locationCount,
      cell: (item) => item.locationCount,
    },
    {
      key: "status",
      header: "Status",
      sortValue: (item) => STATUS_LABELS[statusOf(item)],
      cell: (item) => {
        const status = statusOf(item);

        return (
          <Badge variant={STATUS_VARIANTS[status]}>
            {STATUS_LABELS[status]}
          </Badge>
        );
      },
    },
    {
      key: "actions",
      header: "Actions",
      align: "right",
      cell: (item) => (
        <div className="flex items-center justify-end gap-1">
          <Button href={`/items/${item.id}`} variant="link" size="xs">
            View
          </Button>

          {canAllocate && item.remaining > 0 && (
            <Button href={`/items/${item.id}/allocate`} variant="link" size="xs">
              Allocate
            </Button>
          )}

          <DropdownMenu
            items={[
              {
                label: "Edit item",
                href: `/items/${item.id}/edit`,
                icon: <Pencil className="h-4 w-4" />,
                disabled: !canUpdate,
              },
              {
                label: "Allocate stock",
                href: `/items/${item.id}/allocate`,
                icon: <Plus className="h-4 w-4" />,
                disabled: !canAllocate || item.remaining === 0,
              },
              {
                label: "Delete item",
                icon: <Trash2 className="h-4 w-4" />,
                destructive: true,
                disabled: !canDelete,
                onSelect: () => {
                  remove.reset();
                  setPendingDelete(item);
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
        rowKey={(item) => item.id}
        searchText={(item) => `${item.name} ${item.sku} ${item.description ?? ""}`}
        searchPlaceholder="Search items..."
        onSearchChange={setTableSearch}
        toolbar={
          <a
            href={exportHref}
            download
            className="inline-flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-sm font-medium whitespace-nowrap text-secondary shadow-card transition-colors hover:border-border-strong hover:bg-surface-subtle hover:text-primary"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </a>
        }
        noun="items"
        initialSort={{ key: "name", direction: "asc" }}
        tabs={[
          { value: "all", label: "All", count: counts.all },
          { value: "none", label: "Not Allocated", count: counts.none },
          { value: "partial", label: "Partially Allocated", count: counts.partial },
          { value: "full", label: "Fully Allocated", count: counts.full },
        ]}
        tabValue={tab}
        onTabChange={setTab}
        empty={
          <EmptyState
            icon={Package}
            title="No items yet"
            description="Add an item with its total quantity, then allocate those units to storage spaces."
            action={
              canCreate && (
                <Button href="/items/new" icon={<Plus className="h-4 w-4" />}>
                  Add Item
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
        title="Delete item"
        description="This cannot be undone."
        confirmLabel="Delete item"
        pendingLabel="Deleting..."
        destructive
        pending={remove.pending}
        error={remove.error}
      >
        {pendingDelete && (
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="font-medium text-primary">{pendingDelete.name}</p>

            <p className="mt-1 font-mono text-xs text-muted">
              {pendingDelete.sku}
            </p>

            <p className="mt-2 text-sm text-secondary">
              {pendingDelete.allocated > 0
                ? `${pendingDelete.allocated} units are still allocated to ${pendingDelete.locationCount} storage space${
                    pendingDelete.locationCount === 1 ? "" : "s"
                  }. Move or dispatch that stock first.`
                : `Its history stays in the activity log, with the name kept as "${pendingDelete.name}".`}
            </p>
          </div>
        )}
      </ConfirmDialog>
    </>
  );
}
