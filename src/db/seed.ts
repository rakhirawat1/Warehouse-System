/**
 * pnpm db:seed: replaces inventory with demo master data. Allocations and
 * movements are left out so they can be done live. Accounts are never touched.
 */

import "dotenv/config";

import { asc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  allocations,
  items,
  stockMovements,
  storageSpaces,
  user,
  warehouses,
} from "@/db/schema";

import { createItem } from "@/features/items/service";
import { createStorageSpace } from "@/features/storage-spaces/service";
import { createWarehouse } from "@/features/warehouses/service";
import type { StorageType } from "@/lib/storage";

async function findActor() {
  const [admin] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(eq(user.role, "admin"))
    .orderBy(asc(user.createdAt))
    .limit(1);

  if (!admin) {
    throw new Error(
      "No administrator found. Create the first administrator with the Better Auth CLI, then run the seed again.",
    );
  }

  return admin;
}

async function reset() {
  await db.delete(allocations);
  await db.delete(stockMovements);
  await db.delete(items);
  await db.delete(storageSpaces);
  await db.delete(warehouses);
}

const WAREHOUSES = [
  {
    key: "mumbai",
    name: "Mumbai Warehouse",
    location: "Mumbai, Maharashtra",
    capacity: 1000,
  },
  {
    key: "delhi",
    name: "Delhi Warehouse",
    location: "Delhi",
    capacity: 800,
  },
  {
    key: "ahmedabad",
    name: "Ahmedabad Depot",
    location: "Ahmedabad, Gujarat",
    capacity: 600,
  },
] as const;

type WarehouseKey = (typeof WAREHOUSES)[number]["key"];

const SPACES: {
  key: string;
  warehouse: WarehouseKey;
  name: string;
  storageType: StorageType;
  capacity: number;
  description: string;
}[] = [
  {
    key: "mumbaiRackA",
    warehouse: "mumbai",
    name: "Rack A",
    storageType: "NORMAL",
    capacity: 300,
    description: "General storage rack.",
  },
  {
    key: "mumbaiRackB",
    warehouse: "mumbai",
    name: "Rack B",
    storageType: "NORMAL",
    capacity: 250,
    description: "General storage rack.",
  },
  {
    key: "mumbaiCold",
    warehouse: "mumbai",
    name: "Cold Room",
    storageType: "COLD_STORAGE",
    capacity: 100,
    description: "Temperature-controlled storage.",
  },
  {
    key: "mumbaiSecure",
    warehouse: "mumbai",
    name: "Secure Room",
    storageType: "SECURE",
    capacity: 100,
    description: "Secure storage for high-value items.",
  },
  {
    key: "delhiRackA",
    warehouse: "delhi",
    name: "Rack A",
    storageType: "NORMAL",
    capacity: 250,
    description: "General storage rack.",
  },
  {
    key: "delhiRackB",
    warehouse: "delhi",
    name: "Rack B",
    storageType: "NORMAL",
    capacity: 200,
    description: "General storage rack.",
  },
  {
    key: "delhiHazard",
    warehouse: "delhi",
    name: "Hazard Room",
    storageType: "HAZARDOUS",
    capacity: 100,
    description: "Storage for hazardous materials.",
  },
  {
    key: "delhiCold",
    warehouse: "delhi",
    name: "Cold Room",
    storageType: "COLD_STORAGE",
    capacity: 100,
    description: "Temperature-controlled storage.",
  },
  {
    key: "ahmedabadRack",
    warehouse: "ahmedabad",
    name: "Old Rack",
    storageType: "NORMAL",
    capacity: 200,
    description: "Storage rack in the depot.",
  },
];

const ITEMS: {
  key: string;
  name: string;
  sku: string;
  description: string;
  storageType: StorageType;
  quantity: number;
}[] = [
  {
    key: "boxes",
    name: "Cardboard Boxes",
    sku: "BOX-001",
    description: "General packaging boxes.",
    storageType: "NORMAL",
    quantity: 500,
  },
  {
    key: "tape",
    name: "Packing Tape",
    sku: "TAP-002",
    description: "Packaging tape rolls.",
    storageType: "NORMAL",
    quantity: 200,
  },
  {
    key: "chairs",
    name: "Office Chairs",
    sku: "CHR-003",
    description: "Office chairs for workplace use.",
    storageType: "NORMAL",
    quantity: 100,
  },
  {
    key: "paper",
    name: "Printer Paper",
    sku: "PPR-004",
    description: "A4 printer paper.",
    storageType: "NORMAL",
    quantity: 100,
  },
  {
    key: "frozen",
    name: "Frozen Food",
    sku: "FRZ-005",
    description: "Frozen food requiring cold storage.",
    storageType: "COLD_STORAGE",
    quantity: 100,
  },
  {
    key: "medicine",
    name: "Medicine Boxes",
    sku: "MED-006",
    description: "Temperature-sensitive medicine.",
    storageType: "COLD_STORAGE",
    quantity: 50,
  },
  {
    key: "laptops",
    name: "Laptops",
    sku: "LAP-007",
    description: "High-value electronic devices.",
    storageType: "SECURE",
    quantity: 50,
  },
  {
    key: "phones",
    name: "Mobile Phones",
    sku: "MOB-008",
    description: "High-value electronic devices.",
    storageType: "SECURE",
    quantity: 50,
  },
  {
    key: "paint",
    name: "Paint Cans",
    sku: "PNT-009",
    description: "Flammable paint containers.",
    storageType: "HAZARDOUS",
    quantity: 80,
  },
  {
    key: "chemicals",
    name: "Cleaning Chemicals",
    sku: "CHM-010",
    description: "Cleaning chemicals requiring special storage.",
    storageType: "HAZARDOUS",
    quantity: 50,
  },
];

async function main() {
  const actor = await findActor();

  console.log(`Preparing demo data for ${actor.name} <${actor.email}>`);
  console.log("Clearing inventory data...");
  await reset();

  console.log("Creating warehouses...");

  const warehouseIds = {} as Record<WarehouseKey, string>;

  for (const warehouse of WAREHOUSES) {
    const created = await createWarehouse({
      name: warehouse.name,
      location: warehouse.location,
      capacity: warehouse.capacity,
      status: "ACTIVE",
    });

    warehouseIds[warehouse.key] = created.id;
  }

  console.log("Creating storage spaces...");

  for (const space of SPACES) {
    await createStorageSpace({
      warehouseId: warehouseIds[space.warehouse],
      name: space.name,
      description: space.description,
      storageType: space.storageType,
      capacity: space.capacity,
    });
  }

  console.log("Creating items...");

  for (const item of ITEMS) {
    await createItem({
      name: item.name,
      sku: item.sku,
      description: item.description,
      quantity: item.quantity,
      requiredStorageType: item.storageType,
    });
  }

  console.log(`
Demo master data loaded successfully.

Warehouses:
  Mumbai Warehouse     - Active
  Delhi Warehouse      - Active
  Ahmedabad Depot      - Active

Storage spaces:
  ${SPACES.length} storage spaces

Items:
  ${ITEMS.length} items

Items available for live demo:
  Cardboard Boxes      - 500
  Packing Tape         - 200
  Office Chairs        - 100
  Printer Paper        - 100
  Frozen Food          - 100
  Medicine Boxes       - 50
  Laptops              - 50
  Mobile Phones        - 50
  Paint Cans           - 80
  Cleaning Chemicals   - 50

No allocations were created.
No stock movements were created.
No dispatches were created.
No stock adjustments were created.


Accounts were not created or changed.
`);

  process.exit(0);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});