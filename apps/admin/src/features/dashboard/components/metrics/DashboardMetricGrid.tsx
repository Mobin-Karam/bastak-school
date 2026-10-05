import { useCallback, useEffect, useRef, useState } from "react";

import { Card } from "../../../../shared/ui/ui";
import type { Metric } from "../../model/dashboard-metrics";

export function DashboardMetricGrid({
  items,
  locale,
  density,
  label,
}: {
  items: Metric[];
  locale: string;
  density: "comfortable" | "compact";
  label: string;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const [showLeftShadow, setShowLeftShadow] = useState(false);
  const [showRightShadow, setShowRightShadow] = useState(false);

  const updateShadows = useCallback(() => {
    const element = scrollRef.current;

    if (!element) return;

    const { scrollWidth, clientWidth } = element;

    // Nothing to scroll
    if (scrollWidth <= clientWidth + 1) {
      setShowLeftShadow(false);
      setShowRightShadow(false);
      return;
    }

    /*
     * RTL scrollLeft behavior differs between browsers.
     * Instead of relying on scrollLeft direction, inspect
     * the actual position of the first and last cards.
     */
    const cards = element.querySelectorAll<HTMLElement>("[data-metric-card]");

    if (!cards.length) return;

    const containerRect = element.getBoundingClientRect();
    const firstRect = cards[0].getBoundingClientRect();
    const lastRect = cards[cards.length - 1].getBoundingClientRect();

    const threshold = 2;

    setShowLeftShadow(lastRect.left < containerRect.left - threshold);

    setShowRightShadow(firstRect.right > containerRect.right + threshold);
  }, []);

  useEffect(() => {
    const element = scrollRef.current;

    if (!element) return;

    updateShadows();

    const resizeObserver = new ResizeObserver(updateShadows);

    resizeObserver.observe(element);

    return () => {
      resizeObserver.disconnect();
    };
  }, [items, updateShadows]);

  return (
    <section aria-label={label} className="relative min-w-0">
      {/* Scroll area */}
      <div
        ref={scrollRef}
        onScroll={updateShadows}
        className="
          -mx-3 flex min-w-0
          snap-x snap-mandatory
          gap-3 overflow-x-auto
          px-3 pb-1
          overscroll-x-contain

          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden

          sm:mx-0
          sm:grid
          sm:grid-cols-2
          sm:overflow-visible
          sm:px-0
          sm:pb-0

          lg:grid-cols-3
          2xl:grid-cols-4
        "
      >
        {items.map((item) => {
          const MetricIcon = item.icon;

          return (
            <Card
              key={item.label}
              data-metric-card
              className={`
                relative
                w-[140px] min-w-[140px]
                shrink-0 snap-start
                overflow-hidden

                border-[rgb(var(--border-subtle))]
                bg-[rgb(var(--surface-card))]
                p-3

                transition-shadow

                sm:w-auto
                sm:min-w-0
                sm:shrink

                ${density === "compact" ? "sm:py-2.5" : ""}
              `}
            >
              {/* Top accent */}
              <span
                aria-hidden="true"
                className={`
                  absolute inset-x-0 top-0 h-1
                  ${metricAccentClass[item.tone]}
                `}
              />

              {/* Label + icon */}
              <div className="flex items-center justify-between gap-2">
                <p
                  className="
                    min-w-0 truncate
                    text-[11px] font-semibold
                    text-slate-500
                    dark:text-slate-400
                    sm:text-xs
                  "
                >
                  {item.label}
                </p>

                <span
                  className={`
                    grid size-6 shrink-0
                    place-items-center rounded-md
                    sm:size-8
                    ${metricToneClass[item.tone]}
                  `}
                >
                  <MetricIcon className="size-3 sm:size-3.5" aria-hidden="true" />
                </span>
              </div>

              {/* Value */}
              <strong
                className="
                  mt-1 block
                  text-lg font-black
                  tabular-nums tracking-tight
                  text-ink
                  sm:text-xl
                "
              >
                {typeof item.value === "number" ? item.value.toLocaleString(locale) : item.value}
              </strong>

              {/* Hint */}
              <p
                className="
                  mt-0.5 truncate
                  text-[10px] leading-4
                  text-slate-400
                  dark:text-slate-500
                  sm:text-xs
                "
              >
                {item.hint}
              </p>
            </Card>
          );
        })}
      </div>

      {/* Left scroll shadow */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute inset-y-0 left-0 z-10
          w-8

          bg-gradient-to-r
          from-black/15
          via-black/5
          to-transparent

          transition-opacity duration-200

          dark:from-black/35
          dark:via-black/10

          sm:hidden

          ${showLeftShadow ? "opacity-100" : "opacity-0"}
        `}
      />

      {/* Right scroll shadow */}
      <div
        aria-hidden="true"
        className={`
          pointer-events-none
          absolute inset-y-0 right-0 z-10
          w-8

          bg-gradient-to-l
          from-black/15
          via-black/5
          to-transparent

          transition-opacity duration-200

          dark:from-black/35
          dark:via-black/10

          sm:hidden

          ${showRightShadow ? "opacity-100" : "opacity-0"}
        `}
      />
    </section>
  );
}

const metricToneClass = {
  green: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",

  blue: "bg-sky-500/10 text-sky-700 dark:text-sky-300",

  amber: "bg-amber-500/10 text-amber-700 dark:text-amber-300",

  red: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
} as const;

const metricAccentClass = {
  green: "bg-emerald-500",
  blue: "bg-sky-500",
  amber: "bg-amber-500",
  red: "bg-rose-500",
} as const;
