"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { adjustAllocationAction, dispatchStockAction } from "../actions";
import type { AllocationRow } from "../queries";

import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { FieldHint, Input, Label } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import { useAction } from "@/lib/use-action";

type DialogProps = {
  /** The allocation to act on; the dialog is open while this is set. */
  allocation: AllocationRow | null;
  onClose: () => void;
  /** Receives the success message, so the caller can show it. */
  onDone?: (message: string | null) => void;
};

/** Resets the quantity when another allocation opens, during render to avoid a stale frame. */
function useQuantityFor(allocation: AllocationRow | null) {
  const [quantity, setQuantity] = useState(
    allocation ? String(allocation.quantity) : "",
  );
  const [forId, setForId] = useState(allocation?.id ?? null);

  if ((allocation?.id ?? null) !== forId) {
    setForId(allocation?.id ?? null);
    setQuantity(allocation ? String(allocation.quantity) : "");
  }

  return [quantity, setQuantity] as const;
}

export function CorrectQuantityDialog({
  allocation,
  onClose,
  onDone,
}: DialogProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useQuantityFor(allocation);
  const entered = Number(quantity);

  const adjust = useAction(adjustAllocationAction, {
    onSuccess: (_, message) => {
      onDone?.(message);
      onClose();
      router.refresh();
    },
  });

  function close() {
    adjust.reset();
    onClose();
  }

  return (
    <Modal
      open={Boolean(allocation)}
      onClose={close}
      title="Correct quantity"
      description="Use this after a stock count. It records a correction in the history."
      size="sm"
      busy={adjust.pending}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={close}
            disabled={adjust.pending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={
              !allocation ||
              adjust.pending ||
              !Number.isInteger(entered) ||
              entered <= 0 ||
              entered > allocation.maxQuantity
            }
            onClick={() =>
              allocation &&
              adjust.run({
                allocationId: allocation.id,
                quantity: entered,
                note: null,
              })
            }
          >
            {adjust.pending ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      {allocation && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="font-medium text-primary">{allocation.itemName}</p>

            <p className="mt-1 text-sm text-muted">
              {allocation.warehouseName} / {allocation.storageSpaceName}
            </p>

            <div className="mt-3 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs text-muted">Stored here</p>

                <p className="mt-1 font-semibold text-primary">
                  {allocation.quantity}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted">Space free</p>

                <p className="mt-1 font-semibold text-primary">
                  {allocation.storageSpaceAvailable}
                </p>
              </div>

              <div>
                <p className="text-xs text-muted">Item left over</p>

                <p className="mt-1 font-semibold text-primary">
                  {allocation.itemRemaining}
                </p>
              </div>
            </div>
          </div>

          <div>
            <Label htmlFor="editQuantity">Quantity</Label>

            <Input
              id="editQuantity"
              type="number"
              min="1"
              max={allocation.maxQuantity}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={adjust.pending}
            />

            <FieldHint>
              Between 1 and {allocation.maxQuantity} units
              {allocation.limitedBy === "space"
                ? `, because "${allocation.storageSpaceName}" holds ${allocation.storageSpaceCapacity} units in total and ${allocation.storageSpaceAvailable} are free.`
                : `, because "${allocation.itemName}" has ${allocation.itemTotal} units in total and ${allocation.itemRemaining} are not allocated anywhere.`}
            </FieldHint>

            <FieldHint>
              Raising it moves unallocated units into this space. Lowering it
              sends them back to the unallocated pool; it does not change the
              item total.
            </FieldHint>
          </div>

          <FormMessage error={adjust.error} />
        </div>
      )}
    </Modal>
  );
}

export function DispatchStockDialog({
  allocation,
  onClose,
  onDone,
}: DialogProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useQuantityFor(allocation);
  const entered = Number(quantity);

  const dispatch = useAction(dispatchStockAction, {
    onSuccess: (_, message) => {
      onDone?.(message);
      onClose();
      router.refresh();
    },
  });

  function close() {
    dispatch.reset();
    onClose();
  }

  return (
    <Modal
      open={Boolean(allocation)}
      onClose={close}
      title="Dispatch Stock"
      description="Use this when stock leaves the business for good. It lowers the item total."
      size="sm"
      busy={dispatch.pending}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={close}
            disabled={dispatch.pending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant="destructive"
            disabled={
              !allocation ||
              dispatch.pending ||
              !Number.isInteger(entered) ||
              entered <= 0 ||
              entered > allocation.quantity
            }
            onClick={() =>
              allocation &&
              dispatch.run({
                allocationId: allocation.id,
                quantity: entered,
                note: null,
              })
            }
          >
            {dispatch.pending ? "Dispatching..." : "Dispatch Stock"}
          </Button>
        </div>
      }
    >
      {allocation && (
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-surface-subtle p-4">
            <p className="font-medium text-primary">{allocation.itemName}</p>

            <p className="mt-1 text-sm text-muted">
              {allocation.warehouseName} / {allocation.storageSpaceName} —{" "}
              {allocation.quantity} units stored
            </p>

            <p className="mt-2 text-sm text-secondary">
              The item total is {allocation.itemTotal} units. Dispatched units
              leave the business for good, so the total drops with them. To free
              space without losing stock, use Move instead.
            </p>
          </div>

          <div>
            <Label htmlFor="dispatchQuantity">Quantity to dispatch</Label>

            <Input
              id="dispatchQuantity"
              type="number"
              min="1"
              max={allocation.quantity}
              value={quantity}
              onChange={(event) => setQuantity(event.target.value)}
              disabled={dispatch.pending}
            />

            <FieldHint>
              Dispatching all {allocation.quantity} units clears this location
              and leaves the item with a total of{" "}
              {allocation.itemTotal - allocation.quantity} units.
            </FieldHint>
          </div>

          <FormMessage error={dispatch.error} />
        </div>
      )}
    </Modal>
  );
}
