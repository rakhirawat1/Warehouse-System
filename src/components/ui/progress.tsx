"use client";

import { motion } from "framer-motion";

import { EASE_OUT } from "@/lib/motion";
import { cn } from "@/lib/utils";

type ProgressProps = {
  value: number;
  max: number;
  /** Turns amber above 75% and red above 90%, as capacity bars should. */
  warnWhenFull?: boolean;
  size?: "sm" | "md";
  className?: string;
};

/** The capacity bar. It grows from zero on mount so filling is visible. */
export default function Progress({
  value,
  max,
  warnWhenFull = true,
  size = "md",
  className,
}: ProgressProps) {
  const percent = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  const tone =
    warnWhenFull && percent >= 90
      ? "bg-danger"
      : warnWhenFull && percent >= 75
        ? "bg-warning"
        : "bg-accent";

  return (
    <div
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      className={cn(
        "w-full overflow-hidden rounded-full bg-neutral-muted",
        size === "sm" ? "h-1.5" : "h-2",
        className,
      )}
    >
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percent}%` }}
        transition={{ duration: 0.7, ease: EASE_OUT }}
        className={cn("h-full rounded-full", tone)}
      />
    </div>
  );
}
