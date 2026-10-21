import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { PropsWithChildren } from "react";
import { LocaleProvider } from "../../../../shared/ui/locale";
import {
  StudentAttendancePoolPrompt,
  StudentAttendanceWorkspace,
} from "./StudentAttendanceWorkspace";
const mocks = vi.hoisted(() => ({
  assignments: vi.fn(),
  pools: vi.fn(),
  mark: vi.fn(),
  confirm: vi.fn(),
  can: vi.fn(),
}));
vi.mock("../api/attendance-operations.api.ts", () => ({
  getMyDormAssignments: mocks.assignments,
  getMyAttendancePools: mocks.pools,
  markDelegatedDormAttendance: mocks.mark,
  confirmAttendancePool: mocks.confirm,
}));
vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    can: mocks.can,
    user: { id: "student" },
    activeRole: "STUDENT",
    context: { activeOrganization: { id: "org" } },
  }),
}));
vi.mock("../../../../shared/api/api", () => ({ api: { openEvents: () => ({ close: vi.fn() }) } }));
function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LocaleProvider>{children}</LocaleProvider>
    </QueryClientProvider>
  );
}
afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  mocks.assignments.mockResolvedValue([]);
  mocks.pools.mockResolvedValue([]);
  mocks.can.mockReturnValue(true);
  mocks.confirm.mockResolvedValue({ confirmed: true });
  mocks.mark.mockResolvedValue({ count: 1 });
});
describe("student room responsibility and gathering prompts", () => {
  it("offers a current-night room roster with a filter and no search or date picker", async () => {
    mocks.assignments.mockResolvedValue([
      {
        id: "delegate",
        roomId: "room",
        roomName: "اتاق الف",
        studentId: "student",
        studentName: "علی",
        startsOn: "2026-10-11",
        endsOn: "2026-10-12",
        nightDate: "2026-10-11",
        revision: 0,
        revoked: false,
        canMark: true,
        roster: [{ id: "resident", name: "احمد" }],
        records: [],
      },
    ]);
    const user = userEvent.setup();
    render(<StudentAttendanceWorkspace scope="student-scope" />, { wrapper: Providers });
    await user.click(await screen.findByRole("button", { name: "ثبت حضور شب جاری" }));
    expect(screen.getByRole("combobox", { name: "فیلتر وضعیت" })).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.queryByText("تاریخ جلسه")).not.toBeInTheDocument();
    await user.click(
      within(screen.getByRole("group", { name: "وضعیت احمد" })).getByRole("button", {
        name: "حاضر",
      }),
    );
    await user.click(screen.getByRole("button", { name: "بررسی و ثبت حضور اتاق" }));
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت حضور اتاق" }));
    await waitFor(() =>
      expect(mocks.mark).toHaveBeenCalledWith(
        "delegate",
        expect.objectContaining({
          nightDate: "2026-10-11",
          expectedRevision: 0,
          entries: [{ studentId: "resident", status: "present" }],
        }),
      ),
    );
  });
  it("keeps residents unmarked until confirmation, then records an explicit all-present dorm roster", async () => {
    mocks.assignments.mockResolvedValue([
      {
        id: "delegate-all-present",
        roomId: "room",
        roomName: "اتاق الف",
        studentId: "student",
        studentName: "علی",
        startsOn: "2026-10-11",
        endsOn: "2026-10-12",
        nightDate: "2026-10-11",
        revision: 0,
        revoked: false,
        canMark: true,
        roster: [
          { id: "resident-a", name: "احمد" },
          { id: "resident-b", name: "حسین" },
        ],
        records: [],
      },
    ]);
    const user = userEvent.setup();
    render(<StudentAttendanceWorkspace scope="student-scope" />, { wrapper: Providers });
    await user.click(await screen.findByRole("button", { name: "ثبت حضور شب جاری" }));
    await user.click(screen.getByRole("button", { name: "تأیید حضور همه ساکنان" }));
    expect(
      screen.getByText("هیچ غایب یا تأخیری انتخاب نشده است؛ با تأیید، حضور همه ساکنان ثبت می‌شود."),
    ).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت حضور اتاق" }));
    await waitFor(() =>
      expect(mocks.mark).toHaveBeenCalledWith(
        "delegate-all-present",
        expect.objectContaining({
          entries: [
            { studentId: "resident-a", status: "present" },
            { studentId: "resident-b", status: "present" },
          ],
        }),
      ),
    );
  });
  it("does not offer attendance marking before the delegated window begins", async () => {
    mocks.assignments.mockResolvedValue([
      {
        id: "future",
        roomName: "اتاق ب",
        startsOn: "2026-10-13",
        endsOn: "2026-10-14",
        canMark: false,
      },
    ]);
    render(<StudentAttendanceWorkspace scope="student-scope" />, { wrapper: Providers });
    expect(
      await screen.findByRole("button", { name: "مسئولیت هنوز آغاز نشده است" }),
    ).toBeDisabled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
  it("opens a live gathering prompt and submits only the signed-in student's confirmation", async () => {
    mocks.pools.mockResolvedValue([
      { id: "pool", title: "گردهمایی", place: "سالن", endsAt: "2026-10-11T18:00:00Z" },
    ]);
    const user = userEvent.setup();
    render(<StudentAttendancePoolPrompt />, { wrapper: Providers });
    await screen.findByRole("dialog", { name: "گردهمایی" });
    await user.click(screen.getByRole("button", { name: "اینجا هستم" }));
    await waitFor(() => expect(mocks.confirm).toHaveBeenCalledWith("pool"));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
  it("does not load or show gathering prompts without self-attendance access", async () => {
    mocks.can.mockReturnValue(false);
    render(<StudentAttendancePoolPrompt />, { wrapper: Providers });
    expect(mocks.pools).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
