import { describe, expect, it } from "vitest";
import type { ScheduleEntry } from "../../academics/schedule/api/schedule.api";
import {
  addStudentScheduleDays,
  entriesForStudentDay,
  formatStudentScheduleDate,
  isCurrentStudentLesson,
  scheduleWeekdayForIso,
  schoolTodayIso,
  shiftStudentScheduleMonth,
  studentScheduleDateForWeekday,
} from "./student-schedule-model";

const lesson = (overrides: Partial<ScheduleEntry> = {}) =>
  ({
    id: "test",
    title: "درس",
    weekday: 5,
    startTime: "08:00",
    endTime: "09:00",
    room: "A",
    status: "ACTIVE" as const,
    organization: { id: "org", name: "مدرسه" },
    ...overrides,
  }) satisfies ScheduleEntry;

describe("student schedule calendar", () => {
  it("uses Tehran rather than browser timezone for today", () => {
    expect(schoolTodayIso(new Date("2026-10-22T21:00:00Z"))).toBe("2026-10-23");
    expect(schoolTodayIso(new Date("2026-10-22T04:00:00Z"))).toBe("2026-10-22");
  });

  it("uses Saturday=0 and resolves dates within the Saturday-Friday week", () => {
    expect(scheduleWeekdayForIso("2026-10-24")).toBe(0);
    expect(scheduleWeekdayForIso("2026-10-23")).toBe(6);
    expect(studentScheduleDateForWeekday("2026-10-22", 0)).toBe("2026-10-17");
    expect(studentScheduleDateForWeekday("2026-10-22", 6)).toBe("2026-10-23");
    expect(addStudentScheduleDays("2026-12-31", 1)).toBe("2027-01-01");
  });

  it("keeps Persian dates formatted in Persian", () => {
    expect(formatStudentScheduleDate("2026-03-21", { month: "long" })).toContain("فروردین");
  });

  it("preserves the day when shifting Persian months", () => {
    // 1405/01/15 => 1405/02/15; reverse to original.
    const start = "2026-04-04";
    const next = shiftStudentScheduleMonth(start, 1);
    expect(formatStudentScheduleDate(next, { month: "long" })).toContain("اردیبهشت");
    expect(shiftStudentScheduleMonth(next, -1)).toBe(start);
  });

  it("clamps day 31 when moving into a 30-day Persian month", () => {
    // 1405/06/31 -> 1405/07/30.
    const next = shiftStudentScheduleMonth("2026-09-22", 1);
    expect(formatStudentScheduleDate(next, { day: "numeric", month: "long" })).toContain("۳۰ مهر");
  });
});

describe("student schedule lesson entries", () => {
  it("filters archived and unrelated days and sorts by start time", () => {
    const entries = [
      lesson({ id: "later", startTime: "11:00" }),
      lesson({ id: "archived", status: "ARCHIVED" }),
      lesson({ id: "other", weekday: 4 }),
      lesson({ id: "earlier", startTime: "08:00" }),
    ];
    expect(entriesForStudentDay(entries, 5).map((entry) => entry.id)).toEqual(["earlier", "later"]);
    expect(entries.map((entry) => entry.id)[0]).toBe("later");
  });

  it("changes status at the Tehran lesson start and end boundaries", () => {
    const date = "2026-10-22";
    const entry = lesson();
    expect(isCurrentStudentLesson(entry, date, new Date("2026-10-22T04:29:00Z"))).toBe(false);
    expect(isCurrentStudentLesson(entry, date, new Date("2026-10-22T04:30:00Z"))).toBe(true);
    expect(isCurrentStudentLesson(entry, date, new Date("2026-10-22T05:00:00Z"))).toBe(true);
    expect(isCurrentStudentLesson(entry, date, new Date("2026-10-22T05:30:00Z"))).toBe(false);
  });

  it("never marks inactive, future, wrong-weekday or invalid lessons live", () => {
    const now = new Date("2026-10-22T05:00:00Z");
    expect(isCurrentStudentLesson(lesson({ status: "ARCHIVED" }), "2026-10-22", now)).toBe(false);
    expect(isCurrentStudentLesson(lesson(), "2026-10-29", now)).toBe(false);
    expect(isCurrentStudentLesson(lesson({ weekday: 4 }), "2026-10-22", now)).toBe(false);
    expect(isCurrentStudentLesson(lesson({ startTime: "invalid" }), "2026-10-22", now)).toBe(false);
  });

  it("switches days exactly at midnight in Tehran", () => {
    const entry = lesson({ weekday: 6, startTime: "00:00", endTime: "00:30" });
    expect(isCurrentStudentLesson(entry, "2026-10-23", new Date("2026-10-22T20:29:00Z"))).toBe(
      false,
    );
    expect(isCurrentStudentLesson(entry, "2026-10-23", new Date("2026-10-22T20:30:00Z"))).toBe(
      true,
    );
  });
});
