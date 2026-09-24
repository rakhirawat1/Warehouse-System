"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { X } from "lucide-react";

import Button from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/input";

export type MovementFilterOptions = {
  warehouses: { id: string; name: string }[];
  items: { id: string; name: string; sku: string }[];
  actors: string[];
};

const FILTER_KEYS = ["warehouse", "item", "actor", "from", "to"] as const;

/** Activity log filters. They live in the URL so a filtered view can be reloaded or shared. */
export default function MovementFilters({
  options,
}: {
  options: MovementFilterOptions;
}) {
  const router = useRouter();
  const params = useSearchParams();

  function update(key: string, value: string) {
    const next = new URLSearchParams(params.toString());

    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }

    router.replace(`/activity?${next.toString()}`, { scroll: false });
  }

  function clearAll() {
    const next = new URLSearchParams(params.toString());

    for (const key of FILTER_KEYS) {
      next.delete(key);
    }

    router.replace(`/activity?${next.toString()}`, { scroll: false });
  }

  const active = FILTER_KEYS.filter((key) => params.get(key)).length;

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <div>
        <Label htmlFor="filter-warehouse">Warehouse</Label>

        <Select
          id="filter-warehouse"
          value={params.get("warehouse") ?? ""}
          onChange={(event) => update("warehouse", event.target.value)}
          className="h-9"
        >
          <option value="">All warehouses</option>

          {options.warehouses.map((warehouse) => (
            <option key={warehouse.id} value={warehouse.id}>
              {warehouse.name}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="filter-item">Item</Label>

        <Select
          id="filter-item"
          value={params.get("item") ?? ""}
          onChange={(event) => update("item", event.target.value)}
          className="h-9"
        >
          <option value="">All items</option>

          {options.items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.name} ({item.sku})
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="filter-actor">Done by</Label>

        <Select
          id="filter-actor"
          value={params.get("actor") ?? ""}
          onChange={(event) => update("actor", event.target.value)}
          className="h-9"
        >
          <option value="">Anyone</option>

          {options.actors.map((actor) => (
            <option key={actor} value={actor}>
              {actor}
            </option>
          ))}
        </Select>
      </div>

      <div>
        <Label htmlFor="filter-from">From</Label>

        <Input
          id="filter-from"
          type="date"
          value={params.get("from") ?? ""}
          max={params.get("to") ?? undefined}
          onChange={(event) => update("from", event.target.value)}
          className="h-9"
        />
      </div>

      <div>
        <Label htmlFor="filter-to">To</Label>

        <div className="flex gap-2">
          <Input
            id="filter-to"
            type="date"
            value={params.get("to") ?? ""}
            min={params.get("from") ?? undefined}
            onChange={(event) => update("to", event.target.value)}
            className="h-9"
          />

          {active > 0 && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              aria-label="Clear filters"
              icon={<X className="h-4 w-4" />}
              onClick={clearAll}
            />
          )}
        </div>
      </div>
    </div>
  );
}
