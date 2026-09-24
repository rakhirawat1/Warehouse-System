import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/** List pages omit the title: the top bar already names the section. */
export default function PageHeader({
  title,
  description,
  action,
  className,
}: {
  title?: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  if (!title && !description) {
    return action ? (
      <div className={cn("mb-6 flex justify-end gap-2", className)}>
        {action}
      </div>
    ) : null;
  }

  return (
    <div
      className={cn(
        "mb-6 flex flex-wrap items-start justify-between gap-4",
        className,
      )}
    >
      <div className="min-w-0">
        {title && (
          <h2 className="text-xl font-semibold tracking-tight text-primary">
            {title}
          </h2>
        )}

        {description && (
          <p className="mt-1 text-sm text-muted">{description}</p>
        )}
      </div>

      {action && <div className="flex shrink-0 gap-2">{action}</div>}
    </div>
  );
}
