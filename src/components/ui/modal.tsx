"use client";

import { useEffect, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

import { backdropVariants, dialogVariants } from "@/lib/motion";
import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "max-w-md",
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
} as const;

type ModalProps = {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  /** Buttons for the footer. The footer stays visible while the body scrolls. */
  footer?: ReactNode;
  children: ReactNode;
  size?: keyof typeof sizeClasses;
  /** When given, the panel is a form and this receives the submitted data. */
  action?: (formData: FormData) => void | Promise<void>;
  /** Blocks closing while an action is running. */
  busy?: boolean;
};

/** Dialog with a fixed header and footer; only the body scrolls. */
export default function Modal({
  open,
  onClose,
  title,
  description,
  footer,
  children,
  size = "md",
  action,
  busy = false,
}: ModalProps) {
  // Close on Escape, and stop the page behind from scrolling.
  useEffect(() => {
    if (!open) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape" && !busy) {
        onClose();
      }
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose, busy]);

  const panelClasses = cn(
    "flex max-h-[min(85vh,44rem)] w-full flex-col overflow-hidden rounded-xl border border-border bg-surface shadow-popover",
    sizeClasses[size],
  );

  const body = (
    <>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border px-6 py-4">
        <div>
          <h2 className="text-base font-semibold text-primary">{title}</h2>

          {description && (
            <p className="mt-1 text-sm text-muted">{description}</p>
          )}
        </div>

        <button
          type="button"
          aria-label="Close"
          onClick={onClose}
          disabled={busy}
          className="cursor-pointer rounded-lg p-1.5 text-muted transition-colors hover:bg-neutral-muted hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">{children}</div>

      {footer && (
        <div className="shrink-0 border-t border-border bg-surface-subtle px-6 py-4">
          {footer}
        </div>
      )}
    </>
  );

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={backdropVariants}
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4 backdrop-blur-[2px]"
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onMouseDown={(event) => {
            // Only a click on the backdrop itself closes the dialog.
            if (event.target === event.currentTarget && !busy) {
              onClose();
            }
          }}
        >
          {action ? (
            <motion.form
              variants={dialogVariants}
              action={action}
              className={panelClasses}
            >
              {body}
            </motion.form>
          ) : (
            <motion.div variants={dialogVariants} className={panelClasses}>
              {body}
            </motion.div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
