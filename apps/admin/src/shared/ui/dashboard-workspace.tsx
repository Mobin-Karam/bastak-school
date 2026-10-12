import type { ReactNode } from "react";
import { LayoutGrid, Rows3, Settings2 } from "lucide-react";
import { SegmentedControl } from "./segmented-control";
import { ViewportPopover } from "./popover";
import { DashboardPreferencesContent } from "./dashboard-preferences-content.tsx/DashboardPreferencesContent";

/**
 * A product-neutral dashboard shell. Hosts provide their own copy, data,
 * actions and widgets while this component owns the operational hierarchy:
 * actions -> summary -> primary work -> secondary context.
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
  brand,
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
  brand?: ReactNode;
}) {
  return (
    <section
      className={`dashboard-workspace grid min-w-0 max-w-full gap-3 overflow-x-clip ${density === "compact" ? "gap-2" : "gap-4"}`}
    >
      <section
        aria-label={title}
        className="workspace-actions flex min-w-0 flex-wrap items-center justify-between gap-2"
      >
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          {brand}
          {freshness ? <span className="text-xs text-slate-500">{freshness}</span> : null}
          <span className="sr-only">{description}</span>
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
      </section>
      {summary}

      {primary || secondary ? (
        <div className="dashboard-workspace__panels grid min-w-0 gap-3">
          {primary ? <div className="min-w-0">{primary}</div> : null}
          {secondary ? <section className="min-w-0">{secondary}</section> : null}
        </div>
      ) : null}
    </section>
  );
}
