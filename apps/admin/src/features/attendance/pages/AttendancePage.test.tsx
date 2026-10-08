import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
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

  it("waits for an attendance type and target instead of auto-loading a roster", async () => {
    render(<AttendancePage />, { wrapper: MemoryRouter });

    await waitFor(() => {
      expect(listAttendanceContextsMock).toHaveBeenCalledOnce();
    });

    expect(screen.getByText("نوع حضور و غیاب را انتخاب کنید")).toBeInTheDocument();
    expect(screen.getByText("ابتدا کلاس، گروه یا اتاق را انتخاب کنید.")).toBeInTheDocument();
    expect(screen.queryByText("احمد محمدی")).not.toBeInTheDocument();
    expect(getAttendanceParticipantsMock).not.toHaveBeenCalled();
    expect(screen.getByRole("button", { name: /ثبت حضور/ })).toBeDisabled();
  });

  it("loads a roster only after selecting an attendance type and target", async () => {
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
    ]);
    const user = userEvent.setup();
    render(<AttendancePage />, { wrapper: MemoryRouter });

    await waitFor(() => expect(screen.getByRole("button", { name: "کلاس 1 مورد" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "کلاس 1 مورد" }));
    expect(getAttendanceParticipantsMock).not.toHaveBeenCalled();

    await user.selectOptions(screen.getByRole("combobox", { name: /مرحله ۲/ }), "class-1");
    await waitFor(() => {
      expect(getAttendanceParticipantsMock).toHaveBeenCalledWith("class", "class-1");
    });
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
