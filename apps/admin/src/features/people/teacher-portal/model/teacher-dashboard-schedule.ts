import type { ScheduleEntry } from "../../../academics/schedule/api/schedule.api";

const schoolWeekdayByEnglishShortName: Record<string, number> = {
  sat: 0,
  sun: 1,
  mon: 2,
  tue: 3,
  wed: 4,
  thu: 5,
  fri: 6,
};

/** Schedule weekday 0 is Saturday, evaluated in the school's Tehran timezone. */
export function tehranSchoolWeekday(date: Date): number {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tehran",
    weekday: "short",
  })
    .format(date)
    .toLowerCase()
    .slice(0, 3);
  return schoolWeekdayByEnglishShortName[weekday] ?? -1;
}

export function activeEntriesForTehranToday(entries: ScheduleEntry[], now: Date): ScheduleEntry[] {
  const weekday = tehranSchoolWeekday(now);
  return entries.filter((entry) => entry.status === "ACTIVE" && entry.weekday === weekday);
}

/** Finds the next assigned weekly lesson in Tehran time, including the next school day. */
export function nextTeacherScheduleEntry(
  entries: ScheduleEntry[],
  now: Date,
): {
  entry: ScheduleEntry;
  dayOffset: number;
} | null {
  const currentWeekday = tehranSchoolWeekday(now);
  const currentMinute = Number(
    new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    })
      .format(now)
      .replace(":", ""),
  );
  const currentMinutes = Math.floor(currentMinute / 100) * 60 + (currentMinute % 100);
  const startMinutes = (entry: ScheduleEntry) => {
    const [hour = "0", minute = "0"] = entry.startTime.split(":");
    return Number(hour) * 60 + Number(minute);
  };

  for (let dayOffset = 0; dayOffset < 7; dayOffset += 1) {
    const weekday = (currentWeekday + dayOffset) % 7;
    const candidates = entries
      .filter(
        (entry) =>
          entry.status === "ACTIVE" &&
          entry.weekday === weekday &&
          (dayOffset > 0 || startMinutes(entry) >= currentMinutes),
      )
      .sort((left, right) => startMinutes(left) - startMinutes(right));
    if (candidates[0]) return { entry: candidates[0], dayOffset };
  }
  return null;
}

export function tehranDateWithOffset(now: Date, dayOffset: number): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Tehran",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  const date = new Date(`${part("year")}-${part("month")}-${part("day")}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + dayOffset);
  return date.toISOString().slice(0, 10);
}
