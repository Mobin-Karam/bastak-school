import type { CSSProperties, ReactNode } from "react";
import { cn } from "../../lib/utils";
import { Badge } from "../ui";
export function StatisticCard({
  label,
  value,
  trend,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  trend?: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "grid gap-1 rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 shadow-[var(--shadow-surface)]",
        className,
      )}
    >
      <p className="text-sm text-slate-500">{label}</p>
      <strong className="text-2xl font-black text-ink">{value}</strong>
      {trend ? (
        <span className="text-xs text-emerald-700 dark:text-emerald-300">{trend}</span>
      ) : null}
    </section>
  );
}
export function ProgressIndicator({ value, label }: { value: number; label: ReactNode }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div className="grid gap-2">
      <div className="flex justify-between gap-3 text-sm">
        <span>{label}</span>
        <span>{bounded.toLocaleString("fa-IR")}٪</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[rgb(var(--surface-muted))]">
        <div
          className="h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none"
          style={{ width: `${bounded}%` }}
        />
      </div>
    </div>
  );
}
export function ProgressRing({ value, label }: { value: number; label: string }) {
  const bounded = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={bounded}
      className="grid size-16 place-items-center rounded-full bg-[conic-gradient(rgb(var(--color-brand))_var(--progress),rgb(var(--surface-muted))_0)]"
      style={{ "--progress": `${bounded}%` } as CSSProperties}
    >
      <span className="grid size-12 place-items-center rounded-full bg-[rgb(var(--surface-card))] text-xs font-bold">
        {bounded}٪
      </span>
    </div>
  );
}
export function StatusBadge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "success" | "warning" | "danger";
}) {
  return (
    <Badge
      className={cn(
        tone === "success" && "bg-emerald-100 text-emerald-800",
        tone === "warning" && "bg-amber-100 text-amber-900",
        tone === "danger" && "bg-rose-100 text-rose-900",
      )}
    >
      {children}
    </Badge>
  );
}
export function Timeline({
  items,
}: {
  items: readonly { title: ReactNode; description?: ReactNode; time?: ReactNode }[];
}) {
  return (
    <ol className="grid gap-4 border-s-2 border-[rgb(var(--border-subtle))] ps-4">
      {items.map((item, index) => (
        <li key={index} className="relative">
          <span className="absolute -start-[1.58rem] top-1 size-3 rounded-full bg-brand ring-4 ring-[rgb(var(--surface-card))]" />
          <p className="font-bold">{item.title}</p>
          {item.description ? (
            <p className="mt-1 text-sm text-slate-500">{item.description}</p>
          ) : null}
          {item.time ? (
            <time className="mt-1 block text-xs text-slate-400">{item.time}</time>
          ) : null}
        </li>
      ))}
    </ol>
  );
}
export function CompactChartContainer({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section
      aria-label={typeof title === "string" ? title : undefined}
      className="overflow-hidden rounded-2xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4"
    >
      <h2 className="mb-3 text-sm font-bold">{title}</h2>
      <div className="min-h-32" role="img">
        {children}
      </div>
    </section>
  );
}
