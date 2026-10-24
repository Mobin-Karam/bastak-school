import type { ScheduleEntry } from "../../academics/schedule/api/schedule.api";

export const SCHOOL_TIME_ZONE = "Asia/Tehran";

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

function isoParts(date: Date, timeZone = SCHOOL_TIME_ZONE) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = (type: string) => parts.find((part) => part.type === type)?.value ?? "";
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function schoolTodayIso(now = new Date()) {
  return isoParts(now);
}

export function scheduleWeekdayForIso(iso: string) {
  const date = new Date(`${iso}T12:00:00Z`);
  return (date.getUTCDay() + 1) % 7;
}

export function addStudentScheduleDays(iso: string, offset: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + offset);
  return date.toISOString().slice(0, 10);
}

export function studentScheduleDateForWeekday(selectedDate: string, weekday: number) {
  return addStudentScheduleDays(selectedDate, weekday - scheduleWeekdayForIso(selectedDate));
}

export function entriesForStudentDay(entries: ScheduleEntry[], weekday: number) {
  return entries
    .filter((entry) => entry.status === "ACTIVE" && entry.weekday === weekday)
    .sort(
      (a, b) =>
        a.startTime.localeCompare(b.startTime) ||
        a.endTime.localeCompare(b.endTime) ||
        a.title.localeCompare(b.title, "fa"),
    );
}

export function formatStudentScheduleDate(iso: string, options: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    ...options,
    timeZone: "UTC",
  }).format(new Date(`${iso}T12:00:00Z`));
}

function persianDateParts(iso: string) {
  const parts = new Intl.DateTimeFormat("en-US-u-ca-persian", {
    timeZone: "UTC",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(new Date(`${iso}T12:00:00Z`));
  const n = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  return { year: n("year"), month: n("month"), day: n("day") };
}

/** Navigate by Persian calendar month, retaining the day or clamping at month end. */
export function shiftStudentScheduleMonth(iso: string, direction: -1 | 1) {
  const current = persianDateParts(iso);
  const targetMonth =
    current.month + direction < 1
      ? 12
      : current.month + direction > 12
        ? 1
        : current.month + direction;
  const targetYear =
    current.year +
    (current.month === 12 && direction === 1 ? 1 : 0) -
    (current.month === 1 && direction === -1 ? 1 : 0);

  const matches: Array<{ iso: string; day: number }> = [];
  for (let offset = 1; offset <= 65; offset++) {
    const candidate = addStudentScheduleDays(iso, offset * direction);
    const parts = persianDateParts(candidate);
    if (parts.year === targetYear && parts.month === targetMonth) {
      matches.push({ iso: candidate, day: parts.day });
    } else if (matches.length) {
      break;
    }
  }
  if (!matches.length) return iso;
  const lastDay = Math.max(...matches.map((part) => part.day));
  return matches.find((part) => part.day === Math.min(current.day, lastDay))?.iso ?? iso;
}

export function isCurrentStudentLesson(
  entry: ScheduleEntry,
  lessonDate: string,
  currentTime = new Date(),
) {
  if (
    entry.status !== "ACTIVE" ||
    lessonDate !== schoolTodayIso(currentTime) ||
    entry.weekday !== scheduleWeekdayForIso(lessonDate)
  )
    return false;
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: SCHOOL_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(currentTime);
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  const nowMinutes = Number(hour) * 60 + Number(minute);
  const minutes = (value: string) => {
    const match = /^(\d{1,2}):(\d{2})(?::\d{2})?$/.exec(value);
    if (!match) return NaN;
    const hours = Number(match[1]);
    const minutes = Number(match[2]);
    return hours < 24 && minutes < 60 ? hours * 60 + minutes : NaN;
  };
  const start = minutes(entry.startTime);
  const end = minutes(entry.endTime);
  return Number.isFinite(start) && Number.isFinite(end) && start <= nowMinutes && nowMinutes < end;
}
