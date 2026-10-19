import {
  Bell,
  CalendarCheck2,
  ChevronDown,
  CircleAlert,
  Clock3,
  Coins,
  GraduationCap,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";
import type { AdminPerformanceProfile } from "../../../app/layout/lib/device-performance";
import { useFloatingIsland } from "./FloatingIslandProvider";
import type { FloatingIslandActivity, FloatingIslandKind } from "./island.types";

const activityIcons: Record<FloatingIslandKind, typeof Bell> = {
  notification: Bell,
  system: CircleAlert,
  attendance: CalendarCheck2,
  class: GraduationCap,
  prayer: Clock3,
  reward: Coins,
};

function primaryActivity(activities: readonly FloatingIslandActivity[]) {
  return [...activities].sort(
    (left, right) => right.priority - left.priority || left.id.localeCompare(right.id),
  )[0];
}

export function FloatingIslandViewport({
  direction,
  performance,
}: {
  direction: "rtl" | "ltr";
  performance: AdminPerformanceProfile;
}) {
  const island = useFloatingIsland();
  const ref = useRef<HTMLDivElement>(null);
  const activity = useMemo(() => primaryActivity(island.activities), [island.activities]);
  const expanded = activity ? island.expandedId === activity.id : false;

  useEffect(() => {
    if (!expanded) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") island.collapse();
    };
    const onPointerDown = (event: PointerEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) island.collapse();
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [expanded, island]);

  if (!activity) return null;
  const Icon = activityIcons[activity.kind];
  const compactLabel = activity.description
    ? `${activity.title}، ${activity.description}`
    : activity.title;

  return (
    <div
      className="pointer-events-none fixed inset-x-3 top-[max(0.5rem,env(safe-area-inset-top))] z-40 flex justify-center"
      dir={direction}
    >
      <section
        ref={ref}
        aria-label="وضعیت برنامه"
        className={cn(
          "floating-island pointer-events-auto overflow-hidden rounded-[1.35rem] border border-[rgb(var(--glass-border))] bg-[rgb(var(--glass-bg-strong))] text-ink shadow-[var(--glass-shadow)] transition-[width,max-height,transform,background-color] duration-300 ease-out motion-reduce:transition-none",
          performance === "enhanced" && "backdrop-blur-xl",
          performance === "standard" && "backdrop-blur-md",
          expanded
            ? "w-[min(24rem,calc(100vw-1.5rem))] max-h-64"
            : "w-fit max-w-[min(18rem,calc(100vw-1.5rem))] max-h-12",
        )}
      >
        <button
          type="button"
          aria-expanded={expanded}
          aria-controls={`floating-island-${activity.id}`}
          onClick={() => (expanded ? island.collapse() : island.expand(activity.id))}
          className="flex min-h-11 w-full items-center gap-2 px-3 text-start outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-inset"
        >
          <span className="grid size-7 shrink-0 place-items-center rounded-full bg-brand/12 text-brand">
            <Icon size={16} aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1 truncate text-xs font-black">{compactLabel}</span>
          <ChevronDown
            className={cn(
              "shrink-0 transition-transform duration-300 motion-reduce:transition-none",
              expanded && "rotate-180",
            )}
            size={16}
            aria-hidden="true"
          />
        </button>
        <div
          id={`floating-island-${activity.id}`}
          hidden={!expanded}
          className="grid gap-3 border-t border-[rgb(var(--glass-border))] px-3 pb-3 pt-3"
        >
          <div className="flex gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/12 text-brand">
              <Icon size={19} aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-black">{activity.title}</h2>
              {activity.description ? (
                <p className="mt-1 text-xs leading-5 text-slate-600 dark:text-slate-300">
                  {activity.description}
                </p>
              ) : null}
            </div>
          </div>
          <div className="flex items-center justify-end gap-2">
            {activity.dismissible ? (
              <button
                type="button"
                onClick={() => island.dismiss(activity.id)}
                className="grid size-9 place-items-center rounded-lg text-slate-500 outline-none hover:bg-black/5 focus-visible:ring-2 focus-visible:ring-brand dark:hover:bg-white/10"
                aria-label="بستن اعلان"
              >
                <X size={16} aria-hidden="true" />
              </button>
            ) : null}
            {activity.action ? (
              <Link
                to={activity.action.to}
                onClick={island.collapse}
                className="rounded-lg bg-brand px-3 py-2 text-xs font-black text-white outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
              >
                {activity.action.label}
              </Link>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
