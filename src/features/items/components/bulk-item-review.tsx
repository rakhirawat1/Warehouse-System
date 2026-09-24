"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CheckCircle2,
  CircleAlert,
  Loader2,
  Plus,
  Sparkles,
  X,
} from "lucide-react";

import { createItemAction } from "../actions";
import type { ItemSuggestion } from "@/features/ai/assist";
import Button from "@/components/ui/button";
import { Input, Select, Textarea } from "@/components/ui/input";
import { STORAGE_TYPES, STORAGE_TYPE_LABELS, type StorageType } from "@/lib/storage";
import { cn } from "@/lib/utils";

type Row = {
  key: string;
  selected: boolean;
  name: string;
  sku: string;
  description: string;
  storageType: StorageType;
  storageReason: string;
  quantity: string;
  status: "idle" | "saving" | "done" | "error";
  message: string | null;
};

function toRows(suggestions: ItemSuggestion[]): Row[] {
  return suggestions.map((suggestion, index) => ({
    key: `${index}-${suggestion.sku}`,
    selected: true,
    name: suggestion.name,
    sku: suggestion.sku,
    description: suggestion.description,
    storageType: suggestion.storageType,
    storageReason: suggestion.storageReason,
    quantity: suggestion.quantity === null ? "" : String(suggestion.quantity),
    status: "idle",
    message: null,
  }));
}

const validQuantity = (value: string) =>
  value.trim() !== "" && Number.isInteger(Number(value)) && Number(value) >= 0;

/**
 * Review screen for several AI-suggested items. Each is saved through the
 * normal create action, one at a time, so one failure does not undo the others.
 */
