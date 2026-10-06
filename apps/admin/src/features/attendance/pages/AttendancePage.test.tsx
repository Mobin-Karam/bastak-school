import { render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendancePage } from "./AttendancePage";

const { listAttendanceSessionsMock, listAttendanceContextsMock, getAttendanceParticipantsMock, bulkMarkAttendanceMock } = vi.hoisted(() => ({
  listAttendanceSessionsMock: vi.fn(),
  listAttendanceContextsMock: vi.fn(),
  getAttendanceParticipantsMock: vi.fn(),
  bulkMarkAttendanceMock: vi.fn(),
}));

vi.mock("../api/attendance.api", () => ({
  listAttendanceSessions: listAttendanceSessionsMock,
  listAttendanceContexts: listAttendanceContextsMock,
  getAttendanceParticipants: getAttendanceParticipantsMock,
  bulkMarkAttendance: bulkMarkAttendanceMock,
}));

describe("AttendancePage", () => {
  beforeEach(() => {
    listAttendanceSessionsMock.mockResolvedValue([]);
    listAttendanceContextsMock.mockResolvedValue([]);
    getAttendanceParticipantsMock.mockResolvedValue([]);
    bulkMarkAttendanceMock.mockResolvedValue({ sessionId: "mock-session", count: 0 });
  });

  it("renders the V1 attendance layout without falling back to mock student names", async () => {
    render(<AttendancePage />);

    await waitFor(() => {
      expect(screen.getByText("حضور و غیاب")).toBeInTheDocument();
    });

    expect(screen.getByText("فهرست طلبه‌ها")).toBeInTheDocument();
    expect(screen.queryByText("احمد محمدی")).not.toBeInTheDocument();
    expect(screen.getByText(/هیچ کلاسی برای این سازمان ثبت نشده است/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "همه حاضر" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ذخیره تغییرات" })).toBeInTheDocument();
  });
});
