import { describe, expect, it, vi } from "vitest";
import { findNextStudentClass, studentAttendanceWeek } from "./student-dashboard-model";

describe("student dashboard schedule model", () => {
  it("uses Saturday as the beginning of the attendance week", () => {
    expect(studentAttendanceWeek("2026-10-30")).toEqual({
      from: "2026-10-24",
      to: "2026-10-30",
    });
  });

  it("selects the next upcoming class, including the next school day", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-30T08:45:00+03:30"));
    expect(
      findNextStudentClass([
        {
          id: "today-past",
          title: "جلسه گذشته",
          weekday: 6,
          startTime: "08:00",
          endTime: "08:45",
          room: "",
          className: "دهم",
          classId: "class-1",
        },
        {
          id: "tomorrow",
          title: "کلاس فردا",
          weekday: 0,
          startTime: "09:00",
          endTime: "10:00",
          room: "۱۰۱",
          className: "دهم",
          classId: "class-1",
        },
      ]),
    ).toMatchObject({ id: "tomorrow", date: "2026-10-31" });
    vi.useRealTimers();
  });
});
