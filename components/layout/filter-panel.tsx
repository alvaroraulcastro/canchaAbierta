import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type FilterPanelProps = {
  title: string;
  children: ReactNode;
  className?: string;
};

export function FilterPanel({ title, children, className }: FilterPanelProps) {
  return (
    <section
      aria-label={title}
      className={cn(
        "rounded-3xl border border-line bg-card p-4 shadow-sm shadow-brand-900/5 sm:p-5",
        className,
      )}
    >
      <p className="mb-3 text-xs font-semibold tracking-wide text-muted uppercase">{title}</p>
      {children}
    </section>
  );
}