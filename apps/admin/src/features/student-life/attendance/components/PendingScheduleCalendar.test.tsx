import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { PendingScheduleCalendar, monthBounds } from "./PendingScheduleCalendar";

describe("PendingScheduleCalendar", () => {
  it("shows the number of unsaved scheduled sessions and selects their day", async () => {
    const user = userEvent.setup();
    const onSelectedDateChange = vi.fn();
    render(
      <PendingScheduleCalendar
        selectedDate="2026-10-12"
        onSelectedDateChange={onSelectedDateChange}
        onMonthChange={vi.fn()}
        candidates={[
          {
            entryId: "entry-1",
            date: "2026-10-14",
            title: "فقه",
            classroomId: "class-1",
            classroomName: "کلاس الف",
            teacherName: "استاد الف",
            subjectName: "فقه",
            startTime: "08:00",
            endTime: "09:00",
          },
          {
            entryId: "entry-2",
            date: "2026-10-14",
            title: "اصول",
            classroomId: "class-1",
            classroomName: "کلاس الف",
            teacherName: "استاد الف",
            subjectName: "اصول",
            startTime: "09:00",
            endTime: "10:00",
          },
        ]}
      />,
    );

    const day = screen.getByRole("gridcell", { name: /۲ جلسه ثبت‌نشده/ });
    await user.click(day);
    expect(onSelectedDateChange).toHaveBeenCalledWith("2026-10-14");
  });

  it("keeps calendar requests bounded to the selected month", () => {
    expect(monthBounds("2026-10-14")).toEqual({ start: "2026-10-01", end: "2026-10-31" });
  });
});
