import { describe, expect, it } from "vitest";
import {
  activeEntriesForTehranToday,
  nextTeacherScheduleEntry,
  tehranSchoolWeekday,
} from "./teacher-dashboard-schedule";
import type { ScheduleEntry } from "../../../academics/schedule/api/schedule.api";

const entry = (weekday: number): ScheduleEntry => ({
  id: `lesson-${weekday}`,
  title: "آزمون",
  weekday,
  startTime: "08:00",
  endTime: "09:00",
  room: "۱۰۱",
  status: "ACTIVE",
  organization: { id: "school-a", name: "مدرسه" },
});

describe("teacher dashboard schedule", () => {
  it("maps Tehran days to the Saturday-first school week", () => {
    expect(tehranSchoolWeekday(new Date("2026-10-24T12:00:00.000Z"))).toBe(0); // Saturday
    expect(tehranSchoolWeekday(new Date("2026-10-25T12:00:00.000Z"))).toBe(1); // Sunday
    expect(tehranSchoolWeekday(new Date("2026-10-30T12:00:00.000Z"))).toBe(6); // Friday
  });

  it("shows only active sessions assigned for Tehran today", () => {
    const archived = { ...entry(1), id: "archived", status: "ARCHIVED" as const };
    expect(
      activeEntriesForTehranToday(
        [entry(0), entry(1), archived],
        new Date("2026-10-25T12:00:00.000Z"),
      ).map((item) => item.id),
    ).toEqual(["lesson-1"]);
  });

  it("moves the next lesson to tomorrow after today's final class", () => {
    const next = nextTeacherScheduleEntry(
      [
        { ...entry(0), id: "today", startTime: "08:00", endTime: "09:00" },
        { ...entry(1), id: "tomorrow", startTime: "07:30", endTime: "08:30" },
      ],
      new Date("2026-10-24T07:00:00.000Z"), // 10:30 Tehran on Saturday
    );
    expect(next).toMatchObject({ entry: { id: "tomorrow" }, dayOffset: 1 });
  });
});
