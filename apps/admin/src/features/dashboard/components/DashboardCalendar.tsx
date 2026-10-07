import { Clock3 } from "lucide-react";
import { useMemo } from "react";
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
  schedule?: ReadonlyArray<{ id: string; title: string; weekday: number; startTime: string; endTime: string; room: string }>;
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
  capabilities,
  schedule = [],
  itemsForDate,
}: DashboardCalendarProps) {
  const days = useMemo<readonly DateNavigatorDay[]>(() => {
    const start = addDays(value, -3);
    return Array.from({ length: 7 }, (_, index) => {
      const date = addDays(start, index);
      const items = itemsForDate?.(date) ?? scheduleItems(date, schedule);
      return { date, items };
    });
  }, [capabilities, itemsForDate, schedule, value]);

  return (
    <DateNavigator
      value={value}
      onChange={onChange}
      days={days}
      ariaLabel="تقویم و برنامه‌های در دسترس"
    />
  );
}

function scheduleItems(
  date: string,
  schedule: ReadonlyArray<{ id: string; title: string; weekday: number; startTime: string; endTime: string; room: string }>,
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
