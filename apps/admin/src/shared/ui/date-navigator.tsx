import { useCallback, useEffect, useRef, useState, type ElementType, type ReactNode } from "react";
import { CalendarDays, type LucideProps } from "lucide-react";
import { addDays, cn, todayIso } from "../lib/utils";
import { useLocale } from "./locale";

export type DateNavigatorTone = "brand" | "success" | "warning" | "danger" | "neutral";

export type DateNavigatorItem = {
  id: string;
  label: string;
  description?: string;
  /** Lucide icons work directly; any compatible SVG icon component may be supplied. */
  icon?: ElementType<LucideProps>;
  tone?: DateNavigatorTone;
};

export type DateNavigatorDay = {
  date: string;
  items?: readonly DateNavigatorItem[];
  disabled?: boolean;
  /** Replaces the built-in card body for feature-specific data shapes. */
  render?: (context: DateNavigatorRenderContext) => ReactNode;
};

export type DateNavigatorRenderContext = {
  date: string;
  selected: boolean;
  today: boolean;
  items: readonly DateNavigatorItem[];
  label: string;
};

export type DateNavigatorProps = {
  value: string;
  onChange: (date: string) => void;
  days?: readonly DateNavigatorDay[];
  view?: "day" | "week" | "month";
  onPrevious?: () => void;
  onNext?: () => void;
  onToday?: () => void;
  className?: string;
  ariaLabel?: string;
};

const toneClasses: Record<DateNavigatorTone, string> = {
  brand: "bg-brand/10 text-brand",
  success: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  warning: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  danger: "bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300",
  neutral: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-200",
};

/**
 * A presentation-only date navigator. Features own their data and map it into
 * `DateNavigatorDay`, which keeps the calendar reusable for plans, attendance,
 * assessments, reminders, or any future school workflow.
 */
