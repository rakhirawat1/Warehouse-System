"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Power, PowerOff } from "lucide-react";

import { updateWarehouseAction } from "../actions";
import Button from "@/components/ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { useAction } from "@/lib/use-action";

/**
 * Deactivating is the safe alternative to deleting: stock and history stay,
 * but nothing new can be allocated.
 */
export default function WarehouseStatusToggle({
  warehouse,
}: {
  warehouse: {
    id: string;
    name: string;
    status: "ACTIVE" | "INACTIVE";
    used: number;
  };
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = warehouse.status === "ACTIVE";

  const update = useAction(updateWarehouseAction, {
    onSuccess: () => {
      setOpen(false);
      router.refresh();
    },
  });

  return (
    <>
      <Button
        type="button"
        variant={isActive ? "destructive" : "primary"}
        size="sm"
        icon={
          isActive ? (
            <PowerOff className="h-4 w-4" />
          ) : (
            <Power className="h-4 w-4" />
          )
        }
        onClick={() => {
          update.reset();
          setOpen(true);
        }}
      >
        {isActive ? "Deactivate" : "Activate"}
      </Button>

      <ConfirmDialog
        open={open}
        onClose={() => setOpen(false)}
        onConfirm={() =>
          update.run(warehouse.id, {
            status: isActive ? "INACTIVE" : "ACTIVE",
          })
        }
        title={isActive ? "Deactivate warehouse" : "Activate warehouse"}
        confirmLabel={isActive ? "Deactivate" : "Activate"}
        pendingLabel="Saving..."
        destructive={isActive}
        pending={update.pending}
        error={update.error}
      >
        <div className="rounded-lg border border-border bg-surface-subtle p-4">
          <p className="font-medium text-primary">{warehouse.name}</p>

          <p className="mt-2 text-sm text-secondary">
            {isActive
              ? `No new stock can be allocated here while it is inactive. The ${warehouse.used} units already inside stay where they are, keep their history, and can still be moved out or removed.`
              : "Allocations into this warehouse will be allowed again."}
          </p>
        </div>
      </ConfirmDialog>
    </>
  );
}
