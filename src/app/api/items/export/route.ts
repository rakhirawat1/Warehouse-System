import { z } from "zod";

import { getItems, type ItemRow } from "@/features/items/queries";
import { getActor } from "@/lib/auth/guards";
import { STORAGE_TYPE_LABELS } from "@/lib/storage";

/** CSV export of items, using the same filters the Items page has on screen. */

const paramsSchema = z.object({
  search: z.string().trim().max(100).optional().catch(undefined),
  filter: z.enum(["unallocated"]).optional().catch(undefined),
  status: z.enum(["none", "partial", "full"]).optional().catch(undefined),
  q: z.string().trim().max(100).optional().catch(undefined),
});

function statusOf(item: ItemRow) {
  if (item.allocated === 0) return "none";
  return item.remaining > 0 ? "partial" : "full";
}

const STATUS_LABELS = {
  none: "Not Allocated",
  partial: "Partially Allocated",
  full: "Fully Allocated",
} as const;

/**
 * Quotes a CSV cell. Values starting with = + - @ are prefixed with an
 * apostrophe so a spreadsheet cannot run them as formulas (CSV injection).
 */
function cell(value: string | number | null) {
  let text = value === null ? "" : String(value);

  if (/^[=+\-@\t\r]/.test(text)) {
    text = `'${text}`;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

export async function GET(request: Request) {
  const actor = await getActor();

  if (!actor) {
    return new Response("Please sign in to export inventory.", { status: 401 });
  }

  if (actor.mustChangePassword) {
    return new Response("Change your temporary password first.", {
      status: 403,
    });
  }

  const url = new URL(request.url);
  const params = paramsSchema.parse(Object.fromEntries(url.searchParams));

  let rows = await getItems({
    search: params.search || undefined,
    stock: params.filter,
  });

  if (params.status) {
    rows = rows.filter((item) => statusOf(item) === params.status);
  }

  if (params.q) {
    const query = params.q.toLowerCase();

    rows = rows.filter((item) =>
      `${item.name} ${item.sku} ${item.description ?? ""}`
        .toLowerCase()
        .includes(query),
    );
  }

  rows.sort((a, b) => a.name.localeCompare(b.name));

  const header = [
    "Item name",
    "SKU",
    "Description",
    "Total quantity",
    "Allocated quantity",
    "Remaining quantity",
    "Status",
    "Storage type",
    "Storage locations",
    "Warehouses",
  ];

  const lines = [
    header.map(cell).join(","),
    ...rows.map((item) =>
      [
        item.name,
        item.sku,
        item.description,
        item.quantity,
        item.allocated,
        item.remaining,
        STATUS_LABELS[statusOf(item)],
        STORAGE_TYPE_LABELS[item.requiredStorageType],
        item.locationCount,
        item.warehouseCount,
      ]
        .map(cell)
        .join(","),
    ),
  ];

  // The byte-order mark makes Excel read the file as UTF-8.
  const body = `\uFEFF${lines.join("\r\n")}\r\n`;
  const date = new Date().toISOString().slice(0, 10);

  return new Response(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="inventory-${date}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}
