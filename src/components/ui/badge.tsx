import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type BadgeVariant =
  | "neutral"
  | "success"
  | "warning"
  | "danger"
  | "info"
  | "accent"
  | "outline";

const variantClasses: Record<BadgeVariant, string> = {
  neutral: "bg-neutral-muted text-neutral",
  success: "bg-success-muted text-success",
  warning: "bg-warning-muted text-warning",
  danger: "bg-danger-muted text-danger",
  info: "bg-info-muted text-info",
  accent: "bg-accent-muted text-accent",
  outline: "border border-border bg-surface text-secondary",
};

type BadgeProps = {
  variant?: BadgeVariant;
  dot?: boolean;
  className?: string;
  children: ReactNode;
};

export default function Badge({
  variant = "neutral",
  dot = false,
  className,
  children,
}: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap",
        variantClasses[variant],
        className,
      )}
    >
      {dot && (
        <span className="h-1.5 w-1.5 rounded-full bg-current opacity-80" />
      )}

      {children}
    </span>
  );
}
