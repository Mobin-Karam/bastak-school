import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { LocaleProvider } from "../../../shared/ui/locale";
import { AttendanceStaffWorkspace } from "./AttendanceStaffWorkspace";
const mocks = vi.hoisted(() => ({
  overview: vi.fn(),
  sessions: vi.fn(),
  pools: vi.fn(),
  create: vi.fn(),
  detail: vi.fn(),
  profile: vi.fn(),
  history: vi.fn(),
}));
vi.mock("../api/attendance-operations.api", () => ({
  getAttendanceOverview: mocks.overview,
  getStaffAttendanceSessions: mocks.sessions,
  getAttendancePools: mocks.pools,
  createAttendancePool: mocks.create,
  getSavedAttendanceSession: mocks.detail,
  getAttendanceProfile: mocks.profile,
  getAttendanceSessionHistory: mocks.history,
}));
vi.mock("../../auth", () => ({ useAuth: () => ({ can: () => true }) }));
vi.mock("../../../shared/api/api", () => ({ api: { openEvents: () => ({ close: vi.fn() }) } }));
function Providers({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
    >
      <LocaleProvider>{children}</LocaleProvider>
    </QueryClientProvider>
  );
}
const contexts = [
  {
    id: "class",
    contextType: "class" as const,
    code: "A",
    name: "کلاس الف",
    label: "کلاس الف",
    total: 3,
    activeOrganizationId: "org",
  },
  {
    id: "room",
    contextType: "dorm" as const,
    code: "R",
    name: "اتاق ب",
    label: "اتاق ب",
    total: 1,
    activeOrganizationId: "org",
  },
];
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  mocks.overview.mockResolvedValue({
    sessions: 2,
    present: 1,
    absent: 1,
    late: 0,
    unmarked: 1,
    resetsAt: "2099-10-11T12:30:00Z",
  });
  mocks.sessions.mockResolvedValue([
    {
      id: "session",
      contextType: "class",
      contextId: "class",
      title: "جلسه کلاس الف",
      sessionDate: "2026-10-11T10:00:00Z",
      present: 1,
      absent: 1,
      unmarked: 1,
    },
  ]);
  mocks.pools.mockResolvedValue([]);
  mocks.history.mockResolvedValue([]);
  mocks.create.mockResolvedValue({ id: "pool" });
  mocks.detail.mockResolvedValue({
    id: "session",
    title: "جلسه کلاس الف",
    sessionDate: "2026-10-11T10:00:00Z",
    marked: 2,
    rosterComplete: true,
    roster: [
      { id: "a", name: "علی" },
      { id: "b", name: "احمد" },
      { id: "c", name: "حسن" },
    ],
    records: [
      { studentId: "a", legacyStatus: "present" },
      { studentId: "b", legacyStatus: "absent" },
    ],
  });
});
describe("staff session and pool creation", () => {
  it("loads session change history only when staff opens it", async () => {
    const user = userEvent.setup();
    render(
      <AttendanceStaffWorkspace
        contexts={contexts}
        scope="staff"
        refreshVersion={0}
        section="sessions"
      />,
      { wrapper: Providers },
    );
    await user.click(await screen.findByText("جلسه کلاس الف"));
    const summary = await screen.findByText("آخرین تغییرهای جلسه");
    expect(mocks.history).not.toHaveBeenCalled();
    await user.click(summary);
    await waitFor(() => expect(mocks.history).toHaveBeenCalledWith("session"));
    expect(await screen.findByText("تغییری برای این جلسه ثبت نشده است.")).toBeInTheDocument();
  });
  it("creates a class-based pool on HTTP previews and preserves its request ID on retry", async () => {
    const getRandomValues = crypto.getRandomValues.bind(crypto);
    vi.stubGlobal("crypto", { getRandomValues });
    mocks.create.mockRejectedValueOnce(new Error("مهلت درخواست تمام شد."));
    const user = userEvent.setup();
    render(
      <AttendanceStaffWorkspace
        contexts={contexts}
        scope="staff"
        refreshVersion={0}
        section="pool"
      />,
      { wrapper: Providers },
    );
    await user.selectOptions(
      screen.getByRole("combobox", { name: "اعضای فراخوان" }),
      "class:class",
    );
    await user.type(screen.getByRole("textbox", { name: "عنوان" }), "گردهمایی");
    await user.type(screen.getByRole("textbox", { name: "محل گردهمایی" }), "سالن");
    await user.click(screen.getByRole("button", { name: "فعال‌کردن فراخوان اکنون" }));
    await screen.findByRole("alert");
    expect(screen.getByRole("alert")).toHaveTextContent("مهلت درخواست تمام شد.");
    await user.click(screen.getByRole("button", { name: "فعال‌کردن فراخوان اکنون" }));
    await waitFor(() => expect(mocks.create).toHaveBeenCalledTimes(2));
    expect(mocks.create.mock.calls[0][0]).toEqual(mocks.create.mock.calls[1][0]);
    expect(mocks.create.mock.calls[0][0]).toMatchObject({
      contextType: "class",
      contextId: "class",
      organizationId: "org",
      place: "سالن",
    });
    expect(mocks.create.mock.calls[0][0].requestId).toMatch(/^[0-9a-f-]{36}$/);
  });
  it("shows absent and unconfirmed session members separately from present members", async () => {
    const user = userEvent.setup();
    render(
      <AttendanceStaffWorkspace
        contexts={contexts}
        scope="staff"
        refreshVersion={0}
        section="sessions"
      />,
      { wrapper: Providers },
    );
    await user.click(await screen.findByRole("button", { name: /جلسه کلاس الف/ }));
    await screen.findByText("احمد");
    expect(screen.getByText("حسن")).toBeInTheDocument();
    expect(screen.queryByText("علی")).not.toBeInTheDocument();
    await user.selectOptions(screen.getByRole("combobox", { name: "فیلتر اعضای جلسه" }), "all");
    expect(screen.getByText("علی")).toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });
  it("offers a clear new-session action and passes automated accessibility checks", async () => {
    const onNewSession = vi.fn(),
      user = userEvent.setup();
    const view = render(
      <AttendanceStaffWorkspace
        contexts={contexts}
        scope="staff"
        refreshVersion={0}
        section="sessions"
        onNewSession={onNewSession}
      />,
      { wrapper: Providers },
    );
    await user.click(screen.getByRole("button", { name: "ثبت جلسه تازه اکنون" }));
    expect(onNewSession).toHaveBeenCalledOnce();
    await screen.findByText("جلسه کلاس الف");
    const result = await axe.run(view.container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations.map((violation) => violation.id)).toEqual([]);
  });
});
