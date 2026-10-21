import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScheduleEntry } from "../../../academics/schedule/api/schedule.api";
import { TeacherClassAttendanceSheet } from "./TeacherClassAttendanceSheet";

const {
  getAttendanceParticipantsMock,
  listMyAttendanceAbsenceReviewsMock,
  bulkMarkAttendanceMock,
} = vi.hoisted(() => ({
  getAttendanceParticipantsMock: vi.fn(),
  listMyAttendanceAbsenceReviewsMock: vi.fn(),
  bulkMarkAttendanceMock: vi.fn(),
}));

vi.mock("../../../student-life/attendance/api/attendance.api.ts", () => ({
  getAttendanceParticipants: getAttendanceParticipantsMock,
  listMyAttendanceAbsenceReviews: listMyAttendanceAbsenceReviewsMock,
  bulkMarkAttendance: bulkMarkAttendanceMock,
}));

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    user: { id: "staff" },
    activeRole: "TEACHER",
    context: { activeOrganization: { id: "org-1" } },
  }),
}));

vi.mock("../../../../shared/api/api", () => ({
  api: { openEvents: () => ({ close: vi.fn() }) },
}));

vi.mock("../../../../shared/ui/notifications", () => ({ notify: vi.fn() }));

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

function renderSheet(onOpenChange = vi.fn()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <TeacherClassAttendanceSheet entry={entry} open onOpenChange={onOpenChange} canManage />
    </QueryClientProvider>,
  );
}

afterEach(cleanup);
beforeEach(() =>
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  ),
);

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
    expect(dialog).toHaveClass("max-w-xl");
  });
  it("preserves the selected mark and exact request when retrying a failed save", async () => {
    bulkMarkAttendanceMock.mockClear();
    bulkMarkAttendanceMock
      .mockRejectedValueOnce(new Error("timeout"))
      .mockResolvedValue({ sessionId: "session-1", count: 1 });
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی رضایی" }]);
    listMyAttendanceAbsenceReviewsMock.mockResolvedValue([]);
    const onOpenChange = vi.fn();
    renderSheet(onOpenChange);
    const user = userEvent.setup();
    const group = await screen.findByRole("group", { name: "وضعیت حضور علی رضایی" });
    await user.click(within(group).getByRole("button", { name: "حاضر" }));
    await user.click(screen.getByRole("button", { name: "بررسی و ثبت حضور و غیاب" }));
    expect(bulkMarkAttendanceMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() => expect(screen.getByRole("button", { name: "تأیید و ثبت" })).toBeEnabled());
    expect(onOpenChange).not.toHaveBeenCalled();
    expect(within(group).getByRole("button", { name: "حاضر", hidden: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
    expect(bulkMarkAttendanceMock.mock.calls[1][0]).toEqual(
      bulkMarkAttendanceMock.mock.calls[0][0],
    );
  });
});
