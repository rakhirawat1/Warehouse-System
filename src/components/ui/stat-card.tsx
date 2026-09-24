"use client";

import type { ReactNode } from "react";
import { motion } from "framer-motion";
import { TrendingDown, TrendingUp } from "lucide-react";

import Counter from "@/components/motion/counter";
import { riseItem } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type StatTone = "accent" | "success" | "warning" | "danger" | "info";

const toneClasses: Record<StatTone, string> = {
  accent: "bg-accent-muted text-accent",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-danger-muted text-danger",
  info: "bg-info-muted text-info",
};

type StatCardProps = {
  label: string;
  value: number;
  /** An element, not a component: server components cannot pass components across. */
  icon: ReactNode;
  tone?: StatTone;
  /** Shown under the number, e.g. "units" or "+6 this month". */
  hint?: string;
  /** Renders the hint as a green rise or red fall. */
  trend?: "up" | "down";
  suffix?: string;
  className?: string;
};

export default function StatCard({
  label,
  value,
  icon,
  tone = "accent",
  hint,
  trend,
  suffix = "",
  className,
}: StatCardProps) {
  const TrendIcon = trend === "down" ? TrendingDown : TrendingUp;

  return (
    <motion.div
      variants={riseItem}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.18 }}
      className={cn(
        "rounded-xl border border-border bg-surface p-4 shadow-card transition-shadow hover:shadow-raised",
        className,
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
            toneClasses[tone],
          )}
        >
          {icon}
        </div>

        <div className="min-w-0">
          <p className="truncate text-xs font-medium text-muted">{label}</p>

          <p className="mt-0.5 text-2xl font-bold tracking-tight text-primary">
            <Counter value={value} suffix={suffix} />
          </p>

          {hint && (
            <p
              className={cn(
                "mt-1 flex items-center gap-1 text-xs",
                trend === "up"
                  ? "text-success"
                  : trend === "down"
                    ? "text-danger"
                    : "text-muted",
              )}
            >
              {trend && <TrendIcon className="h-3 w-3" />}
              {hint}
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}
