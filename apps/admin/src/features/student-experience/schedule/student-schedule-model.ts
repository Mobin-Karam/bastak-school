import type { ScheduleEntry } from "../../academics/schedule/api/schedule.api";
import { addDays, todayIso } from "../../../shared/lib/utils";

export const studentScheduleWeekdays = [
  "شنبه",
  "یکشنبه",
  "دوشنبه",
  "سه‌شنبه",
  "چهارشنبه",
  "پنجشنبه",
  "جمعه",
] as const;
export const studentScheduleWeekdayOrder = [0, 1, 2, 3, 4, 5, 6] as const;

export function scheduleWeekdayForIso(iso: string) {
  return (new Date(`${iso}T12:00:00`).getDay() + 1) % 7;
}

export function entriesForStudentDay(entries: ScheduleEntry[], weekday: number) {
  return entries
    .filter((entry) => entry.status === "ACTIVE" && entry.weekday === weekday)
    .sort((left, right) => left.startTime.localeCompare(right.startTime));
}

export function formatStudentScheduleDate(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", { ...options, timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}

export function shiftStudentScheduleMonth(iso: string, direction: -1 | 1) {
  const month = persianMonth(iso);
  let cursor = iso;
  for (let offset = 0; offset < 40; offset += 1) {
    cursor = addDays(cursor, direction);
    if (persianMonth(cursor) !== month) return cursor;
  }
  return iso;
}

export function isCurrentStudentLesson(
  entry: ScheduleEntry,
  selectedDate: string,
  currentTime = new Date(),
) {
  if (selectedDate !== todayIso() || entry.weekday !== scheduleWeekdayForIso(selectedDate))
    return false;
  const now = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(currentTime);
  return entry.startTime <= now && now < entry.endTime;
}

function persianMonth(iso: string) {
  return new Intl.DateTimeFormat("en-u-ca-persian", { month: "numeric", timeZone: "UTC" }).format(
    new Date(`${iso}T12:00:00Z`),
  );
}
