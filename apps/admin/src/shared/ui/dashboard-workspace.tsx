import type { ReactNode } from "react";
import { LayoutGrid, Rows3, SlidersHorizontal } from "lucide-react";
import { SegmentedControl } from "./segmented-control";

/**
 * A product-neutral dashboard shell. Hosts provide their own copy, data,
 * actions and widgets while this component owns the operational hierarchy:
 * header -> summary -> primary work -> secondary context.
 */
export function DashboardWorkspace({
  title,
  description,
  freshness,
  density,
  onDensityChange,
  densityLabels,
  actions,
  summary,
  primary,
  secondary,
  preferences,
}: {
  title: string;
  description: string;
  freshness?: ReactNode;
  density: "comfortable" | "compact";
  onDensityChange: (density: "comfortable" | "compact") => void;
  densityLabels: { label: string; comfortable: string; compact: string };
  actions?: ReactNode;
  summary: ReactNode;
  primary?: ReactNode;
  secondary?: ReactNode;
  preferences?: {
    label: string;
    visibleWidgetsLabel: string;
    resetLabel: string;
    shownLabel: string;
    hiddenLabel: string;
    widgets: Array<{ id: string; label: string; description: string; visible: boolean }>;
    onVisibilityChange: (id: string, visible: boolean) => void;
    onReset: () => void;
  };
}) {
  return (
    <section
      className={`dashboard-workspace grid min-w-0 max-w-full gap-3 overflow-x-clip ${density === "compact" ? "gap-2" : "gap-4"}`}
    >
      <header className="flex min-w-0 flex-col gap-2 border-b border-[rgb(var(--border-subtle))] pb-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="shrink-0 text-base font-black tracking-tight text-ink sm:text-lg">
            {title}
          </h1>
          <p className="min-w-0 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {description}
          </p>
          {freshness ? (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{freshness}</div>
          ) : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-2 lg:justify-end">
          <SegmentedControl
            ariaLabel={densityLabels.label}
            value={density}
            onValueChange={(value) => onDensityChange(value as "comfortable" | "compact")}
            options={[
              {
                value: "comfortable",
                label: (
                  <>
                    <LayoutGrid size={14} aria-hidden="true" />
                    {densityLabels.comfortable}
                  </>
                ),
              },
              {
                value: "compact",
                label: (
                  <>
                    <Rows3 size={14} aria-hidden="true" />
                    {densityLabels.compact}
                  </>
                ),
              },
            ]}
          />
          {actions}
        </div>
      </header>

      {preferences?.widgets.length ? (
        <details className="group rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]">
          <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 px-3 text-xs font-bold text-ink marker:content-none hover:bg-[rgb(var(--surface-muted))] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40">
            <span className="inline-flex items-center gap-2">
              <SlidersHorizontal size={15} className="text-brand" aria-hidden="true" />
              {preferences.label}
            </span>
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              {preferences.visibleWidgetsLabel}
            </span>
          </summary>
          <fieldset className="grid gap-2 border-t border-[rgb(var(--border-subtle))] p-3 sm:grid-cols-2 xl:grid-cols-3">
            <legend className="sr-only">{preferences.visibleWidgetsLabel}</legend>
            {preferences.widgets.map((widget) => (
              <label
                key={widget.id}
                className="flex min-h-20 cursor-pointer items-start gap-3 rounded-md border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3 transition hover:border-brand/35 hover:bg-brand/[0.025] focus-within:ring-2 focus-within:ring-brand/40"
              >
                <input
                  type="checkbox"
                  aria-label={widget.label}
                  checked={widget.visible}
                  onChange={(event) =>
                    preferences.onVisibilityChange(widget.id, event.target.checked)
                  }
                  className="mt-0.5 size-4 shrink-0 rounded border-[rgb(var(--border-subtle))] text-brand focus:ring-brand"
                />
                <span className="min-w-0">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-xs font-bold text-ink">{widget.label}</span>
                    <span
                      className={
                        widget.visible
                          ? "text-[10px] font-bold text-emerald-700 dark:text-emerald-300"
                          : "text-[10px] font-bold text-slate-500 dark:text-slate-400"
                      }
                    >
                      {widget.visible ? preferences.shownLabel : preferences.hiddenLabel}
                    </span>
                  </span>
                  <span className="mt-1 block text-[11px] leading-5 text-slate-500 dark:text-slate-400">
                    {widget.description}
                  </span>
                </span>
              </label>
            ))}
          </fieldset>
          <div className="flex justify-end border-t border-[rgb(var(--border-subtle))] px-3 py-2">
            <button
              type="button"
              className="text-xs font-semibold text-brand hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
              onClick={preferences.onReset}
            >
              {preferences.resetLabel}
            </button>
          </div>
        </details>
      ) : null}

      {summary}

      {primary || secondary ? (
        <div className="grid min-w-0 gap-3">
          {primary ? <div className="min-w-0">{primary}</div> : null}
          {secondary ? <section className="min-w-0">{secondary}</section> : null}
        </div>
      ) : null}
    </section>
  );
}
