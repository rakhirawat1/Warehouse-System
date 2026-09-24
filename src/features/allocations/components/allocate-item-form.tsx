"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, TriangleAlert } from "lucide-react";

import { allocateStockAction } from "../actions";
import Button from "@/components/ui/button";
import { FieldHint, Input, Label, Select } from "@/components/ui/input";
import Progress from "@/components/ui/progress";
import {
  canStore,
  STORAGE_TYPE_LABELS,
  type StorageType,
} from "@/lib/storage";

type Item = {
  id: string;
  name: string;
  sku: string;
  requiredStorageType: StorageType;
  quantity: number;
  allocated: number;
  remaining: number;
};

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

type Line = {
  key: string;
  warehouseId: string;
  storageSpaceId: string;
  quantity: string;
};

let nextKey = 1;

function emptyLine(): Line {
  return {
    key: `line-${nextKey++}`,
    warehouseId: "",
    storageSpaceId: "",
    quantity: "",
  };
}

/** Allocates to several spaces in one submission. On failure every line is kept for fixing. */
export default function AllocateItemForm({
  item,
  storageSpaces,
}: {
  item: Item;
  storageSpaces: StorageSpaceOption[];
}) {
  const router = useRouter();

  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Only spaces this item may legally use, in a warehouse taking stock. */
  const usableSpaces = useMemo(
    () =>
      storageSpaces.filter(
        (space) =>
          canStore(item.requiredStorageType, space.storageType) &&
          space.warehouseStatus === "ACTIVE",
      ),
    [storageSpaces, item.requiredStorageType],
  );

  const warehouses = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();

    for (const space of usableSpaces) {
      map.set(space.warehouseId, {
        id: space.warehouseId,
        name: space.warehouseName,
      });
    }

    return [...map.values()].sort((a, b) =>
      a.name.localeCompare(b.name),
    );
  }, [usableSpaces]);

  function updateLine(key: string, patch: Partial<Line>) {
    setError(null);

    setLines((current) =>
      current.map((line) =>
        line.key === key ? { ...line, ...patch } : line,
      ),
    );
  }

  function removeLine(key: string) {
    setError(null);
    setLines((current) =>
      current.filter((line) => line.key !== key),
    );
  }

  const spaceById = useMemo(
    () => new Map(usableSpaces.map((space) => [space.id, space])),
    [usableSpaces],
  );

  const plannedTotal = lines.reduce(
    (sum, line) => sum + (Number(line.quantity) || 0),
    0,
  );

  const overRemaining = plannedTotal > item.remaining;

  const duplicateSpace = lines.some(
    (line, index) =>
      line.storageSpaceId &&
      lines.findIndex(
        (other) => other.storageSpaceId === line.storageSpaceId,
      ) !== index,
  );

  const lineErrors = lines.map((line) => {
    const quantity = Number(line.quantity);
    const space = spaceById.get(line.storageSpaceId);

    if (!line.storageSpaceId) {
      return "Choose a storage space.";
    }

    if (!Number.isInteger(quantity) || quantity <= 0) {
      return "Enter a whole number above zero.";
    }

    if (space && quantity > space.available) {
      return `${space.name} only has room for ${space.available} units.`;
    }

    return null;
  });

  const canSubmit =
    !pending &&
    lines.length > 0 &&
    lineErrors.every((error) => error === null) &&
    !overRemaining &&
    !duplicateSpace &&
    plannedTotal > 0;

  async function handleSubmit() {
    setPending(true);
    setError(null);

    const result = await allocateStockAction({
      itemId: item.id,
      lines: lines.map((line) => ({
        storageSpaceId: line.storageSpaceId,
        quantity: Number(line.quantity),
      })),
      note: note.trim() || null,
    });

    setPending(false);

    if (!result.ok) {
      // Nothing was saved: the server rolled the whole submission back.
      setError(result.error);
      router.refresh();
      return;
    }

    router.push(`/items/${item.id}`);
    router.refresh();
  }

  if (warehouses.length === 0) {
    return (
      <div className="rounded-xl border border-warning-muted bg-warning-muted p-5">
        <p className="flex items-center gap-2 font-medium text-warning">
          <TriangleAlert className="h-4 w-4" />
          No storage space can take this item
        </p>

        <p className="mt-2 text-sm text-warning">
          {item.name} needs{" "}
          {STORAGE_TYPE_LABELS[item.requiredStorageType].toLowerCase()}{" "}
          storage. Add a matching storage space in an active warehouse,
          then come back.
        </p>

        <div className="mt-4">
          <Button href="/warehouses" variant="secondary" size="sm">
            Go to warehouses
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <div className="space-y-5">
        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <Label htmlFor="planned">Quantity to allocate</Label>

          <Input
            id="planned"
            type="number"
            value={plannedTotal || ""}
            readOnly
            className="bg-surface-subtle font-semibold"
          />

          <FieldHint error={overRemaining}>
            {overRemaining
              ? `That is ${plannedTotal - item.remaining} more than the ${item.remaining} units left.`
              : `Maximum: ${item.remaining} units. This is the sum of the lines on the right.`}
          </FieldHint>

          <div className="mt-4">
            <Progress
              value={item.allocated + plannedTotal}
              max={item.quantity}
              warnWhenFull={false}
            />

            <p className="mt-2 text-xs text-muted">
              {item.allocated + plannedTotal} of {item.quantity} units would
              be allocated.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-surface p-5 shadow-card">
          <Label htmlFor="note">Note (optional)</Label>

          <Input
            id="note"
            type="text"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder="e.g. Delivery 4412"
          />

          <FieldHint>
            Saved with every line, in the activity log.
          </FieldHint>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface shadow-card">
        <div className="border-b border-border px-5 py-4">
          <h2 className="font-semibold text-primary">
            Select storage space(s)
          </h2>

          <p className="mt-1 text-sm text-muted">
            You can allocate to multiple locations if needed. Only compatible
            storage spaces in active warehouses are listed.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-subtle text-left">
                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-secondary uppercase">
                  Warehouse
                </th>

                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-secondary uppercase">
                  Storage space
                </th>

                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-secondary uppercase">
                  Available
                </th>

                <th className="px-4 py-2.5 text-xs font-semibold tracking-wide text-secondary uppercase">
                  Quantity
                </th>

                <th className="w-12 px-4 py-2.5" />
              </tr>
            </thead>

            <tbody>
              {lines.map((line, index) => {
                const spaces = usableSpaces.filter(
                  (space) => space.warehouseId === line.warehouseId,
                );

                const selected = spaceById.get(line.storageSpaceId);
                const lineError = lineErrors[index];

                return (
                  <tr
                    key={line.key}
                    className="border-b border-border align-top last:border-0"
                  >
                    <td className="px-4 py-3">
                      <Select
                        aria-label="Warehouse"
                        value={line.warehouseId}
                        onChange={(event) =>
                          updateLine(line.key, {
                            warehouseId: event.target.value,
                            storageSpaceId: "",
                            quantity: "",
                          })
                        }
                      >
                        <option value="">Select</option>

                        {warehouses.map((warehouse) => (
                          <option key={warehouse.id} value={warehouse.id}>
                            {warehouse.name}
                          </option>
                        ))}
                      </Select>
                    </td>

                    <td className="px-4 py-3">
                      <Select
                        aria-label="Storage space"
                        value={line.storageSpaceId}
                        disabled={!line.warehouseId}
                        onChange={(event) =>
                          updateLine(line.key, {
                            storageSpaceId: event.target.value,
                            quantity: "",
                          })
                        }
                      >
                        <option value="">
                          {line.warehouseId
                            ? "Select"
                            : "Pick a warehouse first"}
                        </option>

                        {spaces.map((space) => (
                          <option
                            key={space.id}
                            value={space.id}
                            disabled={space.available === 0}
                          >
                            {space.name} —{" "}
                            {STORAGE_TYPE_LABELS[space.storageType]}
                            {space.available === 0 ? " — Full" : ""}
                          </option>
                        ))}
                      </Select>
                    </td>

                    <td className="px-4 py-3">
                      {selected ? (
                        <div className="w-28">
                          <p className="font-medium text-primary">
                            {selected.available}
                          </p>

                          <Progress
                            value={selected.used}
                            max={selected.capacity}
                            size="sm"
                            className="mt-1.5"
                          />

                          <p className="mt-1 text-xs text-muted">
                            {selected.used} / {selected.capacity} used
                          </p>
                        </div>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <Input
                        type="number"
                        aria-label="Quantity"
                        min="1"
                        max={
                          selected
                            ? Math.min(
                                selected.available,
                                item.remaining,
                              )
                            : undefined
                        }
                        value={line.quantity}
                        disabled={!line.storageSpaceId}
                        onChange={(event) =>
                          updateLine(line.key, {
                            quantity: event.target.value,
                          })
                        }
                        className="w-28"
                      />

                      {lineError && line.storageSpaceId && (
                        <FieldHint error>{lineError}</FieldHint>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      <button
                        type="button"
                        aria-label="Remove this line"
                        disabled={lines.length === 1}
                        onClick={() => removeLine(line.key)}
                        className="cursor-pointer rounded-lg p-2 text-muted transition-colors hover:bg-danger-muted hover:text-danger disabled:pointer-events-none disabled:opacity-40"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="border-t border-border px-5 py-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Plus className="h-4 w-4" />}
            onClick={() =>
              setLines((current) => [...current, emptyLine()])
            }
          >
            Add another location
          </Button>
        </div>

        {(duplicateSpace || overRemaining) && (
          <div className="border-t border-border bg-warning-muted px-5 py-3">
            <p className="flex items-center gap-2 text-sm text-warning">
              <TriangleAlert className="h-4 w-4 shrink-0" />

              {duplicateSpace
                ? "Two lines point at the same storage space. Combine them into one line."
                : `The lines add up to ${plannedTotal} units, but only ${item.remaining} are left to allocate.`}
            </p>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="border-t border-border bg-danger-muted px-5 py-3"
          >
            <p className="text-sm text-danger">
              {error} Nothing was allocated; fix the lines and try again.
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface-subtle px-5 py-4">
          <p className="text-sm text-muted">
            Allocating{" "}
            <span className="font-semibold text-primary">
              {plannedTotal}
            </span>{" "}
            of {item.remaining} remaining units
            {lines.length > 1
              ? ` across ${lines.length} locations`
              : ""}
            .
          </p>

          <div className="flex gap-2">
            <Button
              href={`/items/${item.id}`}
              variant="secondary"
              type="button"
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmit}
            >
              {pending ? "Allocating..." : "Allocate"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}