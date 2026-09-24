"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";

import { transitions } from "@/lib/motion";

/** Never changes, so the store never notifies: it only separates the two snapshots. */
const subscribe = () => () => {};

export default function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  // true once rendered in the browser, false on the server, without the
  // cascading render that a setState-in-effect would cause.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const buttonClasses =
    "inline-flex h-9 w-9 cursor-pointer items-center justify-center rounded-lg text-secondary transition-colors hover:bg-neutral-muted hover:text-primary";

  // Before hydration the theme is unknown, so render an empty slot of the
  // same size instead of guessing and flipping the icon.
  if (!mounted) {
    return <span className={buttonClasses} aria-hidden />;
  }

  const isDark = resolvedTheme === "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(isDark ? "light" : "dark")}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={buttonClasses}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.span
          key={isDark ? "sun" : "moon"}
          initial={{ opacity: 0, rotate: -90, scale: 0.6 }}
          animate={{ opacity: 1, rotate: 0, scale: 1 }}
          exit={{ opacity: 0, rotate: 90, scale: 0.6 }}
          transition={transitions.fast}
          className="flex"
        >
          {isDark ? (
            <Sun className="h-[18px] w-[18px]" />
          ) : (
            <Moon className="h-[18px] w-[18px]" />
          )}
        </motion.span>
      </AnimatePresence>
    </button>
  );
}
