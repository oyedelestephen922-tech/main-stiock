import type { ReactNode } from "react";

export function PageHeader({
  title,
  description,
  actions,
  display = false,
}: {
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
  display?: boolean;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-2xl">
        <h1 className={display ? "type-display text-[clamp(1.5rem,3vw,2.1rem)]" : "type-title text-[clamp(1.4rem,2.4vw,1.75rem)]"}>
          {title}
        </h1>
        {description && <p className="mt-3 text-ink-2">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function SectionTitle({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="type-title text-base">{children}</h2>
      {action}
    </div>
  );
}
