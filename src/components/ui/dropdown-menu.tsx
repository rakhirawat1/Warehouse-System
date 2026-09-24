"use client";

import {
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import { MoreVertical } from "lucide-react";

import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

/** A store that never changes; it only tells the server and client apart. */
const subscribeNoop = () => () => {};

export type MenuItem = {
  label: string;
  icon?: React.ReactNode;
  href?: string;
  onSelect?: () => void;
  destructive?: boolean;
  disabled?: boolean;
};

type MenuPosition = {
  top: number;
  left: number;
  placement: "top" | "bottom";
};

export default function DropdownMenu({
  items,
  label = "More actions",
  align = "right",
}: {
  items: MenuItem[];
  label?: string;
  align?: "left" | "right";
}) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<MenuPosition | null>(null);
  // True in the browser, false during server rendering: portals need
  // document.body. useSyncExternalStore avoids a setState-in-effect render.
  const mounted = useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );

  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  const visible = items.filter((item) => !item.disabled);

  useEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const button = buttonRef.current;
      const menu = menuRef.current;

      if (!button || !menu) {
        return;
      }

      const buttonRect = button.getBoundingClientRect();
      const menuRect = menu.getBoundingClientRect();

      const gap = 4;
      const viewportPadding = 8;

      const spaceBelow = window.innerHeight - buttonRect.bottom;
      const spaceAbove = buttonRect.top;

      const shouldOpenAbove =
        spaceBelow < menuRect.height + gap &&
        spaceAbove >= menuRect.height + gap;

      const top = shouldOpenAbove
        ? buttonRect.top - menuRect.height - gap
        : buttonRect.bottom + gap;

      let left =
        align === "right"
          ? buttonRect.right - menuRect.width
          : buttonRect.left;

      left = Math.max(
        viewportPadding,
        Math.min(
          left,
          window.innerWidth - menuRect.width - viewportPadding,
        ),
      );

      setPosition({
        top,
        left,
        placement: shouldOpenAbove ? "top" : "bottom",
      });
    }

    const frame = requestAnimationFrame(updatePosition);

    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) {
      return;
    }

    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;

      if (
        !buttonRef.current?.contains(target) &&
        !menuRef.current?.contains(target)
      ) {
        setOpen(false);
      }
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  if (visible.length === 0) {
    return null;
  }

  const menuStyle: CSSProperties = position
    ? {
        position: "fixed",
        top: position.top,
        left: position.left,
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        visibility: "hidden",
      };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? menuId : undefined}
        onClick={() => {
          setPosition(null);
          setOpen((value) => !value);
        }}
        className={cn(
          "inline-flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-muted transition-colors hover:bg-neutral-muted hover:text-primary",
          open && "bg-neutral-muted text-primary",
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {mounted &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                ref={menuRef}
                id={menuId}
                role="menu"
                style={menuStyle}
                initial={{
                  opacity: 0,
                  scale: 0.96,
                  y: position?.placement === "top" ? 4 : -4,
                }}
                animate={{
                  opacity: position ? 1 : 0,
                  scale: position ? 1 : 0.96,
                  y: 0,
                }}
                exit={{
                  opacity: 0,
                  scale: 0.97,
                  y: position?.placement === "top" ? 4 : -4,
                }}
                transition={transitions.fast}
                className="z-[100] min-w-44 overflow-hidden rounded-lg border border-border bg-surface py-1 shadow-popover"
              >
                {visible.map((item) => {
                  const classes = cn(
                    "flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors",
                    item.destructive
                      ? "text-danger hover:bg-danger-muted"
                      : "text-secondary hover:bg-neutral-muted hover:text-primary",
                  );

                  if (item.href) {
                    return (
                      <Link
                        key={item.label}
                        href={item.href}
                        role="menuitem"
                        className={classes}
                        onClick={() => setOpen(false)}
                      >
                        {item.icon}
                        {item.label}
                      </Link>
                    );
                  }

                  return (
                    <button
                      key={item.label}
                      type="button"
                      role="menuitem"
                      className={classes}
                      onClick={() => {
                        setOpen(false);
                        item.onSelect?.();
                      }}
                    >
                      {item.icon}
                      {item.label}
                    </button>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}