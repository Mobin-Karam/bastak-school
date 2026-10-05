import { Search } from "lucide-react";
import { useId, type CSSProperties, type ReactNode } from "react";
import { cn } from "../lib/utils";
import { useSharedUiCopy } from "./locale";
import { Card, Input } from "./ui";

export function ManagementPageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  const copy = useSharedUiCopy();
  const titleId = useId();
  const descriptionId = useId();
  return (
    <header
      className="grid gap-4 border-b border-[rgb(var(--border-subtle))] pb-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end"
      aria-labelledby={titleId}
      aria-describedby={description ? descriptionId : undefined}
    >
      <div className="min-w-0">
        <p className="text-xs font-bold text-brand">{eyebrow || copy.management}</p>
        <h1
          id={titleId}
          className="mt-1 text-2xl font-bold tracking-tight text-ink sm:text-[1.65rem]"
        >
          {title}
        </h1>
        <p
          id={descriptionId}
          className="mt-1 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-400"
        >
          {description}
        </p>
      </div>
      {action ? (
        <div className="flex w-full shrink-0 flex-wrap gap-2 [&>*]:w-full sm:w-auto sm:justify-end sm:[&>*]:w-auto">
          {action}
        </div>
      ) : null}
    </header>
  );
}

export function ManagementSummaryBar({
  children,
  action,
  label,
}: {
  children: ReactNode;
  action?: ReactNode;
  label?: string;
}) {
  const copy = useSharedUiCopy();
  return (
    <section
      className="flex flex-wrap items-center justify-between gap-3"
      aria-label={label || copy.summaryAndFilters}
    >
      <div className="flex flex-wrap items-center gap-2">{children}</div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </section>
  );
}

type Tone = "brand" | "success" | "warning" | "muted";

const toneStyles: Record<Tone, { accent: string; value: string }> = {
  brand: { accent: "bg-brand", value: "text-ink" },
  success: { accent: "bg-emerald-500", value: "text-emerald-700 dark:text-emerald-300" },
  warning: { accent: "bg-amber-500", value: "text-amber-700 dark:text-amber-300" },
  muted: { accent: "bg-slate-300 dark:bg-slate-600", value: "text-slate-600 dark:text-slate-300" },
};

export function ManagementStat({
  label,
  value,
  active = false,
  tone = "brand",
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  tone?: Tone;
  onClick?: () => void;
}) {
  const { locale } = useSharedUiCopy();
  const t = toneStyles[tone];

  const className = cn(
    "group relative flex min-w-0 flex-1 flex-col justify-between gap-1.5 overflow-hidden rounded-lg border bg-[rgb(var(--surface-card))] px-3 py-2.5 text-start shadow-[var(--shadow-surface)] transition",
    "border-[rgb(var(--border-subtle))]",
    onClick &&
      "cursor-pointer hover:border-brand/40 hover:shadow-sm focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20",
    active && "border-brand ring-1 ring-brand/30",
  );

  const body = (
    <>
      {/* accent bar */}
      <span
        aria-hidden="true"
        className={cn("absolute inset-y-2 start-0 w-0.5 rounded-full", t.accent)}
      />

      <span className="truncate ps-2 text-[11px] font-medium leading-none text-slate-500 dark:text-slate-400">
        {label}
      </span>

      <span
        className={cn("ps-2 text-xl font-black leading-none tabular-nums tracking-tight", t.value)}
      >
        {value.toLocaleString(locale)}
      </span>
    </>
  );

  return onClick ? (
    <button type="button" className={className} aria-pressed={active} onClick={onClick}>
      {body}
    </button>
  ) : (
    <div className={className}>{body}</div>
  );
}
export function ManagementSearch({
  value,
  onChange,
  placeholder,
  resultLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  resultLabel?: ReactNode;
}) {
  return (
    <Card className="p-3 sm:p-4">
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-400"
          size={17}
        />
        <Input
          className="ps-10"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      </div>
      {resultLabel ? (
        <div className="mt-3 border-t border-slate-100 pt-3 text-xs text-slate-500 dark:border-slate-800">
          {resultLabel}
        </div>
      ) : null}
    </Card>
  );
}

export function ManagementMasterDetail({
  directory,
  detail,
  directoryVisible = true,
  detailVisible = true,
  detailWidth = "minmax(420px,.75fr)",
  detailScroll = true,
}: {
  directory: ReactNode;
  detail: ReactNode;
  directoryVisible?: boolean;
  detailVisible?: boolean;
  detailWidth?: string;
  /**
   * Disable this when the detail surface owns its own bounded scroll area.
   * It prevents nested desktop scrollbars while preserving the sticky column.
   */
  detailScroll?: boolean;
}) {
  const detailLayout = detailScroll
    ? "xl:sticky xl:top-20 xl:max-h-[calc(100dvh-6rem)] xl:overflow-y-auto xl:overscroll-contain xl:pe-1"
    : "xl:sticky xl:top-20 xl:pe-1";

  return (
    <section
      className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.25fr)_var(--management-detail)] 2xl:grid-cols-[minmax(0,1.4fr)_var(--management-detail)]"
      style={{ "--management-detail": detailWidth } as CSSProperties}
    >
      <div className={directoryVisible ? "min-w-0" : "hidden min-w-0 xl:block"}>{directory}</div>
      <div
        className={
          detailVisible ? `min-w-0 ${detailLayout}` : `hidden min-w-0 xl:block ${detailLayout}`
        }
      >
        {detail}
      </div>
    </section>
  );
}
