export const defaultAttendanceTimeZone = "Asia/Tehran";
export const defaultOperationalDayStart = "04:00";

export function validateTimeZone(timeZone: string): void {
  new Intl.DateTimeFormat("en", { timeZone }).format(new Date(0));
}

export function parseSchoolTime(time: string): {
  hour: number;
  minute: number;
} {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time))
    throw new RangeError("Invalid school time");
  const [hour, minute] = time.split(":").map(Number);
  return { hour, minute };
}

function calendarInstant(date: string): Date {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new RangeError("Invalid calendar date");
  const [year, month, day] = date.split("-").map(Number);
  const instant = new Date(0);
  instant.setUTCFullYear(year, month - 1, day);
  instant.setUTCHours(0, 0, 0, 0);
  if (
    year < 1 ||
    instant.getUTCFullYear() !== year ||
    instant.getUTCMonth() !== month - 1 ||
    instant.getUTCDate() !== day
  )
    throw new RangeError("Invalid calendar date");
  return instant;
}

export function shiftSchoolDate(date: string, days: number): string {
  if (!Number.isInteger(days)) throw new RangeError("Invalid day offset");
  const instant = calendarInstant(date);
  instant.setUTCDate(instant.getUTCDate() + days);
  return instant.toISOString().slice(0, 10);
}

function schoolParts(instant: Date, timeZone: string) {
  if (!Number.isFinite(instant.getTime()))
    throw new RangeError("Invalid attendance instant");
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone,
    calendar: "gregory",
    numberingSystem: "latn",
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(instant);
  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)!.value);
  const year = value("year"),
    month = value("month"),
    day = value("day");
  return {
    year,
    month,
    day,
    hour: value("hour"),
    minute: value("minute"),
    second: value("second"),
    date: `${String(year).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
  };
}

export function schoolCalendarDate(
  instant: Date,
  timeZone = defaultAttendanceTimeZone,
): string {
  return schoolParts(instant, timeZone).date;
}

/** A new operational day changes selection; it never deletes attendance or cases. */
export function operationalDate(
  instant: Date,
  timeZone = defaultAttendanceTimeZone,
  dayStartsAt = defaultOperationalDayStart,
): string {
  const local = schoolParts(instant, timeZone);
  const start = parseSchoolTime(dayStartsAt);
  return local.hour * 60 + local.minute < start.hour * 60 + start.minute
    ? shiftSchoolDate(local.date, -1)
    : local.date;
}

/**
 * Resolve a Gregorian school-local wall time without using the server timezone.
 * A missing DST wall time is rejected; a repeated wall time uses its first instant.
 * Occurrence IDs use the schedule and calendar date, so a DST fold cannot duplicate.
 */
export function schoolLocalInstant(
  date: string,
  time: string,
  timeZone = defaultAttendanceTimeZone,
): Date {
  const desired = calendarInstant(date);
  const { hour, minute } = parseSchoolTime(time);
  desired.setUTCHours(hour, minute, 0, 0);
  const offsets = new Set<number>();
  for (const hours of [-48, -24, 0, 24, 48]) {
    const probe = new Date(desired.getTime() + hours * 3600000);
    const parts = schoolParts(probe, timeZone);
    const local = calendarInstant(parts.date);
    local.setUTCHours(parts.hour, parts.minute, parts.second, 0);
    offsets.add(local.getTime() - probe.getTime());
  }
  const candidates = [...offsets]
    .map((offset) => new Date(desired.getTime() - offset))
    .filter((candidate) => {
      const parts = schoolParts(candidate, timeZone);
      return (
        parts.date === date && parts.hour === hour && parts.minute === minute
      );
    })
    .sort((a, b) => a.getTime() - b.getTime());
  if (!candidates.length)
    throw new RangeError("This local school time does not exist");
  return candidates[0];
}

export function schoolWeekday(date: string): number {
  return calendarInstant(date).getUTCDay();
}
