"use client";

import { motion } from "framer-motion";

import { transitions } from "@/lib/motion";
import { cn } from "@/lib/utils";

export type TabOption<T extends string = string> = {
  value: T;
  label: string;
  /** Shown in brackets after the label, as the filter tabs do. */
  count?: number;
};

type TabsProps<T extends string> = {
  options: TabOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** "pill" for filter chips, "underline" for section tabs. */
  variant?: "pill" | "underline";
  /** Distinguishes the sliding indicator when several tab sets share a page. */
  layoutId?: string;
  className?: string;
};

export default function Tabs<T extends string>({
  options,
  value,
  onChange,
  variant = "pill",
  layoutId = "tab-indicator",
  className,
}: TabsProps<T>) {
  return (
    <div
      role="tablist"
      className={cn(
        "flex flex-wrap items-center",
        variant === "pill" ? "gap-2" : "gap-6 border-b border-border",
        className,
      )}
    >
      {options.map((option) => {
        const isActive = option.value === value;

        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative cursor-pointer text-sm font-medium transition-colors",
              variant === "pill"
                ? "rounded-full px-3.5 py-1.5"
                : "-mb-px px-1 pb-3",
              isActive
                ? variant === "pill"
                  ? "text-accent"
                  : "text-accent"
                : "text-secondary hover:text-primary",
            )}
          >
            {variant === "pill" && isActive && (
              <motion.span
                layoutId={layoutId}
                transition={transitions.indicator}
                className="absolute inset-0 rounded-full bg-accent-muted"
              />
            )}

            {variant === "underline" && isActive && (
              <motion.span
                layoutId={layoutId}
                transition={transitions.indicator}
                className="absolute inset-x-0 -bottom-px h-0.5 rounded-full bg-accent"
              />
            )}

            <span className="relative">
              {option.label}
              {option.count !== undefined && (
                <span
                  className={cn(
                    "ml-1.5",
                    isActive ? "text-accent" : "text-muted",
                  )}
                >
                  ({option.count})
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
