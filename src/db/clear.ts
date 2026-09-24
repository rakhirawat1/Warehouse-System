import "dotenv/config";

import { db } from "@/db";
import {
  allocations,
  items,
  stockMovements,
  storageSpaces,
  warehouses,
} from "@/db/schema";

async function main() {
  console.log("Clearing warehouse demo data...");

  // Delete child records first because of foreign-key constraints.
  await db.delete(allocations);
  await db.delete(stockMovements);
  await db.delete(items);
  await db.delete(storageSpaces);
  await db.delete(warehouses);

  console.log("");
  console.log("Warehouse data cleared successfully.");
  console.log("");
  console.log("Kept untouched:");
  console.log("  ✓ Admin accounts");
  console.log("  ✓ Staff accounts");
  console.log("  ✓ Passwords");
  console.log("  ✓ Roles");
  console.log("  ✓ Authentication data");

  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to clear warehouse data:");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});