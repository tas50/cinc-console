import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Standard top-of-page header: a single h1 with consistent size and tracking,
 * an optional muted description, and an optional right-aligned actions slot
 * (e.g. a "New" button). Keeps the title treatment identical across list pages,
 * the org dashboard, and detail views. Marginless — callers control spacing.
 */
export function PageHeader({
  title,
  description,
  actions,
  titleClassName,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  /** Override the heading classes, e.g. to render an object name in mono. */
  titleClassName?: string;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
      <div className="space-y-1">
        <h1
          className={cn(
            "text-2xl font-semibold tracking-tight text-text",
            titleClassName,
          )}
        >
          {title}
        </h1>
        {description && <p className="text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