export function DateNavigator({
  value,
  onChange,
  days,
  view = "week",
  onPrevious,
  onNext,
  onToday,
  className,
  ariaLabel,
}: DateNavigatorProps) {
  const { formatDate, profile, language } = useLocale();
  const fallbackDays = buildFallbackDays(value, view);
  const visibleDays = days?.length ? days : fallbackDays;
  const selectedIndex = Math.max(
    0,
    visibleDays.findIndex((day) => day.date === value),
  );
  const dayRail = useRef<HTMLDivElement>(null);
  const settleTimer = useRef<number | null>(null);
  const [centeredDate, setCenteredDate] = useState(value);
  const label = ariaLabel ?? (language === "fa" ? "ناوبری تاریخ" : "Date navigation");

  const nearestDay = useCallback(
    (commit = false) => {
      const rail = dayRail.current;
      if (!rail) return;
      const railBox = rail.getBoundingClientRect();
      const center = railBox.left + railBox.width / 2;
      const cards = Array.from(rail.querySelectorAll<HTMLElement>("[data-date-card]"));
      if (!cards.length) return;
      let closest: { date: string; distance: number } | undefined;
      for (const card of cards) {
        const box = card.getBoundingClientRect();
        const distance = Math.abs(box.left + box.width / 2 - center);
        if (!closest || distance < closest.distance) {
          closest = { date: card.dataset.date ?? "", distance };
        }
      }
      if (closest?.date) {
        setCenteredDate(closest.date);
        if (commit && closest.date !== value) onChange(closest.date);
      }
    },
    [onChange, value],
  );

  const scheduleCenterCheck = useCallback(() => {
    if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    // Do not rerender the buffered 61 cards on every touch-scroll frame. The
    // browser performs the carousel motion; React commits only after native
    // scroll snapping settles on a date.
    settleTimer.current = window.setTimeout(() => nearestDay(true), 110);
  }, [nearestDay]);

  // Native horizontal scrolling keeps the navigator responsive on low-end
  // phones. scrollIntoView handles RTL scroll origins correctly; direct
  // scrollLeft calculations leave the selected date off-screen in Safari and
  // several Android WebViews.
  useEffect(() => {
    const rail = dayRail.current;
    const selected = rail?.querySelector<HTMLElement>("[aria-current='date']");
    if (!rail || !selected) return;
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    if (typeof selected.scrollIntoView !== "function") return;
    selected.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: reducedMotion ? "auto" : "smooth",
    });
    setCenteredDate(value);
    const timer = window.setTimeout(() => nearestDay(false), reducedMotion ? 0 : 110);
    return () => window.clearTimeout(timer);
  }, [nearestDay, selectedIndex, value]);

  useEffect(
    () => () => {
      if (settleTimer.current !== null) window.clearTimeout(settleTimer.current);
    },
    [],
  );

  const centerDate = (date: string, behavior: ScrollBehavior = "smooth") => {
    const card = Array.from(
      dayRail.current?.querySelectorAll<HTMLElement>("[data-date-card]") ?? [],
    ).find((candidate) => candidate.dataset.date === date);
    if (card && typeof card.scrollIntoView === "function") {
      card.scrollIntoView({ block: "nearest", inline: "center", behavior });
    }
  };

  const selectDate = (date: string) => {
    setCenteredDate(date);
    const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
    centerDate(date, reducedMotion ? "auto" : "smooth");
    onChange(date);
  };

  const selectToday = () => {
    const date = todayIso(profile.timeZone);
    if (onToday) {
      setCenteredDate(date);
      onToday();
      return;
    }
    selectDate(date);
  };

  const moveByKeyboard = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Home") {
      event.preventDefault();
      selectToday();
      return;
    }
    if (event.key === "PageUp") {
      event.preventDefault();
      onPrevious?.();
      return;
    }
    if (event.key === "PageDown") {
      event.preventDefault();
      onNext?.();
      return;
    }
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    const index = Math.max(
      0,
      visibleDays.findIndex((day) => day.date === centeredDate),
    );
    // RTL places later dates visually to the left, while the source list stays
    // chronological. Keep arrow keys aligned with that visual chronology.
    const forward =
      profile.direction === "rtl" ? event.key === "ArrowLeft" : event.key === "ArrowRight";
    const candidate = visibleDays[index + (forward ? 1 : -1)];
    if (!candidate || candidate.disabled) return;
    selectDate(candidate.date);
  };

  return (
    <section
      className={cn("w-full min-w-0 max-w-full", className)}
      aria-label={label}
      dir={profile.direction}
    >
      <div
        ref={dayRail}
        role="listbox"
        tabIndex={0}
        onKeyDown={moveByKeyboard}
        onScroll={scheduleCenterCheck}
        className={cn(
          "flex w-full min-w-0 snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-[calc((100%_-_((100%_-_1rem)_/_3))_/_2)] pb-2 pt-2 outline-none [scrollbar-width:none] focus-visible:ring-2 focus-visible:ring-brand/60 [&::-webkit-scrollbar]:hidden md:px-[calc((100%_-_7rem)_/_2)]",
          view === "month" && "md:px-[calc((100%_-_7rem)_/_2)]",
        )}
      >
        {visibleDays.map((day, index) => {
          const selected = day.date === centeredDate;
          const distanceFromCenter = Math.min(1, Math.abs(index - selectedIndex) / 2);
          const isToday = day.date === todayIso(profile.timeZone);
          const items = day.items ?? [];
          const context: DateNavigatorRenderContext = {
            date: day.date,
            selected,
            today: isToday,
            items,
            label: formatDate(day.date, { weekday: "long", day: "numeric", month: "long" }),
          };
          return (
            <button
              type="button"
              key={day.date}
              data-date-card
              data-date={day.date}
              disabled={day.disabled}
              role="option"
              aria-selected={selected}
              aria-current={selected ? "date" : undefined}
              aria-label={context.label}
              onClick={() => selectDate(day.date)}
              className={cn(
                "group relative min-h-[6.5rem] shrink-0 snap-center snap-always overflow-hidden rounded-2xl border px-1.5 py-2 text-center outline-none transition-[transform,background-color,border-color,box-shadow,opacity] duration-200 ease-out focus-visible:ring-2 focus-visible:ring-brand motion-reduce:transition-none md:!min-h-32 md:!w-28 md:!min-w-28 md:!max-w-28 md:px-2",
                selected
                  ? "z-20 border-teal-300/70 bg-[linear-gradient(145deg,#2dd4bf,#0f9488_58%,#0d766f)] text-white shadow-[0_14px_25px_rgb(13_118_111_/_34%),inset_0_1px_0_rgb(255_255_255_/_42%),inset_0_-5px_0_rgb(4_89_85_/_42%)]"
                  : "z-10 border-slate-600/60 bg-[linear-gradient(145deg,#173d57,#0a2436_70%,#061b2a)] text-slate-100 shadow-[0_7px_14px_rgb(7_25_39_/_22%),inset_0_1px_0_rgb(255_255_255_/_14%),inset_0_-4px_0_rgb(2_13_22_/_40%)] hover:border-teal-300/50",
                day.disabled && "cursor-not-allowed opacity-50",
              )}
              style={{
                scrollSnapAlign: "center",
                scrollSnapStop: "always",
                // Do not rely on a percentage flex basis here: a few Android
                // WebViews resolve it against the rail's scroll width and
                // squeeze every buffered day onto the screen. This viewport
                // width consistently leaves room for only three mobile cards.
                width: "calc((100vw - 3rem) / 3)",
                minWidth: "calc((100vw - 3rem) / 3)",
                maxWidth: "calc((100vw - 3rem) / 3)",
                transform: `translateY(${selected ? -6 : -Math.round((1 - distanceFromCenter) * 3)}px) scale(${selected ? 1.1 : 0.9 + (1 - distanceFromCenter) * 0.05})`,
                opacity: selected ? 1 : 0.65 + (1 - distanceFromCenter) * 0.15,
              }}
            >
              {selected ? (
                <span className="absolute inset-x-3 top-0 h-0.5 rounded-b-full bg-white/80" />
              ) : null}
              {isToday && !selected ? (
                <span
                  className="absolute end-2 top-2 size-1.5 rounded-full bg-brand"
                  aria-hidden="true"
                />
              ) : null}
              <span
                className={cn(
                  "block text-[11px] font-semibold",
                  selected ? "text-white/80" : "text-slate-200/80",
                )}
              >
                {datePart(day.date, profile, { weekday: "short" })}
              </span>
              <span className="mt-1 block text-2xl font-black leading-none">
                {datePart(day.date, profile, { day: "numeric" })}
              </span>
              <span
                className={cn(
                  "mt-1 block text-[10px]",
                  selected ? "text-white/80" : "text-slate-200/75",
                )}
              >
                {datePart(day.date, profile, { month: "short" })}
              </span>
              {day.render ? (
                <span className="mt-2 block">{day.render(context)}</span>
              ) : items.length ? (
                <span className="mt-2 flex flex-wrap justify-center gap-1">
                  {items.slice(0, 2).map((item) => {
                    const Icon = item.icon;
                    return (
                      <span
                        key={item.id}
                        className={cn(
                          "inline-flex max-w-full items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                          selected ? "bg-white/20 text-white" : toneClasses[item.tone ?? "neutral"],
                        )}
                        title={item.description ?? item.label}
                      >
                        {Icon ? <Icon size={11} strokeWidth={2.25} /> : null}
                        <span className="max-w-[4rem] truncate">{item.label}</span>
                      </span>
                    );
                  })}
                  {items.length > 2 ? (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.5 text-[10px] font-bold",
                        selected ? "bg-white/20" : "bg-slate-100 text-slate-600",
                      )}
                    >
                      +{items.length - 2}
                    </span>
                  ) : null}
                </span>
              ) : index === selectedIndex ? (
                <span
                  className={cn(
                    "mt-3 inline-flex size-5 items-center justify-center rounded-full",
                    selected ? "bg-white/20" : "bg-brand/10 text-brand",
                  )}
                >
                  <CalendarDays size={12} aria-hidden="true" />
                </span>
              ) : null}
            </button>
          );
        })}
      </div>
      <div className="-mt-0.5 flex justify-center pb-1">
        <button
          type="button"
          onClick={selectToday}
          className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-teal-200 bg-white/90 px-3.5 text-xs font-black text-teal-800 shadow-[0_8px_16px_-12px_rgba(13,118,111,.55),inset_0_1px_0_rgba(255,255,255,.96)] transition hover:-translate-y-0.5 hover:bg-teal-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 motion-reduce:transition-none dark:border-teal-400/20 dark:bg-teal-950/60 dark:text-teal-100 dark:hover:bg-teal-900/70"
        >
          <CalendarDays size={15} aria-hidden="true" /> امروز
        </button>
      </div>
    </section>
  );
}

function buildFallbackDays(value: string, view: "day" | "week" | "month"): DateNavigatorDay[] {
  if (view === "day") return [{ date: value }];
  const size = view === "month" ? 35 : 7;
  const start = view === "month" ? addDays(value, -17) : addDays(value, -3);
  return Array.from({ length: size }, (_, index) => ({ date: addDays(start, index) }));
}

function datePart(
  date: string,
  profile: { locale: string; calendar: string; timeZone: string },
  options: Intl.DateTimeFormatOptions,
) {
  return new Intl.DateTimeFormat(`${profile.locale}-u-ca-${profile.calendar}`, {
    timeZone: profile.timeZone,
    ...options,
  }).format(new Date(`${date}T12:00:00`));
}
