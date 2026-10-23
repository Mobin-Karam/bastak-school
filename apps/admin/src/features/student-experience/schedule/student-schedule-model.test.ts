import { afterEach, describe, expect, it, vi } from "vitest";
import type { ScheduleEntry } from "../../academics/schedule/api/schedule.api";
import { todayIso } from "../../../shared/lib/utils";
import { isCurrentStudentLesson, scheduleWeekdayForIso } from "./student-schedule-model";

afterEach(() => vi.useRealTimers());

describe("student schedule live lesson", () => {
  it("changes status at the lesson's Tehran start and end times", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-22T05:00:00Z"));
    const selectedDate = todayIso();
    const entry = {
      weekday: scheduleWeekdayForIso(selectedDate),
      startTime: "08:00",
      endTime: "09:00",
    } as ScheduleEntry;

    expect(isCurrentStudentLesson(entry, selectedDate, new Date("2026-10-22T04:29:00Z"))).toBe(
      false,
    );
    expect(isCurrentStudentLesson(entry, selectedDate, new Date("2026-10-22T05:00:00Z"))).toBe(
      true,
    );
    expect(isCurrentStudentLesson(entry, selectedDate, new Date("2026-10-22T05:30:00Z"))).toBe(
      false,
    );
  });
});
