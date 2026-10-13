import type {
  TimetableLesson,
  TimetablePeriod,
  TimetableSession,
  TimetableOverride,
} from "@moshaver/api-contract";
import {
  detectTimetableConflicts,
  overlaps,
  occurrencesForRange,
  zonedInstant,
} from "../src/modules/schedule/timetable-domain";
const lesson = (overrides: Partial<TimetableLesson> = {}): TimetableLesson => ({
  id: "a",
  versionId: "v",
  classroomId: "class-a",
  classBookId: "book-a",
  teacherId: "teacher-a",
  periodId: "p",
  locationId: "room-a",
  weekday: 0,
  startTime: "08:00",
  endTime: "09:00",
  startsOn: "2026-01-01",
  endsOn: "2026-02-01",
  title: "نحو",
  classroomName: "اول",
  teacherName: "استاد",
  locationName: "اتاق",
  sectionId: null,
  gradeId: 1,
  periodName: "اول",
  sessionKind: "MORNING",
  ...overrides,
});
const session: TimetableSession = {
  id: "s",
  bellId: "b",
  name: "صبح",
  kind: "MORNING",
  startTime: "07:00",
  endTime: "12:00",
};
const period: TimetablePeriod = {
  id: "p",
  sessionId: "s",
  name: "اول",
  ordinal: 1,
  startTime: "08:00",
  endTime: "09:00",
};
const conflicts = (
  lessons: TimetableLesson[],
  extra: Partial<Parameters<typeof detectTimetableConflicts>[0]> = {},
) =>
  detectTimetableConflicts({
    lessons,
    overrides: [],
    holidays: [],
    availability: [],
    allocations: [],
    periods: [period],
    sessions: [session],
    startsOn: "2026-01-01",
    endsOn: "2026-02-01",
    timeZone: "Asia/Tehran",
    ...extra,
  });
describe("timetable interval and occurrence rules", () => {
  it("keeps a term holiday from canceling lessons in a parallel version", () => {
    const rows = occurrencesForRange(
      [lesson(), lesson({ id: "parallel", versionId: "other" })],
      [],
      [
        {
          id: "holiday",
          termId: "term",
          versionId: "v",
          date: "2026-01-04",
          name: "تعطیل",
        },
      ],
      "2026-01-04",
      "2026-01-04",
      "Asia/Tehran",
    );
    expect(rows.map((r) => [r.id, r.cancelled])).toEqual([
      ["a", true],
      ["parallel", false],
    ]);
  });
  it("uses actual half-open intervals rather than period identity", () => {
    expect(
      overlaps(
        { startTime: "08:00", endTime: "09:00" },
        { startTime: "09:00", endTime: "10:00" },
      ),
    ).toBe(false);
    expect(
      conflicts([
        lesson(),
        lesson({
          id: "b",
          periodId: "another",
          startTime: "08:50",
          endTime: "09:40",
        }),
      ]).map((x) => x.code),
    ).toEqual(
      expect.arrayContaining([
        "CLASS_OVERLAP",
        "TEACHER_OVERLAP",
        "ROOM_OVERLAP",
      ]),
    );
  });
  it("allows shared resources on separate effective dates", () => {
    expect(
      conflicts([
        lesson({ endsOn: "2026-01-10" }),
        lesson({ id: "b", startsOn: "2026-01-11" }),
      ]),
    ).toEqual([]);
  });
  it("handles different morning/afternoon bells", () => {
    expect(
      conflicts(
        [
          lesson(),
          lesson({
            id: "b",
            periodId: "afternoon",
            startTime: "16:00",
            endTime: "16:50",
          }),
        ],
        {
          periods: [
            period,
            {
              ...period,
              id: "afternoon",
              sessionId: "pm",
              startTime: "16:00",
              endTime: "16:50",
            },
          ],
          sessions: [
            session,
            {
              ...session,
              id: "pm",
              kind: "AFTERNOON",
              startTime: "15:00",
              endTime: "19:00",
            },
          ],
        },
      ),
    ).toEqual([]);
  });
  it("marks holidays and cancellations without removing occurrences", () => {
    const holiday = { id: "h", termId: "t", date: "2026-01-04", name: "تعطیل" };
    const rows = occurrencesForRange(
      [lesson()],
      [],
      [holiday],
      "2026-01-04",
      "2026-01-04",
      "Asia/Tehran",
    );
    expect(rows).toHaveLength(1);
    expect(rows[0].cancelled).toBe(true);
    expect(rows[0].changeReason).toBe("تعطیل");
  });
  it("detects conflicts introduced by a one-day substitution", () => {
    const change: TimetableOverride = {
      id: "o",
      lessonId: "b",
      date: "2026-01-04",
      cancelled: false,
      teacherId: "teacher-a",
      reason: "جایگزین",
      changedByName: "مدیر",
      createdAt: "2026-01-01T00:00:00Z",
    };
    expect(
      conflicts(
        [
          lesson(),
          lesson({
            id: "b",
            classroomId: "class-b",
            locationId: "room-b",
            teacherId: "teacher-b",
          }),
        ],
        { overrides: [change] },
      ).some((x) => x.code === "TEACHER_OVERLAP" && x.date === change.date),
    ).toBe(true);
  });
  it("detects teacher unavailability and missing weekly allocations", () => {
    const result = conflicts([lesson()], {
      availability: [
        {
          id: "a",
          organizationId: "org",
          teacherId: "teacher-a",
          weekday: 0,
          startTime: "08:30",
          endTime: "10:00",
          startsOn: "2026-01-01",
          endsOn: "2026-02-01",
          reason: "",
        },
      ],
      allocations: [
        {
          id: "x",
          versionId: "v",
          classroomId: "class-a",
          classBookId: "book-a",
          lessonsPerWeek: 2,
        },
      ],
    });
    expect(result.map((x) => x.code)).toEqual(
      expect.arrayContaining(["TEACHER_UNAVAILABLE", "INCOMPLETE_ALLOCATION"]),
    );
  });
  it("validates IANA wall time and rejects historical DST gaps", () => {
    expect(zonedInstant("2026-01-04", "08:00", "Asia/Tehran")).toBe(
      "2026-01-04T04:30:00.000Z",
    );
    expect(() =>
      zonedInstant("2026-03-08", "02:30", "America/New_York"),
    ).toThrow("NONEXISTENT_LOCAL_TIME");
  });
  it("rejects out-of-session lessons and missing teachers", () => {
    expect(
      conflicts([
        lesson({ teacherId: null, startTime: "06:00", endTime: "07:00" }),
      ]).map((x) => x.code),
    ).toEqual(expect.arrayContaining(["OUTSIDE_SESSION", "UNASSIGNED"]));
  });
});

