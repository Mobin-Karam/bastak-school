import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AttendancePage } from "./AttendancePage";

const {
  listAttendanceSessionsMock,
  listAttendanceContextsMock,
  getAttendanceParticipantsMock,
  bulkMarkAttendanceMock,
} = vi.hoisted(() => ({
  listAttendanceSessionsMock: vi.fn(),
  listAttendanceContextsMock: vi.fn(),
  getAttendanceParticipantsMock: vi.fn(),
  bulkMarkAttendanceMock: vi.fn(),
}));

vi.mock("../api/attendance.api", () => ({
  contextLabelMap: { class: "کلاس", class_group: "گروه کلاس", dorm: "خوابگاه" },
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
    render(<AttendancePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(screen.getByText("حضور و غیاب")).toBeInTheDocument();
    });

    expect(screen.getByText("برای این مورد طلبه‌ای پیدا نشد.")).toBeInTheDocument();
    expect(screen.queryByText("احمد محمدی")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "همه حاضر" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ثبت حضور" })).toBeInTheDocument();
  });

  it("opens a class selected from the class workspace", async () => {
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "class-1",
        contextType: "class",
        code: "10-A",
        name: "دهم الف",
        label: "دهم الف (10-A)",
        total: 2,
        activeOrganizationId: "org-1",
      },
      {
        id: "class-2",
        contextType: "class",
        code: "10-B",
        name: "دهم ب",
        label: "دهم ب (10-B)",
        total: 2,
        activeOrganizationId: "org-1",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/admin/attendance?contextType=class&contextId=class-2"]}>
        <AttendancePage />
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getAttendanceParticipantsMock).toHaveBeenCalledWith("class", "class-2");
    });
    expect(
      (screen.getByRole("option", { name: "دهم ب (10-B)" }) as HTMLOptionElement).selected,
    ).toBe(true);
  });
});
