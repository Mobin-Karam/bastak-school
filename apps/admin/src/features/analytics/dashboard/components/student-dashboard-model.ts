import { addDays, todayIso } from "../../../../shared/lib/utils";

export type StudentScheduleEntry = {
  id: string;
  title: string;
  weekday: number;
  startTime: string;
  endTime: string;
  room: string;
  className: string | null;
  classId: string | null;
};

export type NextStudentClass = StudentScheduleEntry & {
  date: string;
  startsAt: string;
};

const schoolTime = (now: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Tehran",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).format(now);

const scheduleWeekday = (date: string) => (new Date(`${date}T12:00:00Z`).getUTCDay() + 1) % 7;

/** The school week starts Saturday and all returned timestamps are Tehran time. */
export function studentAttendanceWeek(date: string) {
  return {
    from: addDays(date, -scheduleWeekday(date)),
    to: addDays(date, 6 - scheduleWeekday(date)),
  };
}

export function findNextStudentClass(
  entries: StudentScheduleEntry[] | undefined,
  now = new Date(),
): NextStudentClass | null {
  const today = todayIso("Asia/Tehran");
  const time = schoolTime(now);
  const candidates = (entries ?? []).filter(
    (entry) => entry.startTime > time || entry.weekday !== scheduleWeekday(today),
  );

  for (let offset = 0; offset < 7; offset += 1) {
    const date = addDays(today, offset);
    const weekday = scheduleWeekday(date);
    const dayEntries = candidates
      .filter((entry) => entry.weekday === weekday && (offset > 0 || entry.startTime > time))
      .sort((left, right) => left.startTime.localeCompare(right.startTime));
    const entry = dayEntries[0];
    if (entry) {
      return {
        ...entry,
        date,
        startsAt: new Date(`${date}T${entry.startTime}:00+03:30`).toISOString(),
      };
    }
  }
  return null;
}