describe("academic occurrence validation", () => {
  it("rejects a recurrence with no matching day", () => {
    expect(
      conflicts([lesson({ startsOn: "2026-01-05", endsOn: "2026-01-05" })]).map(
        (c) => c.code,
      ),
    ).toContain("NO_OCCURRENCE");
  });
  it("retains each conflict date for overrides", () => {
    const rows = conflicts([lesson(), lesson({ id: "b" })]);
    expect(
      new Set(rows.filter((c) => c.code === "CLASS_OVERLAP").map((c) => c.date))
        .size,
    ).toBeGreaterThan(1);
  });
  it("checks period boundaries inside a wider session", () => {
    expect(
      conflicts([lesson({ startTime: "10:00", endTime: "11:00" })]).map(
        (c) => c.code,
      ),
    ).toContain("OUTSIDE_SESSION");
  });
  it("detects weekly coverage gaps despite a complete template", () => {
    expect(
      conflicts([lesson({ endsOn: "2026-01-10" })], {
        allocations: [
          {
            id: "x",
            versionId: "v",
            classroomId: "class-a",
            classBookId: "book-a",
            lessonsPerWeek: 1,
          },
        ],
      }).some(
        (c) => c.code === "INCOMPLETE_ALLOCATION" && c.date === "2026-01-10",
      ),
    ).toBe(true);
  });
});

describe("bell weekdays and room capacity", () => {
  it("restricts a period to its configured weekdays", () =>
    expect(
      conflicts([lesson()], { periods: [{ ...period, weekdays: [1] }] }).some(
        (c) => c.code === "OUTSIDE_SESSION",
      ),
    ).toBe(true));
  it("checks room capacity against the scoped roster", () =>
    expect(
      conflicts([lesson()], {
        locations: [{ id: "room-a", capacity: 1 }],
        classSizes: { "class-a": 2 },
      }).some((c) => c.code === "ROOM_CAPACITY"),
    ).toBe(true));
});