export default function BulkItemReview({
  suggestions,
  onDismiss,
}: {
  suggestions: ItemSuggestion[];
  /** Moves one suggestion into the single-item form instead. */
  onUseOne: (suggestion: ItemSuggestion) => void;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>(() => toRows(suggestions));
  const [saving, setSaving] = useState(false);

  function update(key: string, patch: Partial<Row>) {
    setRows((current) =>
      current.map((row) =>
        row.key === key
          ? { ...row, ...patch, status: row.status === "done" ? "done" : "idle", message: null }
          : row,
      ),
    );
  }

  const pending = rows.filter((row) => row.selected && row.status !== "done");
  const missingQuantity = pending.some((row) => !validQuantity(row.quantity));
  const doneCount = rows.filter((row) => row.status === "done").length;

  async function createAll() {
    setSaving(true);

    for (const row of pending) {
      setRows((current) =>
        current.map((r) => (r.key === row.key ? { ...r, status: "saving" } : r)),
      );

      const result = await createItemAction({
        name: row.name,
        sku: row.sku,
        description: row.description,
        requiredStorageType: row.storageType,
        quantity: row.quantity,
      });

      setRows((current) =>
        current.map((r) =>
          r.key === row.key
            ? {
                ...r,
                status: result.ok ? "done" : "error",
                message: result.ok ? "Created" : result.error,
              }
            : r,
        ),
      );
    }

    setSaving(false);
    router.refresh();
  }

  const allDone = rows.length > 0 && rows.every((row) => !row.selected || row.status === "done") && doneCount > 0;

  return (
    <section className="overflow-hidden rounded-xl border border-accent/30 bg-surface shadow-card">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-accent-muted/50 px-5 py-4">
        <div>
          <p className="flex items-center gap-2 font-semibold text-primary">
            <Sparkles className="h-4 w-4 text-accent" />
            {rows.length} items found in your description
          </p>

          <p className="mt-1 text-xs text-muted">
            AI-generated suggestions — review and edit each one, then create
            them. Quantities are only filled when you wrote them.
          </p>
        </div>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-label="Dismiss suggestions"
          icon={<X className="h-4 w-4" />}
          onClick={onDismiss}
          disabled={saving}
        />
      </div>

      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const locked = row.status === "done" || row.status === "saving";

          return (
            <li
              key={row.key}
              className={cn(
                "grid gap-3 px-5 py-4 transition-colors",
                !row.selected && "opacity-50",
                row.status === "done" && "bg-success-muted/40",
              )}
            >
              <div className="flex flex-wrap items-center gap-3">
                <input
                  type="checkbox"
                  aria-label={`Include ${row.name}`}
                  checked={row.selected}
                  disabled={locked || saving}
                  onChange={(event) => update(row.key, { selected: event.target.checked })}
                  className="h-4 w-4 cursor-pointer accent-[var(--accent)]"
                />

                <Input
                  aria-label="Item name"
                  value={row.name}
                  disabled={locked}
                  onChange={(event) => update(row.key, { name: event.target.value })}
                  className="h-9 min-w-48 flex-1 font-medium"
                />

                <Input
                  aria-label="SKU"
                  value={row.sku}
                  disabled={locked}
                  onChange={(event) => update(row.key, { sku: event.target.value.toUpperCase() })}
                  className="h-9 w-44 font-mono text-xs uppercase"
                />

                <Select
                  aria-label="Storage type"
                  value={row.storageType}
                  disabled={locked}
                  onChange={(event) => update(row.key, { storageType: event.target.value as StorageType })}
                  className="h-9 w-40"
                >
                  {STORAGE_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {STORAGE_TYPE_LABELS[type]}
                    </option>
                  ))}
                </Select>

                <Input
                  aria-label="Quantity"
                  type="number"
                  min="0"
                  placeholder="Qty"
                  value={row.quantity}
                  disabled={locked}
                  onChange={(event) => update(row.key, { quantity: event.target.value })}
                  className={cn(
                    "h-9 w-24",
                    row.selected && !locked && !validQuantity(row.quantity) && "border-warning",
                  )}
                />
              </div>

              <div className="grid gap-2 pl-7 md:grid-cols-[1fr_auto] md:items-start">
                <Textarea
                  aria-label="Description"
                  rows={2}
                  value={row.description}
                  disabled={locked}
                  onChange={(event) => update(row.key, { description: event.target.value })}
                  className="text-sm"
                />

                <div className="flex flex-wrap items-center gap-2 md:flex-col md:items-end">
                  {row.status === "saving" && (
                    <span className="flex items-center gap-1 text-xs text-muted">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" /> Creating...
                    </span>
                  )}

                  {row.status === "done" && (
                    <span className="flex items-center gap-1 text-xs font-medium text-success">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Created
                    </span>
                  )}
                </div>
              </div>

              <div className="pl-7 text-xs">
                {row.status === "error" && row.message ? (
                  <p className="flex items-start gap-1.5 text-danger">
                    <CircleAlert className="mt-px h-3.5 w-3.5 shrink-0" />
                    {row.message}
                  </p>
                ) : row.selected && !locked && !validQuantity(row.quantity) ? (
                  <p className="text-warning">Enter the quantity for this item.</p>
                ) : row.storageReason ? (
                  <p className="text-muted">
                    Storage: {STORAGE_TYPE_LABELS[row.storageType]} — {row.storageReason}
                  </p>
                ) : null}
              </div>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-subtle px-5 py-3">
        <p className="text-sm text-muted">
          {doneCount > 0 ? `${doneCount} of ${rows.length} created. ` : ""}
          Each item is checked and saved like a normal new item.
        </p>

        {allDone ? (
          <Button type="button" onClick={() => router.push("/items")}>
            Go to items
          </Button>
        ) : (
          <Button
            type="button"
            icon={saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            onClick={createAll}
            disabled={saving || pending.length === 0 || missingQuantity}
          >
            {saving
              ? "Creating..."
              : `Create ${pending.length} item${pending.length === 1 ? "" : "s"}`}
          </Button>
        )}
      </div>
    </section>
  );
}
