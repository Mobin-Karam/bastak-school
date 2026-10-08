import { Clock3 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { addDays } from "../../../shared/lib/utils";
import {
  DateNavigator,
  type DateNavigatorDay,
  type DateNavigatorItem,
} from "../../../shared/ui/date-navigator";

type DashboardCalendarProps = {
  value: string;
  onChange: (date: string) => void;
  capabilities: readonly string[];
  schedule?: ReadonlyArray<{
    id: string;
    title: string;
    weekday: number;
    startTime: string;
    endTime: string;
    room: string;
  }>;
  /** Features can inject real schedule, attendance, or reminder data later. */
  itemsForDate?: (date: string) => readonly DateNavigatorItem[];
};

/**
 * Capability-aware dashboard calendar. It intentionally owns no API contract:
 * product features can add real day items through `itemsForDate` without
 * changing the dashboard shell or DateNavigator primitive.
 */
export function DashboardCalendar({
  value,
  onChange,
  schedule = [],
  itemsForDate,
}: DashboardCalendarProps) {
  // First paint is deliberately the selected day plus one date on either side:
  // on a phone the carousel is always a clear three-card control. Once the
  // dashboard is painted, retain the 30-day buffer on both sides for instant
  // native swiping without adding visible cards.
  const [radius, setRadius] = useState(1);
  useEffect(() => {
    const promote = () => setRadius(30);
    if (typeof window === "undefined") return;
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (handle: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      const handle = idleWindow.requestIdleCallback(promote, { timeout: 700 });
      return () => idleWindow.cancelIdleCallback?.(handle);
    }
    const timer = window.setTimeout(promote, 180);
    return () => window.clearTimeout(timer);
  }, []);
  const days = useMemo<readonly DateNavigatorDay[]>(() => {
    const start = addDays(value, -radius);
    return Array.from({ length: radius * 2 + 1 }, (_, index) => {
      const date = addDays(start, index);
      const items = itemsForDate?.(date) ?? scheduleItems(date, schedule);
      return { date, items };
    });
  }, [itemsForDate, radius, schedule, value]);

  return (
    <div className="grid gap-1.5">
      {/* The shell owns the mobile mark. On wider dashboard layouts this small
          brand mark anchors the calendar without consuming workspace height. */}
      <div className="hidden justify-center md:flex" aria-hidden="true">
        <img
          src="/logo-bastak.webp"
          width={240}
          height={96}
          alt=""
          decoding="async"
          className="h-16 w-auto object-contain lg:h-20"
        />
      </div>
      <DateNavigator
        value={value}
        onChange={onChange}
        days={days}
        ariaLabel="تقویم و برنامه‌های در دسترس"
      />
    </div>
  );
}

function scheduleItems(
  date: string,
  schedule: ReadonlyArray<{
    id: string;
    title: string;
    weekday: number;
    startTime: string;
    endTime: string;
    room: string;
  }>,
): readonly DateNavigatorItem[] {
  const weekday = new Date(`${date}T12:00:00`).getDay();
  return schedule
    .filter((entry) => entry.weekday === weekday)
    .slice(0, 2)
    .map((entry) => ({
      id: entry.id,
      label: entry.title,
      description: `${entry.startTime} تا ${entry.endTime}${entry.room ? ` · ${entry.room}` : ""}`,
      icon: Clock3,
      tone: "brand" as const,
    }));
}
