import { randomUUID } from "node:crypto";

import { and, asc, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/db";
import {
  allocations,
  items,
  stockMovements,
  storageSpaces,
  warehouses,
} from "@/db/schema";

import { DomainError, notFound } from "@/lib/errors";
import { canStore, storageMismatchMessage } from "@/lib/storage";

import type {
  AdjustAllocationInput,
  AllocateStockInput,
  DispatchStockInput,
  TransferStockInput,
} from "./types";

type Actor = { id: string | null; name: string };

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type LockedSpace = {
  id: string;
  name: string;
  storageType: (typeof storageSpaces.$inferSelect)["storageType"];
  capacity: number;
  warehouseId: string;
  warehouseName: string;
  warehouseStatus: "ACTIVE" | "INACTIVE";
  /** Units already stored here, read after the row was locked. */
  used: number;
};

/**
 * Locks spaces in id order (avoids deadlocks) and reads usage after the lock,
 * so two requests cannot both take the last free unit.
 */
async function lockSpaces(tx: Transaction, spaceIds: string[]) {
  const ids = [...new Set(spaceIds)].sort();

  const locked = await tx
    .select({
      id: storageSpaces.id,
      name: storageSpaces.name,
      storageType: storageSpaces.storageType,
      capacity: storageSpaces.capacity,
      warehouseId: storageSpaces.warehouseId,
    })
    .from(storageSpaces)
    .where(inArray(storageSpaces.id, ids))
    .orderBy(asc(storageSpaces.id))
    .for("update");

  if (locked.length !== ids.length) {
    throw notFound("A storage space");
  }

  const warehouseRows = await tx
    .select({
      id: warehouses.id,
      name: warehouses.name,
      status: warehouses.status,
    })
    .from(warehouses)
    .where(inArray(warehouses.id, [...new Set(locked.map((s) => s.warehouseId))]));

  const usage = await tx
    .select({
      storageSpaceId: allocations.storageSpaceId,
      used: sql<number>`COALESCE(SUM(${allocations.quantity}), 0)`,
    })
    .from(allocations)
    .where(inArray(allocations.storageSpaceId, ids))
    .groupBy(allocations.storageSpaceId);

  const map = new Map<string, LockedSpace>();

  for (const space of locked) {
    const warehouse = warehouseRows.find((w) => w.id === space.warehouseId);

    if (!warehouse) {
      throw notFound("The warehouse");
    }

    map.set(space.id, {
      ...space,
      warehouseName: warehouse.name,
      warehouseStatus: warehouse.status,
      used: Number(
        usage.find((u) => u.storageSpaceId === space.id)?.used ?? 0,
      ),
    });
  }

  return map;
}

/** Locks the item row. Lock order is always item, then storage spaces. */
async function loadItem(tx: Transaction, itemId: string) {
  const [item] = await tx
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1)
    .for("update");

  if (!item) {
    throw notFound("The item");
  }

  return item;
}

async function loadAllocation(tx: Transaction, allocationId: string) {
  const [allocation] = await tx
    .select()
    .from(allocations)
    .where(eq(allocations.id, allocationId))
    .limit(1);

  if (!allocation) {
    throw notFound("The allocation");
  }

  return allocation;
}

/** Units of this item already allocated, optionally ignoring one allocation. */
async function getAllocated(
  tx: Transaction,
  itemId: string,
  exceptAllocationId?: string,
) {
  const [row] = await tx
    .select({
      total: sql<number>`COALESCE(SUM(${allocations.quantity}), 0)`,
    })
    .from(allocations)
    .where(
      exceptAllocationId
        ? and(
            eq(allocations.itemId, itemId),
            ne(allocations.id, exceptAllocationId),
          )
        : eq(allocations.itemId, itemId),
    );

  return Number(row?.total ?? 0);
}

function assertWithinRemaining(
  item: typeof items.$inferSelect,
  allocated: number,
  quantity: number,
) {
  const remaining = item.quantity - allocated;

  if (quantity > remaining) {
    throw new DomainError(
      remaining <= 0
        ? `All ${item.quantity} units of "${item.name}" are already allocated. ` +
            `Increase the item total, or correct or dispatch another allocation first.`
        : `"${item.name}" has ${remaining} units left to allocate ` +
            `(${allocated} of ${item.quantity} already allocated), but you asked for ${quantity}.`,
      "CAPACITY",
    );
  }
}

const spaceLabel = (space: LockedSpace) =>
  `${space.warehouseName} / ${space.name}`;

/**
 * Rules for adding units. Removals are never blocked, so a full space or an
 * inactive warehouse can always be emptied.
 */
