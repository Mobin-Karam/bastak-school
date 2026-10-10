import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import type { ScheduleEntry } from "../../schedule/api/schedule.api";
import { TeacherClassAttendanceSheet } from "./TeacherClassAttendanceSheet";

const { getAttendanceParticipantsMock, listMyAttendanceAbsenceReviewsMock } = vi.hoisted(() => ({
  getAttendanceParticipantsMock: vi.fn(),
  listMyAttendanceAbsenceReviewsMock: vi.fn(),
}));

vi.mock("../../attendance/api/attendance.api", () => ({
  getAttendanceParticipants: getAttendanceParticipantsMock,
  listMyAttendanceAbsenceReviews: listMyAttendanceAbsenceReviewsMock,
  bulkMarkAttendance: vi.fn(),
}));

vi.mock("../../../shared/api/api", () => ({
  api: { openEvents: () => ({ close: vi.fn() }) },
}));

vi.mock("../../../shared/ui/notifications", () => ({ notify: vi.fn() }));

const entry: ScheduleEntry = {
  id: "schedule-1",
  title: "ریاضی دهم",
  weekday: 6,
  startTime: "08:00",
  endTime: "09:30",
  room: "۱۰۱",
  status: "ACTIVE",
  organization: { id: "org-1", name: "مدرسه" },
  classroom: { id: "class-1", name: "دهم الف" },
};

function renderSheet() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TeacherClassAttendanceSheet
        entry={entry}
        open
        onOpenChange={() => undefined}
        canManage
      />
    </QueryClientProvider>,
  );
}

describe("TeacherClassAttendanceSheet", () => {
  it("uses the shared responsive drawer while retaining the roster query", async () => {
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی رضایی" }]);
    listMyAttendanceAbsenceReviewsMock.mockResolvedValue([]);

    renderSheet();

    await waitFor(() => {
      expect(getAttendanceParticipantsMock).toHaveBeenCalledWith("class", "class-1");
    });

    const dialog = screen.getByRole("dialog", { name: "ریاضی دهم" });
    expect(dialog).toBeInTheDocument();
    expect(screen.getByText("08:00 تا 09:30 · ۱۰۱")).toBeInTheDocument();
    expect(await screen.findByText("علی رضایی")).toBeInTheDocument();
    expect(dialog).toHaveClass("md:w-[min(34rem,92vw)]");
  });
});
