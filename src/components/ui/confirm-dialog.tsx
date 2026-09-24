"use client";

import type { ReactNode } from "react";

import Button from "@/components/ui/button";
import FormMessage from "@/components/ui/form-message";
import Modal from "@/components/ui/modal";

type ConfirmDialogProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  children?: ReactNode;
  confirmLabel?: string;
  pendingLabel?: string;
  destructive?: boolean;
  pending?: boolean;
  error?: string | null;
};

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  children,
  confirmLabel = "Confirm",
  pendingLabel = "Working...",
  destructive = false,
  pending = false,
  error,
}: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      busy={pending}
      footer={
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={pending}
          >
            Cancel
          </Button>

          <Button
            type="button"
            variant={destructive ? "destructive" : "primary"}
            onClick={onConfirm}
            disabled={pending}
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {children}

        <FormMessage error={error} />
      </div>
    </Modal>
  );
}
