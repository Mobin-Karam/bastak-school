import type { PropsWithChildren } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import axe from "axe-core";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { AttendanceStaffWorkspace } from "./AttendanceStaffWorkspace";
const mocks = vi.hoisted(() => ({
  overview: vi.fn(),
  report: vi.fn(),
  policy: vi.fn(),
  updatePolicy: vi.fn(),
  sessions: vi.fn(),
  pools: vi.fn(),
  create: vi.fn(),
  detail: vi.fn(),
  profile: vi.fn(),
  history: vi.fn(),
  cancel: vi.fn(),
}));
vi.mock("../api/attendance-operations.api.ts", () => ({
  getAttendanceOverview: mocks.overview,
  getAttendanceReportSummary: mocks.report,
  getAttendancePolicy: mocks.policy,
  updateAttendancePolicy: mocks.updatePolicy,
  getStaffAttendanceSessions: mocks.sessions,
  getAttendancePools: mocks.pools,
  createAttendancePool: mocks.create,
  getSavedAttendanceSession: mocks.detail,
  getAttendanceProfile: mocks.profile,
  getAttendanceSessionHistory: mocks.history,
  cancelAttendanceSession: mocks.cancel,
}));
vi.mock("../../../identity/auth", () => ({ useAuth: () => ({ can: () => true }) }));
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
  mocks.report.mockResolvedValue({
    finalizedSessions: 0,
    denominator: 0,
    present: 0,
    absent: 0,
    late: 0,
    excused: 0,
    attendanceRate: null,
  });
  mocks.policy.mockResolvedValue({
    organizationId: "org",
    timeZone: "Asia/Tehran",
    dayStartsAt: "04:00",
    allowPartialSubmission: true,
    lateCountsAsPresent: true,
    correctionRequiresReview: false,
  });
  mocks.updatePolicy.mockResolvedValue({});
  mocks.sessions.mockResolvedValue({
    items: [
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
    ],
    page: 1,
    limit: 25,
    total: 1,
    hasNext: false,
  });
  mocks.pools.mockResolvedValue([]);
  mocks.history.mockResolvedValue([]);
  mocks.cancel.mockResolvedValue({ sessionId: "session", revision: 1, status: "cancelled" });
  mocks.create.mockResolvedValue({ id: "pool" });
  mocks.detail.mockResolvedValue({
    id: "session",
    title: "جلسه کلاس الف",
    sessionDate: "2026-10-11T10:00:00Z",
    marked: 2,
    academicYearName: "سال تحصیلی ۱۴۰۵",
    termName: "نیم‌سال اول",
    subjectName: "فقه",
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
  it("saves attendance policy through the existing workspace form", async () => {
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
    const partial = await screen.findByRole("checkbox", { name: "اجازه ثبت ناقص" });
    await user.click(partial);
    await user.click(screen.getByRole("button", { name: "ذخیره قوانین حضور" }));
    await waitFor(() =>
      expect(mocks.updatePolicy).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "org",
          dayStartsAt: "04:00",
          allowPartialSubmission: false,
          lateCountsAsPresent: true,
          correctionRequiresReview: false,
        }),
      ),
    );
  });

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
    await screen.findByText("جلسه کلاس الف");
    expect(screen.getByRole("region", { name: "فهرست جلسات حضور" })).toContainElement(
      screen.getByRole("table"),
    );
    await user.click(screen.getByText("جلسه کلاس الف"));
    const summary = await screen.findByText("آخرین تغییرهای جلسه");
    expect(mocks.history).not.toHaveBeenCalled();
    await user.click(summary);
    await waitFor(() => expect(mocks.history).toHaveBeenCalledWith("session"));
    expect(await screen.findByText("تغییری برای این جلسه ثبت نشده است.")).toBeInTheDocument();
  });
  it("renders the immutable academic and subject snapshots for a saved session", async () => {
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
    expect(await screen.findByText("سال تحصیلی ۱۴۰۵ · نیم‌سال اول · فقه")).toBeInTheDocument();
  });
  it("pages the staff session archive without requesting an unbounded list", async () => {
    mocks.sessions
      .mockResolvedValueOnce({
        items: [
          {
            id: "newer",
            contextType: "class",
            contextId: "class",
            title: "جلسه جدید",
            sessionDate: "2026-10-12T10:00:00Z",
            present: 1,
            absent: 0,
            unmarked: 0,
          },
        ],
        page: 1,
        limit: 1,
        total: 2,
        hasNext: true,
      })
      .mockResolvedValueOnce({
        items: [
          {
            id: "older",
            contextType: "class",
            contextId: "class",
            title: "جلسه قدیمی",
            sessionDate: "2026-10-11T10:00:00Z",
            present: 1,
            absent: 0,
            unmarked: 0,
          },
        ],
        page: 2,
        limit: 1,
        total: 2,
        hasNext: false,
      });
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
    expect(await screen.findByText("جلسه جدید")).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "قدیمی‌تر" }));
    expect(await screen.findByText("جلسه قدیمی")).toBeInTheDocument();
    expect(mocks.sessions).toHaveBeenNthCalledWith(2, 2);
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
  it("renders the authorized student attendance profile with identity and summary cards", async () => {
    mocks.profile.mockResolvedValue({
      studentId: "b",
      name: "احمد",
      schoolName: "دبیرستان نمونه",
      classNames: ["هفتم الف"],
      points: 125,
      attendanceRate: 92,
      attendanceCoverage: 100,
      totalSessions: 12,
      scopedToTeacherClasses: true,
      counts: { present: 10, absent: 1, late: 1, excused: 0 },
      records: [],
    });
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
    await user.click((await screen.findAllByRole("button", { name: "پرونده حضور" }))[0]);

    expect(await screen.findByText("دبیرستان نمونه")).toBeInTheDocument();
    expect(screen.getByText("هفتم الف")).toBeInTheDocument();
    expect(screen.getByText("امتیاز")).toBeInTheDocument();
    expect(screen.getByText("درصد حضور")).toBeInTheDocument();
    expect(screen.getByText("تکمیل ثبت همه جلسه‌ها")).toBeInTheDocument();
    expect(mocks.profile).toHaveBeenCalledWith("b");
  });
  it("requires a reason before a reviewer can cancel an unmarked session", async () => {
    mocks.detail.mockResolvedValue({
      id: "session",
      title: "جلسه کلاس الف",
      sessionDate: "2026-10-11T10:00:00Z",
      marked: 0,
      revision: 0,
      status: "open",
      rosterComplete: true,
      roster: [],
      records: [],
    });
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
    await user.click(await screen.findByRole("button", { name: "لغو جلسه" }));
    const confirm = screen.getByRole("button", { name: "تأیید لغو جلسه" });
    expect(confirm).toBeDisabled();
    await user.type(screen.getByRole("textbox", { name: "دلیل لغو جلسه" }), "برگزاری نشد");
    await user.click(confirm);
    await waitFor(() =>
      expect(mocks.cancel).toHaveBeenCalledWith(
        "session",
        expect.objectContaining({ expectedRevision: 0, reason: "برگزاری نشد" }),
      ),
    );
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
