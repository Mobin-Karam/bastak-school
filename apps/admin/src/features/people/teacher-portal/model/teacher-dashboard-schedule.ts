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
