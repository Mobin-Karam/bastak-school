import type {
  TimetableAllocation,
  TimetableAvailability,
  TimetableConflict,
  TimetableHoliday,
  TimetableLesson,
  TimetableOccurrence,
  TimetableOverride,
  TimetablePeriod,
  TimetableSession,
} from "@moshaver/api-contract";

export function canonicalDate(value: string) {
  if (
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) !== value
  )
    throw new Error("INVALID_DATE");
  return value;
}
export function addDays(date: string, days: number) {
  const result = new Date(`${canonicalDate(date)}T12:00:00Z`);
  result.setUTCDate(result.getUTCDate() + days);
  return result.toISOString().slice(0, 10);
}
export function weekdayOf(date: string) {
  return new Date(`${canonicalDate(date)}T12:00:00Z`).getUTCDay();
}
export function minuteOf(time: string) {
  if (!/^([01]\d|2[0-3]):[0-5]\d$/.test(time)) throw new Error("INVALID_TIME");
  const [hour, minute] = time.split(":").map(Number);
  return hour * 60 + minute;
}
export function overlaps(
  a: { startTime: string; endTime: string },
  b: { startTime: string; endTime: string },
) {
  return (
    minuteOf(a.startTime) < minuteOf(b.endTime) &&
    minuteOf(b.startTime) < minuteOf(a.endTime)
  );
}
export function zonedInstant(date: string, time: string, timeZone: string) {
  canonicalDate(date);
  minuteOf(time);
  const format = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const target = Date.parse(`${date}T${time}:00Z`);
  let guess = target;
  for (let attempt = 0; attempt < 4; attempt++) {
    const p = Object.fromEntries(
      format.formatToParts(new Date(guess)).map((x) => [x.type, x.value]),
    );
    const wall = Date.parse(
      `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}:${p.second}Z`,
    );
    const delta = target - wall;
    if (!delta) return new Date(guess).toISOString();
    guess += delta;
  }
  throw new Error("NONEXISTENT_LOCAL_TIME");
}
export function occurrencesForRange(
  lessons: TimetableLesson[],
  overrides: TimetableOverride[],
  holidays: TimetableHoliday[],
  startsOn: string,
  endsOn: string,
  timeZone: string,
): TimetableOccurrence[] {
  canonicalDate(startsOn);
  canonicalDate(endsOn);
  if (
    endsOn < startsOn ||
    Date.parse(endsOn) - Date.parse(startsOn) > 730 * 86400000
  )
    throw new Error("DATE_RANGE_LIMIT");
  const closed = new Set(holidays.map((x) => x.date));
  const exceptions = new Map(
    overrides.map((x) => [`${x.lessonId}:${x.date}`, x]),
  );
  const result: TimetableOccurrence[] = [];
  for (let date = startsOn; date <= endsOn; date = addDays(date, 1))
    for (const lesson of lessons) {
      if (
        date < lesson.startsOn ||
        date > lesson.endsOn ||
        weekdayOf(date) !== lesson.weekday
      )
        continue;
      const change = exceptions.get(`${lesson.id}:${date}`);
      const cancelled = closed.has(date) || change?.cancelled === true;
      const current = {
        ...lesson,
        teacherId: change?.teacherId ?? lesson.teacherId,
        locationId: change?.locationId ?? lesson.locationId,
        startTime: change?.startTime ?? lesson.startTime,
        endTime: change?.endTime ?? lesson.endTime,
      };
      result.push({
        ...current,
        date,
        cancelled,
        changeReason:
          change?.reason ??
          (closed.has(date) ? holidays.find((x) => x.date === date)!.name : ""),
        attendanceSessionId: null,
        startsAt: zonedInstant(date, current.startTime, timeZone),
        endsAt: zonedInstant(date, current.endTime, timeZone),
      });
    }
  return result;
}
export function detectTimetableConflicts(input: {
  lessons: TimetableLesson[];
  overrides: TimetableOverride[];
  holidays: TimetableHoliday[];
  availability: TimetableAvailability[];
  allocations: TimetableAllocation[];
  periods: TimetablePeriod[];
  sessions: TimetableSession[];
  startsOn: string;
  endsOn: string;
  timeZone: string;
}): TimetableConflict[] {
  const conflicts: TimetableConflict[] = [];
  const seen = new Set<string>();
  const push = (conflict: TimetableConflict) => {
    const key = `${conflict.code}:${[...conflict.lessonIds].sort().join(":")}`;
    if (!seen.has(key)) {
      seen.add(key);
      conflicts.push(conflict);
    }
  };
  for (const lesson of input.lessons)
    if (!lesson.teacherId || !lesson.classBookId || !lesson.classroomId)
      push({
        code: "UNASSIGNED",
        lessonIds: [lesson.id],
        message: `درس ${lesson.title} استاد یا کلاس کامل ندارد.`,
        alternatives: ["تکمیل تخصیص استاد و کتاب کلاس"],
      });
  const days = new Map<string, TimetableOccurrence[]>();
  for (const occurrence of occurrencesForRange(
    input.lessons,
    input.overrides,
    input.holidays,
    input.startsOn,
    input.endsOn,
    input.timeZone,
  )) {
    if (occurrence.cancelled) continue;
    const period = input.periods.find((x) => x.id === occurrence.periodId);
    const session = input.sessions.find((x) => x.id === period?.sessionId);
    if (
      !session ||
      minuteOf(occurrence.startTime) < minuteOf(session.startTime) ||
      minuteOf(occurrence.endTime) > minuteOf(session.endTime) ||
      minuteOf(occurrence.endTime) <= minuteOf(occurrence.startTime)
    )
      push({
        code: "OUTSIDE_SESSION",
        lessonIds: [occurrence.id],
        date: occurrence.date,
        message: "زمان درس خارج از نوبت مدرسه است.",
        alternatives: ["انتخاب زنگ یا نوبت مناسب"],
      });
    if (
      input.availability.some(
        (x) =>
          x.teacherId === occurrence.teacherId &&
          x.weekday === weekdayOf(occurrence.date) &&
          x.startsOn <= occurrence.date &&
          x.endsOn >= occurrence.date &&
          overlaps(x, occurrence),
      )
    )
      push({
        code: "TEACHER_UNAVAILABLE",
        lessonIds: [occurrence.id],
        date: occurrence.date,
        message: `استاد ${occurrence.teacherName} در این زمان در دسترس نیست.`,
        alternatives: ["انتخاب استاد آزاد", "تغییر ساعت درس"],
      });
    const group = days.get(occurrence.date) ?? [];
    group.push(occurrence);
    days.set(occurrence.date, group);
  }
  for (const [date, entries] of days) {
    entries.sort((a, b) => a.startTime.localeCompare(b.startTime));
    for (let i = 0; i < entries.length; i++)
      for (
        let j = i + 1;
        j < entries.length && entries[j].startTime < entries[i].endTime;
        j++
      ) {
        const a = entries[i],
          b = entries[j];
        if (!overlaps(a, b)) continue;
        const lessonIds = [a.id, b.id];
        if (a.classroomId === b.classroomId)
          push({
            code: "CLASS_OVERLAP",
            lessonIds,
            date,
            message: `کلاس ${a.classroomName} دو درس هم‌زمان دارد.`,
            alternatives: ["انتقال یکی از درس‌ها به زنگ آزاد"],
          });
        if (a.teacherId && a.teacherId === b.teacherId)
          push({
            code: "TEACHER_OVERLAP",
            lessonIds,
            date,
            message: `استاد ${a.teacherName} هم‌زمان در دو کلاس است.`,
            alternatives: ["انتخاب استاد آزاد", "جابجایی روز یا ساعت"],
          });
        if (a.locationId && a.locationId === b.locationId)
          push({
            code: "ROOM_OVERLAP",
            lessonIds,
            date,
            message: `اتاق ${a.locationName} هم‌زمان اشغال است.`,
            alternatives: ["انتخاب اتاق آزاد", "جابجایی ساعت"],
          });
      }
  }
  for (const target of input.allocations) {
    const count = input.lessons.filter(
      (x) =>
        x.classBookId === target.classBookId &&
        x.classroomId === target.classroomId,
    ).length;
    if (count !== target.lessonsPerWeek)
      push({
        code: "INCOMPLETE_ALLOCATION",
        lessonIds: input.lessons
          .filter((x) => x.classBookId === target.classBookId)
          .map((x) => x.id),
        message: `تخصیص هفتگی: ${count} درس از ${target.lessonsPerWeek} درس مورد نیاز.`,
        alternatives: ["تکمیل درس‌های هفتگی", "بازبینی سهم هفتگی کتاب"],
      });
  }
  return conflicts;
}
