import type { ReactNode } from "react";

export function AssessmentWorkspaceIntro({
  title,
  actions,
  metrics,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  actions?: ReactNode;
  metrics?: ReactNode;
}) {
  return actions || metrics ? (
    <section
      aria-label={title}
      className="workspace-actions flex min-w-0 flex-wrap items-center justify-between gap-2"
    >
      {metrics ? <div className="flex min-w-0 flex-wrap gap-1.5">{metrics}</div> : null}
      {actions ? <div className="flex min-w-0 flex-wrap gap-2">{actions}</div> : null}
    </section>
  ) : null;
}

export function AssessmentMetric({ children }: { children: ReactNode }) {
  return (
    <span className="rounded-lg bg-[rgb(var(--surface-muted))] px-2 py-1 text-xs font-bold text-slate-600 dark:text-slate-300">
      {children}
    </span>
  );
}
