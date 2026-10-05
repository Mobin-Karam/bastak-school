import {
  ChevronDown,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

type DashboardPreferenceWidget = {
  id: string;
  label: string;
  description: string;
  visible: boolean;
};

type DashboardPreferences = {
  label: string;
  visibleWidgetsLabel: string;

  widgets: DashboardPreferenceWidget[];

  shownLabel: string;
  hiddenLabel: string;
  resetLabel: string;

  onVisibilityChange: (
    id: string,
    visible: boolean,
  ) => void;

  onReset: () => void;
};

export function DashboardPreferencesContent({
  preferences,
}: {
  preferences: DashboardPreferences;
}) {
  const visibleCount = preferences.widgets.filter(
    (widget) => widget.visible,
  ).length;

  return (
    <div className="min-w-0">
      {/* =====================================================
          MOBILE — COLLAPSIBLE
          ===================================================== */}
      <details className="group sm:hidden">
        <summary
          className="
            flex min-h-12 cursor-pointer
            list-none items-center justify-between gap-3
            px-3 py-2.5
            select-none
            marker:content-none

            hover:bg-[rgb(var(--surface-muted))]

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-inset
            focus-visible:ring-brand/40

            [&::-webkit-details-marker]:hidden
          "
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="
                grid size-8 shrink-0
                place-items-center rounded-lg
                bg-brand/10 text-brand
              "
            >
              <SlidersHorizontal
                size={15}
                aria-hidden="true"
              />
            </span>

            <div className="min-w-0">
              <h2 className="truncate text-xs font-bold text-ink">
                {preferences.label}
              </h2>

              <p className="mt-0.5 text-[10px] text-slate-500 dark:text-slate-400">
                {visibleCount.toLocaleString()} /{" "}
                {preferences.widgets.length.toLocaleString()}{" "}
                {preferences.visibleWidgetsLabel}
              </p>
            </div>
          </div>

          <ChevronDown
            size={16}
            aria-hidden="true"
            className="
              shrink-0 text-slate-400
              transition-transform duration-200
              group-open:rotate-180
            "
          />
        </summary>

        <div className="border-t border-[rgb(var(--border-subtle))]">
          <PreferencesBody
            preferences={preferences}
          />
        </div>
      </details>

      {/* =====================================================
          TABLET / DESKTOP — ALWAYS OPEN
          ===================================================== */}
      <div className="hidden sm:block">
        <header className="flex items-center justify-between gap-3 border-b border-[rgb(var(--border-subtle))] px-4 py-3">
          <div className="flex min-w-0 items-center gap-2.5">
            <span
              className="
                grid size-8 shrink-0
                place-items-center rounded-lg
                bg-brand/10 text-brand
              "
            >
              <SlidersHorizontal
                size={15}
                aria-hidden="true"
              />
            </span>

            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-ink">
                {preferences.label}
              </h2>

              <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                {visibleCount.toLocaleString()} /{" "}
                {preferences.widgets.length.toLocaleString()}{" "}
                {preferences.visibleWidgetsLabel}
              </p>
            </div>
          </div>
        </header>

        <PreferencesBody
          preferences={preferences}
        />
      </div>
    </div>
  );
}

/* =========================================================
   SHARED CONTENT
   ========================================================= */

function PreferencesBody({
  preferences,
}: {
  preferences: DashboardPreferences;
}) {
  return (
    <>
      <fieldset className="grid gap-1 p-2">
        <legend className="sr-only">
          {preferences.visibleWidgetsLabel}
        </legend>

        {preferences.widgets.map((widget) => (
          <label
            key={widget.id}
            className="
              group/item
              flex min-h-14 cursor-pointer
              items-center gap-3
              rounded-lg
              px-2.5 py-2

              transition-colors

              hover:bg-[rgb(var(--surface-muted))]

              focus-within:ring-2
              focus-within:ring-brand/40
            "
          >
            <input
              type="checkbox"
              aria-label={widget.label}
              checked={widget.visible}
              onChange={(event) =>
                preferences.onVisibilityChange(
                  widget.id,
                  event.target.checked,
                )
              }
              className="
                size-4 shrink-0
                rounded
                border-[rgb(var(--border-subtle))]
                text-brand
                focus:ring-brand
              "
            />

            <span className="min-w-0 flex-1">
              <span className="flex items-center justify-between gap-3">
                <span className="truncate text-xs font-bold text-ink">
                  {widget.label}
                </span>

                <span
                  className={
                    widget.visible
                      ? `
                        shrink-0
                        text-[10px] font-bold
                        text-emerald-700
                        dark:text-emerald-300
                      `
                      : `
                        shrink-0
                        text-[10px] font-bold
                        text-slate-400
                        dark:text-slate-500
                      `
                  }
                >
                  {widget.visible
                    ? preferences.shownLabel
                    : preferences.hiddenLabel}
                </span>
              </span>

              <span
                className="
                  mt-0.5 block
                  line-clamp-1
                  text-[11px] leading-4
                  text-slate-500
                  dark:text-slate-400
                "
              >
                {widget.description}
              </span>
            </span>
          </label>
        ))}
      </fieldset>

      <footer className="flex items-center justify-end border-t border-[rgb(var(--border-subtle))] px-3 py-2">
        <button
          type="button"
          onClick={preferences.onReset}
          className="
            inline-flex min-h-8
            items-center gap-1.5
            rounded-md px-2

            text-xs font-semibold
            text-slate-500

            transition-colors

            hover:bg-[rgb(var(--surface-muted))]
            hover:text-brand

            focus-visible:outline-none
            focus-visible:ring-2
            focus-visible:ring-brand/40

            dark:text-slate-400
          "
        >
          <RotateCcw
            size={13}
            aria-hidden="true"
          />

          {preferences.resetLabel}
        </button>
      </footer>
    </>
  );
}