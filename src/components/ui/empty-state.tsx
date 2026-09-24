import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export default function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center px-6 py-14 text-center",
        className,
      )}
    >
      {Icon && (
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-neutral-muted text-muted">
          <Icon className="h-6 w-6" />
        </div>
      )}

      <p className="font-semibold text-primary">{title}</p>

      {description && (
        <p className="mt-1 max-w-sm text-sm text-muted">{description}</p>
      )}

      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
