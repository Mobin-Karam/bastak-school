import type { ReactNode } from "react";
import { LayoutGrid, Rows3, Settings2, SlidersHorizontal } from "lucide-react";
import { SegmentedControl } from "./segmented-control";
import { ViewportPopover } from "./popover";
import { DashboardPreferencesContent } from "./dashboard-preferences-content.tsx/DashboardPreferencesContent";

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
      {/* =========================================================
    MOBILE HEADER
    ========================================================= */}
      {/* =========================================================
    MOBILE HEADER — STICKY
    ========================================================= */}
      <header
        className="
  sticky top-16 z-30
    -mx-3
    flex min-w-0 items-center justify-between gap-3
    border-b border-[rgb(var(--border-subtle))]
    bg-[rgb(var(--surface-page))]/95
    px-3 py-2.5
    backdrop-blur-md
    supports-[backdrop-filter]:bg-[rgb(var(--surface-page))]/85

    sm:hidden
  "
      >
        <div className="min-w-0">
          <h1 className="truncate text-base font-black tracking-tight text-ink">{title}</h1>

          {freshness ? (
            <div className="mt-0.5 truncate text-[10px] text-slate-500 dark:text-slate-400">
              {freshness}
            </div>
          ) : null}
        </div>

        <ViewportPopover
          width={380}
          align="end"
          trigger={(triggerProps) => (
            <button
              ref={triggerProps.ref}
              type="button"
              onClick={triggerProps.onClick}
              aria-expanded={triggerProps["aria-expanded"]}
              aria-haspopup={triggerProps["aria-haspopup"]}
              aria-label={preferences?.label ?? title}
              title={preferences?.label ?? title}
              className="
          inline-flex size-9 shrink-0
          items-center justify-center
          rounded-lg
          border border-[rgb(var(--border-subtle))]
          bg-[rgb(var(--surface-card))]
          text-slate-600
          shadow-sm
          transition

          hover:border-brand/30
          hover:bg-[rgb(var(--surface-muted))]
          hover:text-brand

          focus-visible:outline-none
          focus-visible:ring-2
          focus-visible:ring-brand/40

          dark:text-slate-300
        "
            >
              <Settings2 size={17} aria-hidden="true" />
            </button>
          )}
        >
          <div className="min-w-0">
            {/* Density */}
            <div className="border-b border-[rgb(var(--border-subtle))] p-3">
              <div className="mb-2 text-[11px] font-bold text-slate-500 dark:text-slate-400">
                {densityLabels.label}
              </div>

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
            </div>

            {/* Preferences */}
            {preferences?.widgets.length ? (
              <DashboardPreferencesContent preferences={preferences} />
            ) : null}

            {/* Actions */}
            {actions ? (
              <div className="flex flex-wrap items-center gap-2 border-t border-[rgb(var(--border-subtle))] p-3">
                {actions}
              </div>
            ) : null}
          </div>
        </ViewportPopover>
      </header>

      {/* =========================================================
    TABLET + DESKTOP HEADER — STICKY
    ========================================================= */}
      <header
        className="
  sticky top-16 z-30
    -mx-3
    hidden min-w-0
    border-b border-[rgb(var(--border-subtle))]
    bg-[rgb(var(--surface-page))]/95
    px-3 py-3
    backdrop-blur-md
    supports-[backdrop-filter]:bg-[rgb(var(--surface-page))]/85

    sm:flex
    sm:flex-col
    sm:gap-2

    lg:flex-row
    lg:items-center
    lg:justify-between
  "
      >
        {/* Title */}
        <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
          <h1 className="shrink-0 text-lg font-black tracking-tight text-ink">{title}</h1>

          <p className="min-w-0 text-xs leading-5 text-slate-600 dark:text-slate-300">
            {description}
          </p>

          {freshness ? (
            <div className="text-[11px] text-slate-500 dark:text-slate-400">{freshness}</div>
          ) : null}
        </div>

        {/* Actions */}
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

          {/* Preferences */}
          {preferences?.widgets.length ? (
            <ViewportPopover
              width={380}
              align="end"
              trigger={(triggerProps) => (
                <button
                  ref={triggerProps.ref}
                  type="button"
                  onClick={triggerProps.onClick}
                  aria-expanded={triggerProps["aria-expanded"]}
                  aria-haspopup={triggerProps["aria-haspopup"]}
                  aria-label={preferences.label}
                  title={preferences.label}
                  className="
              inline-flex size-9 shrink-0
              items-center justify-center
              rounded-lg
              border border-[rgb(var(--border-subtle))]
              bg-[rgb(var(--surface-card))]
              text-slate-600
              shadow-sm
              transition

              hover:border-brand/30
              hover:bg-[rgb(var(--surface-muted))]
              hover:text-brand

              focus-visible:outline-none
              focus-visible:ring-2
              focus-visible:ring-brand/40

              dark:text-slate-300
            "
                >
                  <Settings2 size={16} aria-hidden="true" />
                </button>
              )}
            >
              <DashboardPreferencesContent preferences={preferences} />
            </ViewportPopover>
          ) : null}

          {actions}
        </div>
      </header>
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