function assertCanAdd(
  item: typeof items.$inferSelect,
  space: LockedSpace,
  quantity: number,
) {
  if (space.warehouseStatus !== "ACTIVE") {
    throw new DomainError(
      `"${space.warehouseName}" is inactive, so no new stock can be stored there. ` +
        `You can still move or dispatch the stock that is already inside it.`,
      "CONFLICT",
    );
  }

  if (!canStore(item.requiredStorageType, space.storageType)) {
    throw new DomainError(
      storageMismatchMessage(
        item.name,
        item.requiredStorageType,
        space.name,
        space.storageType,
      ),
      "INVALID",
    );
  }

  const available = space.capacity - space.used;

  if (quantity > available) {
    throw new DomainError(
      available <= 0
        ? `"${space.name}" is full (${space.capacity} of ${space.capacity} units used). ` +
            `Choose another storage space or move stock out first.`
        : `"${space.name}" has room for ${available} more units, but you tried to store ${quantity}. ` +
            `Lower the quantity, or split it across more storage spaces.`,
      "CAPACITY",
    );
  }
}

/** Adds units to a space, merging with an existing allocation if there is one. */
async function addToSpace(
  tx: Transaction,
  itemId: string,
  storageSpaceId: string,
  quantity: number,
) {
  const [row] = await tx
    .insert(allocations)
    .values({ itemId, storageSpaceId, quantity })
    .onConflictDoUpdate({
      target: [allocations.itemId, allocations.storageSpaceId],
      set: {
        quantity: sql`${allocations.quantity} + ${quantity}`,
        updatedAt: new Date(),
      },
    })
    .returning();

  return row;
}

/** Removes units from a space, deleting the row when it reaches zero. */
async function removeFromSpace(
  tx: Transaction,
  allocationId: string,
  currentQuantity: number,
  quantity: number,
) {
  if (quantity === currentQuantity) {
    await tx.delete(allocations).where(eq(allocations.id, allocationId));
    return;
  }

  await tx
    .update(allocations)
    .set({
      quantity: currentQuantity - quantity,
      updatedAt: new Date(),
    })
    .where(eq(allocations.id, allocationId));
}

type MovementInput = {
  type: "RECEIPT" | "TRANSFER" | "ADJUSTMENT" | "DISPATCH";
  item: typeof items.$inferSelect;
  quantity: number;
  from?: LockedSpace | null;
  to?: LockedSpace | null;
  note?: string | null;
  actor: Actor;
  batchId: string;
};

async function writeMovement(tx: Transaction, input: MovementInput) {
  await tx.insert(stockMovements).values({
    batchId: input.batchId,
    type: input.type,
    itemId: input.item.id,
    itemName: input.item.name,
    fromSpaceId: input.from?.id ?? null,
    fromLabel: input.from ? spaceLabel(input.from) : null,
    fromWarehouseId: input.from?.warehouseId ?? null,
    toSpaceId: input.to?.id ?? null,
    toLabel: input.to ? spaceLabel(input.to) : null,
    toWarehouseId: input.to?.warehouseId ?? null,
    quantity: input.quantity,
    note: input.note ?? null,
    actorId: input.actor.id,
    actorName: input.actor.name,
  });
}

/**
 * Allocates to one or more spaces, all or nothing: every line is checked
 * against the locked rows before anything is written.
 */
export async function allocateStock(input: AllocateStockInput, actor: Actor) {
  return db.transaction(async (tx) => {
    const item = await loadItem(tx, input.itemId);
    const allocated = await getAllocated(tx, item.id);

    const requested = input.lines.reduce((sum, line) => sum + line.quantity, 0);

    // The lines together may not exceed what the item has left.
    assertWithinRemaining(item, allocated, requested);

    const spaces = await lockSpaces(
      tx,
      input.lines.map((line) => line.storageSpaceId),
    );

    // Every line must fit its space, in an active warehouse, with a matching type.
    for (const line of input.lines) {
      assertCanAdd(item, spaces.get(line.storageSpaceId)!, line.quantity);
    }

    // One batch id ties the movement records of this submission together.
    const batchId = randomUUID();
    const placed = [];

    for (const line of input.lines) {
      const space = spaces.get(line.storageSpaceId)!;

      await addToSpace(tx, item.id, space.id, line.quantity);

      await writeMovement(tx, {
        type: "RECEIPT",
        item,
        quantity: line.quantity,
        to: space,
        note: input.note,
        actor,
        batchId,
      });

      placed.push({
        storageSpaceName: space.name,
        warehouseName: space.warehouseName,
        quantity: line.quantity,
      });
    }

    return {
      itemId: item.id,
      itemName: item.name,
      quantity: requested,
      lines: placed,
      allocatedAfter: allocated + requested,
      remainingAfter: item.quantity - allocated - requested,
    };
  });
}

/**
 * Moves units from one storage space to another.
 * Moving part of an allocation splits it; moving all of it empties the source.
 */
