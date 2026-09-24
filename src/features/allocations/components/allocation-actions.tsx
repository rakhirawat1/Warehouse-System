"use client";

import { useState } from "react";
import { PackageMinus, Pencil } from "lucide-react";

import type { AllocationRow } from "../queries";
import { CorrectQuantityDialog, DispatchStockDialog } from "./allocation-dialogs";
import MoveAllocationForm from "./move-allocation-form";

import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import type { StorageType } from "@/lib/storage";

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

/** Buttons show only for allowed roles; the server actions check again. */
export default function AllocationActions({
  allocation,
  storageSpaces,
  canMove,
  canAdjust,
  canDispatch,
}: {
  allocation: AllocationRow;
  storageSpaces: StorageSpaceOption[];
  canMove: boolean;
  canAdjust: boolean;
  canDispatch: boolean;
}) {
  const [correcting, setCorrecting] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  if (!canMove && !canAdjust && !canDispatch) {
    return null;
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canMove && (
          <MoveAllocationForm
            allocation={{
              id: allocation.id,
              itemName: allocation.itemName,
              requiredStorageType: allocation.requiredStorageType,
              storageSpaceId: allocation.storageSpaceId,
              storageSpaceName: allocation.storageSpaceName,
              warehouseName: allocation.warehouseName,
              quantity: allocation.quantity,
            }}
            storageSpaces={storageSpaces}
          />
        )}

        {canAdjust && (
          <Button
            type="button"
            variant="secondary"
            size="sm"
            icon={<Pencil className="h-4 w-4" />}
            onClick={() => setCorrecting(true)}
          >
            Correct quantity
          </Button>
        )}

        {canDispatch && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            icon={<PackageMinus className="h-4 w-4" />}
            onClick={() => setDispatching(true)}
          >
            Dispatch Stock
          </Button>
        )}
      </div>

      <FormMessage success={message} />

      <CorrectQuantityDialog
        allocation={correcting ? allocation : null}
        onClose={() => setCorrecting(false)}
        onDone={setMessage}
      />

      <DispatchStockDialog
        allocation={dispatching ? allocation : null}
        onClose={() => setDispatching(false)}
        onDone={setMessage}
      />
    </div>
  );
}
