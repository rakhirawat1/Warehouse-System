"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftRight, Check, ChevronDown } from "lucide-react";

import { transferStockAction } from "../actions";
import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import { Input, Label } from "@/components/ui/input";
import Modal from "@/components/ui/modal";
import {
  canStore,
  STORAGE_TYPE_LABELS,
  type StorageType,
} from "@/lib/storage";
import { useAction } from "@/lib/use-action";

type Allocation = {
  id: string;
  itemName: string;
  requiredStorageType: StorageType;
  storageSpaceId: string;
  storageSpaceName: string;
  warehouseName: string;
  quantity: number;
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

type MoveAllocationFormProps = {
  allocation: Allocation;
  storageSpaces: StorageSpaceOption[];

  /**
   * Controlled mode, used when a table row opens the dialog from its menu.
   * Leaving these out keeps the component's own "Move" button.
   */
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

/** Moves stock to another space. Moving part of it splits the stock across both. */
export default function MoveAllocationForm({
  allocation,
  storageSpaces,
  open: controlledOpen,
  onOpenChange,
}: MoveAllocationFormProps) {
  const router = useRouter();

  const isControlled = controlledOpen !== undefined;

  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);

  const isOpen = isControlled ? controlledOpen : uncontrolledOpen;

  function setIsOpen(next: boolean) {
    if (isControlled) {
      onOpenChange?.(next);
      return;
    }

    setUncontrolledOpen(next);
  }

  const [destinationId, setDestinationId] = useState("");
  const [quantity, setQuantity] = useState("");

  const [destinationOpen, setDestinationOpen] = useState(false);
  const destinationRef = useRef<HTMLDivElement>(null);

  const transfer = useAction(transferStockAction, {
    onSuccess: () => {
      setIsOpen(false);
      setDestinationOpen(false);
      router.refresh();
    },
  });

  // Only active warehouses with a matching type and free room can receive stock.
  const destinations = storageSpaces.filter(
    (space) =>
      space.id !== allocation.storageSpaceId &&
      space.warehouseStatus === "ACTIVE" &&
      canStore(allocation.requiredStorageType, space.storageType) &&
      space.available > 0,
  );

  const destination = destinations.find(
    (space) => space.id === destinationId,
  );

  const maxQuantity = destination
    ? Math.min(allocation.quantity, destination.available)
    : allocation.quantity;

  const enteredQuantity = Number(quantity);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        destinationRef.current &&
        !destinationRef.current.contains(event.target as Node)
      ) {
        setDestinationOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Controlled mode: reset the fields when the parent opens the dialog.
  const [wasOpen, setWasOpen] = useState(isOpen);

  if (isOpen !== wasOpen) {
    setWasOpen(isOpen);

    if (isControlled && isOpen) {
      setDestinationId("");
      setQuantity("");
      setDestinationOpen(false);
      transfer.reset();
    }
  }

  function open() {
    transfer.reset();
    setDestinationId("");
    setQuantity("");
    setDestinationOpen(false);
    setIsOpen(true);
  }

  function selectDestination(id: string) {
    setDestinationId(id);
    setQuantity("");
    transfer.reset();
    setDestinationOpen(false);
  }

  function clearDestination() {
    setDestinationId("");
    setQuantity("");
    transfer.reset();
    setDestinationOpen(false);
  }

  return (
    <>
      {!isControlled && (
        <Button
          type="button"
          variant="secondary"
          size="sm"
          icon={<ArrowLeftRight className="h-4 w-4" />}
          onClick={open}
        >
          Move
        </Button>
      )}

      <Modal
        open={isOpen}
        onClose={() => {
          setDestinationOpen(false);
          setIsOpen(false);
        }}
        title="Move stock"
        description={`Move ${allocation.itemName} to another storage space.`}
        busy={transfer.pending}
        footer={
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setDestinationOpen(false);
                setIsOpen(false);
              }}
              disabled={transfer.pending}
            >
              Cancel
            </Button>

            <Button
              type="button"
              disabled={
                transfer.pending ||
                !destinationId ||
                !Number.isInteger(enteredQuantity) ||
                enteredQuantity <= 0 ||
                enteredQuantity > maxQuantity
              }
              onClick={() =>
                transfer.run({
                  allocationId: allocation.id,
                  destinationStorageSpaceId: destinationId,
                  quantity: enteredQuantity,
                  note: null,
                })
              }
            >
              {transfer.pending ? "Moving..." : "Move"}
            </Button>
          </div>
        }
      >
        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-sm text-muted">Currently stored in</p>

            <p className="mt-1 font-medium text-primary">
              {allocation.warehouseName} / {allocation.storageSpaceName}
            </p>

            <p className="mt-3 text-sm text-muted">Quantity here</p>

            <p className="mt-1 font-medium text-primary">
              {allocation.quantity} units
            </p>
          </div>

          <div>
            <Label htmlFor={`destination-${allocation.id}`}>
              Destination storage space
            </Label>

            {destinations.length === 0 ? (
              <div className="rounded-lg border border-warning-muted bg-warning-muted p-3">
                <p className="text-sm text-warning">
                  There is no other active storage space with free room that
                  accepts{" "}
                  {STORAGE_TYPE_LABELS[
                    allocation.requiredStorageType
                  ].toLowerCase()}{" "}
                  items.
                </p>
              </div>
            ) : (
              <div
                ref={destinationRef}
                className="relative mt-1"
              >
                <button
                  type="button"
                  id={`destination-${allocation.id}`}
                  aria-haspopup="listbox"
                  aria-expanded={destinationOpen}
                  onClick={() =>
                    setDestinationOpen((open) => !open)
                  }
                  disabled={transfer.pending}
                  className="flex h-10 w-full items-center justify-between rounded-lg border border-border bg-background px-3 text-left text-sm text-primary transition-[border-color,box-shadow] hover:border-accent focus:border-accent focus:outline-none focus:ring-4 focus:ring-accent/10 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <span
                    className={
                      destination
                        ? "truncate text-primary"
                        : "truncate text-muted"
                    }
                  >
                    {destination
                      ? `${destination.warehouseName} / ${destination.name}`
                      : "Select a storage space"}
                  </span>

                  <ChevronDown
                    className={`ml-2 h-4 w-4 shrink-0 text-muted transition-transform ${
                      destinationOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {destinationOpen && (
                  <div
                    role="listbox"
                    aria-labelledby={`destination-${allocation.id}`}
                    className="absolute left-0 right-0 z-50 mt-1 max-h-64 overflow-auto rounded-lg border border-border bg-background p-1 shadow-lg"
                  >
                    <button
                      type="button"
                      role="option"
                      aria-selected={!destinationId}
                      onClick={clearDestination}
                      className="w-full rounded-md px-3 py-2 text-left text-sm text-muted transition-colors hover:bg-surface-subtle"
                    >
                      Select a storage space
                    </button>

                    {destinations.map((space) => {
                      const isSelected =
                        space.id === destinationId;

                      return (
                        <button
                          key={space.id}
                          type="button"
                          role="option"
                          aria-selected={isSelected}
                          onClick={() =>
                            selectDestination(space.id)
                          }
                          className="flex w-full items-start gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-surface-subtle"
                        >
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-primary">
                              {space.warehouseName} /{" "}
                              {space.name}
                            </p>

                            <p className="mt-0.5 text-xs text-muted">
                              {
                                STORAGE_TYPE_LABELS[
                                  space.storageType
                                ]
                              }{" "}
                              · {space.available} units available
                            </p>
                          </div>

                          {isSelected && (
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>

          <div>
            <Label htmlFor={`moveQuantity-${allocation.id}`}>
              Quantity to move
            </Label>

            <Input
              id={`moveQuantity-${allocation.id}`}
              type="number"
              min="1"
              max={maxQuantity}
              value={quantity}
              onChange={(event) =>
                setQuantity(event.target.value)
              }
              placeholder="Enter quantity"
              disabled={!destinationId || transfer.pending}
            />

            {destination && (
              <p className="mt-1 text-sm text-muted">
                You can move up to {maxQuantity} units
                {destination.available < allocation.quantity
                  ? " (limited by the free room in the destination)"
                  : ""}
                . Moving fewer units splits the stock across both
                places.
              </p>
            )}
          </div>

          <FormMessage
            error={transfer.error}
            success={transfer.message}
          />
        </div>
      </Modal>
    </>
  );
}