export async function transferStock(input: TransferStockInput, actor: Actor) {
  return db.transaction(async (tx) => {
    const allocation = await loadAllocation(tx, input.allocationId);

    if (allocation.storageSpaceId === input.destinationStorageSpaceId) {
      throw new DomainError(
        "The destination must be a different storage space than the current one.",
        "INVALID",
      );
    }

    const item = await loadItem(tx, allocation.itemId);

    const spaces = await lockSpaces(tx, [
      allocation.storageSpaceId,
      input.destinationStorageSpaceId,
    ]);

    const source = spaces.get(allocation.storageSpaceId)!;
    const destination = spaces.get(input.destinationStorageSpaceId)!;

    // Re-read under the lock: the quantity may have changed since the page loaded.
    const [current] = await tx
      .select({ quantity: allocations.quantity })
      .from(allocations)
      .where(eq(allocations.id, allocation.id))
      .limit(1);

    const available = current?.quantity ?? 0;

    if (input.quantity > available) {
      throw new DomainError(
        available === 0
          ? `There is no stock of "${item.name}" left in "${source.name}".`
          : `"${source.name}" holds ${available} units of "${item.name}", but you tried to move ${input.quantity}.`,
        "CAPACITY",
      );
    }

    assertCanAdd(item, destination, input.quantity);

    await removeFromSpace(tx, allocation.id, available, input.quantity);
    await addToSpace(tx, item.id, destination.id, input.quantity);

    await writeMovement(tx, {
      type: "TRANSFER",
      item,
      quantity: input.quantity,
      from: source,
      to: destination,
      note: input.note,
      actor,
      batchId: randomUUID(),
    });

    return {
      itemId: item.id,
      itemName: item.name,
      quantity: input.quantity,
      fromName: source.name,
      toName: destination.name,
      movedEverything: input.quantity === available,
    };
  });
}

/**
 * Corrects the stored quantity of one allocation, for example after a recount.
 * An increase is checked against capacity like a receipt; a decrease is always
 * allowed so a space or an inactive warehouse can be emptied.
 */
export async function adjustAllocation(
  input: AdjustAllocationInput,
  actor: Actor,
) {
  return db.transaction(async (tx) => {
    const allocation = await loadAllocation(tx, input.allocationId);
    const item = await loadItem(tx, allocation.itemId);
    const spaces = await lockSpaces(tx, [allocation.storageSpaceId]);
    const space = spaces.get(allocation.storageSpaceId)!;

    const [current] = await tx
      .select({ quantity: allocations.quantity })
      .from(allocations)
      .where(eq(allocations.id, allocation.id))
      .limit(1);

    const before = current?.quantity ?? 0;
    const difference = input.quantity - before;

    if (difference === 0) {
      return {
        itemId: item.id,
        itemName: item.name,
        before,
        after: before,
        unchanged: true,
      };
    }

    if (difference > 0) {
      const allocatedElsewhere = await getAllocated(tx, item.id, allocation.id);

      // The extra units must exist on the item...
      assertWithinRemaining(item, allocatedElsewhere, input.quantity);

      // ...and fit in the space, ignoring what this allocation already holds.
      assertCanAdd(
        item,
        { ...space, used: space.used - before },
        input.quantity,
      );
    }

    await tx
      .update(allocations)
      .set({ quantity: input.quantity, updatedAt: new Date() })
      .where(eq(allocations.id, allocation.id));

    await writeMovement(tx, {
      type: "ADJUSTMENT",
      item,
      quantity: Math.abs(difference),
      from: difference < 0 ? space : null,
      to: difference > 0 ? space : null,
      note:
        input.note ??
        `Quantity corrected from ${before} to ${input.quantity}.`,
      actor,
      batchId: randomUUID(),
    });

    return {
      itemId: item.id,
      itemName: item.name,
      before,
      after: input.quantity,
      unchanged: false,
    };
  });
}

/**
 * Dispatches units out of inventory (goods leaving the business).
 * Without a quantity the whole allocation is dispatched.
 */
export async function dispatchStock(input: DispatchStockInput, actor: Actor) {
  return db.transaction(async (tx) => {
    const allocation = await loadAllocation(tx, input.allocationId);
    const item = await loadItem(tx, allocation.itemId);
    const spaces = await lockSpaces(tx, [allocation.storageSpaceId]);
    const space = spaces.get(allocation.storageSpaceId)!;

    const [current] = await tx
      .select({ quantity: allocations.quantity })
      .from(allocations)
      .where(eq(allocations.id, allocation.id))
      .limit(1);

    const available = current?.quantity ?? 0;
    const quantity = input.quantity ?? available;

    if (quantity > available) {
      throw new DomainError(
        `"${space.name}" holds ${available} units of "${item.name}", but you tried to dispatch ${quantity}.`,
        "CAPACITY",
      );
    }

    await removeFromSpace(tx, allocation.id, available, quantity);

    // Goods leaving inventory reduce the item total as well, so the
    // unallocated remainder does not silently grow.
    await tx
      .update(items)
      .set({
        quantity: Math.max(0, item.quantity - quantity),
        updatedAt: new Date(),
      })
      .where(eq(items.id, item.id));

    await writeMovement(tx, {
      type: "DISPATCH",
      item,
      quantity,
      from: space,
      note: input.note,
      actor,
      batchId: randomUUID(),
    });

    return {
      itemId: item.id,
      itemName: item.name,
      quantity,
      storageSpaceName: space.name,
      emptied: quantity === available,
      totalAfter: Math.max(0, item.quantity - quantity),
    };
  });
}
