import { asc } from "drizzle-orm";

import { db } from "@/db";
import { user } from "@/db/schema";

import { getAllocationsByItemId } from "@/features/allocations/queries";
import {
  getItems,
  getOutOfStockItems as getOutOfStockItemRows,
  getSplitItems as getSplitItemRows,
  type ItemRow,
} from "@/features/items/queries";
import { getStorageSpacesWithUsage } from "@/features/storage-spaces/queries";
import { getWarehouses as getWarehouseRows } from "@/features/warehouses/queries";
import { toRole } from "@/lib/auth/permissions";
import { STORAGE_TYPE_LABELS } from "@/lib/storage";

const MAX_ROWS = 50;

function getSearchVariants(value: string) {
  const search = value.trim().toLowerCase();

  if (!search) {
    return [];
  }

  const variants = new Set<string>([search]);

  if (search.endsWith("ies") && search.length > 3) {
    variants.add(`${search.slice(0, -3)}y`);
  }

  if (search.endsWith("es") && search.length > 2) {
    variants.add(search.slice(0, -2));
  }

  if (search.endsWith("s") && !search.endsWith("ss") && search.length > 1) {
    variants.add(search.slice(0, -1));
  }

  return [...variants];
}

function itemSummary(item: ItemRow) {
  return {
    name: item.name,
    sku: item.sku,
    description: item.description,
    totalQuantity: item.quantity,
    allocatedQuantity: item.allocated,
    remainingQuantity: item.remaining,
    requiredStorageType: STORAGE_TYPE_LABELS[item.requiredStorageType],
    storageLocationCount: item.locationCount,
    warehouseCount: item.warehouseCount,
  };
}

function limited<T>(rows: T[]) {
  return {
    count: rows.length,
    truncated: rows.length > MAX_ROWS,
    rows: rows.slice(0, MAX_ROWS),
  };
}

export async function searchItems(search: string) {
  const items = await getItems({ search });

  return limited(items.map(itemSummary));
}

export async function getUnallocatedItems() {
  const items = await getItems({ stock: "unallocated" });

  return limited(items.map(itemSummary));
}

/** Out of stock / fully stored: remaining quantity is 0. */
export async function getOutOfStockItems() {
  const items = await getOutOfStockItemRows();

  return {
    definition:
      "Out of stock (fully stored) means remaining quantity is 0: every unit the business owns is already in a storage space.",
    ...limited(items.map(itemSummary)),
  };
}

export async function getItemAllocations(itemSearch: string) {
  const search = itemSearch.trim();
  const variants = getSearchVariants(search);

  if (variants.length === 0) {
    return {
      found: false,
      message: "No item search term was provided.",
    };
  }

  const searchResults = await Promise.all(
    variants.map((variant) => getItems({ search: variant })),
  );

  const matches = [
    ...new Map(
      searchResults.flat().map((item) => [item.id, item]),
    ).values(),
  ];

  if (matches.length === 0) {
    return {
      found: false,
      message: `No item matching "${search}" was found.`,
    };
  }

  const loweredVariants = variants.map((variant) =>
    variant.toLowerCase(),
  );

  const exact = matches.filter(
    (item) =>
      loweredVariants.includes(item.name.toLowerCase()) ||
      loweredVariants.includes(item.sku.toLowerCase()),
  );

  const chosen =
    exact.length === 1 ? exact[0] : matches.length === 1 ? matches[0] : null;

  if (!chosen) {
    return {
      found: true,
      ambiguous: true,
      message: `"${search}" matches ${matches.length} items. Ask the user which one they mean before answering.`,
      candidates: matches
        .slice(0, 10)
        .map((item) => ({ name: item.name, sku: item.sku })),
    };
  }

  const allocations = await getAllocationsByItemId(chosen.id);

  return {
    found: true,
    ambiguous: false,
    item: itemSummary(chosen),
    locations: allocations.map((allocation) => ({
      warehouseName: allocation.warehouseName,
      warehouseStatus: allocation.warehouseStatus,
      storageSpaceName: allocation.storageSpaceName,
      storageType: STORAGE_TYPE_LABELS[allocation.storageType],
      quantityHere: allocation.quantity,
      storageSpaceCapacity: allocation.storageSpaceCapacity,
      storageSpaceUsed: allocation.storageSpaceUsed,
      storageSpaceAvailable: allocation.storageSpaceAvailable,
    })),
  };
}

/** Items in two or more different storage spaces, one row per location. */
export async function getSplitItems() {
  const rows = await getSplitItemRows();

  return limited(
    rows.map((row) => ({
      itemName: row.itemName,
      itemSku: row.itemSku,
      warehouseName: row.warehouseName,
      warehouseStatus: row.warehouseStatus,
      storageSpaceName: row.storageSpaceName,
      quantity: row.quantity,
    })),
  );
}

export async function getWarehouses() {
  const warehouses = await getWarehouseRows();

  return limited(
    warehouses.map((warehouse) => ({
      name: warehouse.name,
      location: warehouse.location,
      status: warehouse.status,
      acceptsNewStock: warehouse.status === "ACTIVE",
      totalCapacity: warehouse.capacity,
      capacityInStorageSpaces: warehouse.allocatedCapacity,
      unassignedCapacity: warehouse.unassignedCapacity,
      usedCapacity: warehouse.used,
      availableCapacity: warehouse.available,
      usedPercent: warehouse.usedPercent,
      storageSpaceCount: warehouse.spaceCount,
    })),
  );
}

export async function getStorageSpaceAvailability(warehouseName?: string) {
  const spaces = await getStorageSpacesWithUsage();
  const filter = warehouseName?.trim().toLowerCase();

  const selected = filter
    ? spaces.filter((space) =>
        space.warehouseName.toLowerCase().includes(filter),
      )
    : spaces;

  if (filter && selected.length === 0) {
    return {
      found: false,
      message: `No warehouse matching "${warehouseName}" has storage spaces.`,
    };
  }

  return {
    found: true,
    note: "Spaces in an INACTIVE warehouse cannot accept new stock, whatever their free room.",
    ...limited(
      selected.map((space) => ({
        warehouseName: space.warehouseName,
        warehouseStatus: space.warehouseStatus,
        storageSpaceName: space.name,
        storageType: STORAGE_TYPE_LABELS[space.storageType],
        capacity: space.capacity,
        used: space.used,
        available: space.available,
        usedPercent: space.usedPercent,
        acceptsNewStock:
          space.warehouseStatus === "ACTIVE" && space.available > 0,
      })),
    ),
  };
}

/** Admins only: the service checks the role before this runs. */
export async function getUserSummary() {
  const rows = await db
    .select({
      name: user.name,
      email: user.email,
      role: user.role,
      mustChangePassword: user.mustChangePassword,
      banned: user.banned,
    })
    .from(user)
    .orderBy(asc(user.name));

  const people = rows.map((row) => ({
    name: row.name,
    email: row.email,
    role: toRole(row.role) === "admin" ? "Administrator" : "Staff",
    temporaryPasswordPending: row.mustChangePassword === true,
    banned: row.banned === true,
  }));

  return {
    totalAccounts: people.length,
    administrators: people.filter((p) => p.role === "Administrator").length,
    staff: people.filter((p) => p.role === "Staff").length,
    ...limited(people),
  };
}