import type { ReactNode } from "react";
import { Icon, type IconName } from "./Icon";

interface StateProps {
  icon?: IconName;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  tone?: "neutral" | "error";
  compact?: boolean;
}

/** One component for empty, unavailable and error states — no blank screens. */
export function StateMessage({ icon = "info", title, description, action, tone = "neutral", compact }: StateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center text-center ${compact ? "gap-2 px-4 py-8" : "gap-3 px-6 py-14"}`}
      role={tone === "error" ? "alert" : undefined}
    >
      <span
        className={`grid size-10 place-items-center rounded-full border ${
          tone === "error" ? "border-down/40 text-down" : "border-line-strong text-electric"
        }`}
      >
        <Icon name={icon} size={18} />
      </span>
      <p className="text-[0.95rem] font-semibold text-ink">{title}</p>
      {description && <p className="max-w-sm text-sm text-ink-2">{description}</p>}
      {action && <div className="mt-1">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`skeleton block ${className}`} />;
}

export function LoadingRows({ rows = 5 }: { rows?: number }) {
  return (
    <div className="divide-y divide-line" aria-busy="true" aria-label="Loading">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 px-4 py-4">
          <Skeleton className="h-9 w-9 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
