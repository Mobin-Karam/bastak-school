import type { PropsWithChildren } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { AttendancePage } from "./AttendancePage";

const {
  listAttendanceSessionsMock,
  listAttendanceContextsMock,
  getAttendanceParticipantsMock,
  bulkMarkAttendanceMock,
  canMock,
  canAnyMock,
  getSavedAttendanceSessionMock,
  submitAttendanceAbsencesMock,
  awardAttendancePointsMock,
} = vi.hoisted(() => ({
  listAttendanceSessionsMock: vi.fn(),
  listAttendanceContextsMock: vi.fn(),
  getAttendanceParticipantsMock: vi.fn(),
  bulkMarkAttendanceMock: vi.fn(),
  canMock: vi.fn(),
  canAnyMock: vi.fn(),
  getSavedAttendanceSessionMock: vi.fn(),
  submitAttendanceAbsencesMock: vi.fn(),
  awardAttendancePointsMock: vi.fn(),
}));

vi.mock("../api/attendance.api.ts", () => ({
  contextLabelMap: { class: "کلاس", class_group: "گروه کلاس", dorm: "خوابگاه" },
  listAttendanceSessions: listAttendanceSessionsMock,
  listAttendanceContexts: listAttendanceContextsMock,
  getAttendanceParticipants: getAttendanceParticipantsMock,
  bulkMarkAttendance: bulkMarkAttendanceMock,
}));

vi.mock("../api/attendance-operations.api.ts", () => ({
  getSavedAttendanceSession: getSavedAttendanceSessionMock,
  submitAttendanceAbsences: submitAttendanceAbsencesMock,
  awardAttendancePoints: awardAttendancePointsMock,
}));

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    can: canMock,
    canAny: canAnyMock,
    user: { id: "teacher-1" },
    context: { activeOrganization: { id: "org-1" } },
  }),
}));
vi.mock("../../../../shared/ui/responsive-drawer", () => ({
  ResponsiveDrawer: ({ open, title, description, children, onOpenChange }: any) =>
    open ? (
      <div role="dialog" aria-label={String(title)}>
        <h2>{title}</h2>
        <p>{description}</p>
        <button type="button" aria-label="بستن" onClick={() => onOpenChange(false)}>
          بستن
        </button>
        {children}
      </div>
    ) : null,
}));

vi.mock("../components/AttendanceStaffWorkspace", () => ({
  AttendanceStaffWorkspace: () => <div>فضای کار جلسات</div>,
  AttendanceProfileDialog: () => null,
}));
vi.mock("../components/PendingCorrectionQueue", () => ({
  PendingCorrectionQueue: () => <div>صف اصلاحات حضور</div>,
}));
vi.mock("../components/AttendanceReviewQueue", () => ({
  AttendanceReviewQueue: () => <div>صف بررسی غیبت</div>,
}));

function TestProviders({ children }: PropsWithChildren) {
  return (
    <MemoryRouter>
      <LocaleProvider>{children}</LocaleProvider>
    </MemoryRouter>
  );
}

afterEach(cleanup);

describe("AttendancePage", () => {
  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    vi.clearAllMocks();
    canMock.mockImplementation((capability: string) => capability === "attendance.manage");
    canAnyMock.mockImplementation((capabilities: readonly string[]) =>
      capabilities.some((capability) => canMock(capability)),
    );
    listAttendanceSessionsMock.mockResolvedValue([]);
    listAttendanceContextsMock.mockResolvedValue([]);
    getAttendanceParticipantsMock.mockResolvedValue([]);
    bulkMarkAttendanceMock.mockResolvedValue({ sessionId: "mock-session", count: 0 });
    submitAttendanceAbsencesMock.mockResolvedValue({
      sessionId: "mock-session",
      revision: 1,
      status: "submitted",
      count: 0,
    });
    awardAttendancePointsMock.mockResolvedValue({ id: "point-1" });
  });

  it("starts on classes and waits for a target instead of auto-loading a roster", async () => {
    render(<AttendancePage />, { wrapper: TestProviders });

    await waitFor(() => {
      expect(listAttendanceContextsMock).toHaveBeenCalledOnce();
    });

    expect(screen.getByRole("button", { name: "کلاس 0 مورد" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );

    expect(screen.queryByText("احمد محمدی")).not.toBeInTheDocument();
    expect(getAttendanceParticipantsMock).not.toHaveBeenCalled();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("mounts both scoped review queues in the sessions workspace", async () => {
    canMock.mockImplementation((capability: string) => capability === "attendance.review");
    const user = userEvent.setup();
    render(<AttendancePage />, { wrapper: TestProviders });
    await user.click(await screen.findByRole("button", { name: /سوابق حضور/ }));
    expect(await screen.findByText("فضای کار جلسات")).toBeInTheDocument();
    expect(screen.getByText("صف بررسی غیبت")).toBeInTheDocument();
    expect(screen.getByText("صف اصلاحات حضور")).toBeInTheDocument();
  });
  it("gives a teacher the sessions workspace without reviewer queues", async () => {
    canMock.mockImplementation((capability: string) => capability === "attendance.class.read");
    const user = userEvent.setup();
    render(<AttendancePage />, { wrapper: TestProviders });
    await user.click(await screen.findByRole("button", { name: /سوابق حضور/ }));
    expect(await screen.findByText("فضای کار جلسات")).toBeInTheDocument();
    expect(screen.queryByText("صف بررسی غیبت")).not.toBeInTheDocument();
    expect(screen.queryByText("صف اصلاحات حضور")).not.toBeInTheDocument();
  });

  it("opens the review workspace from a principal or supervisor notification URL", async () => {
    canMock.mockImplementation((capability: string) => capability === "attendance.review");
    render(
      <MemoryRouter initialEntries={["/admin/attendance?section=sessions&reviewRecordId=review-1"]}>
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByText("فضای کار جلسات")).toBeInTheDocument();
    expect(screen.getByText("صف بررسی غیبت")).toBeInTheDocument();
    expect(screen.queryByText("صف اصلاحات حضور")).toBeInTheDocument();
  });

  it.each([false, true])("loads a roster in the responsive panel (mobile: %s)", async (mobile) => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: mobile, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
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
    render(<AttendancePage />, { wrapper: TestProviders });

    await waitFor(() => expect(screen.getByRole("button", { name: "کلاس 1 مورد" })).toBeEnabled());
    await user.click(screen.getByRole("button", { name: "کلاس 1 مورد" }));
    expect(getAttendanceParticipantsMock).not.toHaveBeenCalled();
    expect(screen.queryByText("تاریخ جلسه")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "دهم الف 10-A · ۲ نفر" }));
    await waitFor(() => {
      expect(getAttendanceParticipantsMock).toHaveBeenCalledWith("class", "class-1");
    });
  });

  it("shows only groups belonging to the selected class before loading their roster", async () => {
    listAttendanceContextsMock.mockResolvedValue([
      { id: "class-1", contextType: "class", code: "A", name: "کلاس اول", total: 1 },
      { id: "class-2", contextType: "class", code: "B", name: "کلاس دوم", total: 1 },
      {
        id: "group-1",
        contextType: "class_group",
        classId: "class-1",
        code: "G1",
        name: "گروه اول",
        total: 1,
      },
      {
        id: "group-2",
        contextType: "class_group",
        classId: "class-2",
        code: "G2",
        name: "گروه دوم",
        total: 1,
      },
    ]);
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی" }]);
    const user = userEvent.setup();
    render(<AttendancePage />, { wrapper: TestProviders });
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "گروه کلاس 2 مورد" })).toBeEnabled(),
    );
    await user.click(screen.getByRole("button", { name: "گروه کلاس 2 مورد" }));
    expect(screen.queryByText("گروه اول")).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /کلاس اول A/ }));
    expect(screen.queryByText("گروه دوم")).not.toBeInTheDocument();
    expect(getAttendanceParticipantsMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: /گروه اول G1/ }));
    await screen.findByRole("group", { name: "وضعیت علی" });
    expect(getAttendanceParticipantsMock).toHaveBeenCalledWith("class_group", "group-1");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
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
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(getAttendanceParticipantsMock).toHaveBeenCalledWith("class", "class-2");
    });
    expect(
      screen.getByRole("button", { name: "دهم ب 10-B · ۲ نفر", hidden: true }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it.each(["class", "class_group", "dorm"] as const)(
    "lets a supervisor adjust a student's points in a %s roster",
    async (contextType) => {
      canMock.mockImplementation((capability: string) => capability === "attendance.points.adjust");
      listAttendanceContextsMock.mockResolvedValue([
        {
          id: `${contextType}-1`,
          contextType,
          code: "A",
          name: "فضای آزمون",
          label: "فضای آزمون",
          total: 1,
          activeOrganizationId: "org-1",
          ...(contextType === "class_group" ? { classId: "class-1" } : {}),
        },
        ...(contextType === "class_group"
          ? [
              {
                id: "class-1",
                contextType: "class",
                code: "C",
                name: "کلاس آزمون",
                label: "کلاس آزمون",
                total: 1,
                activeOrganizationId: "org-1",
              },
            ]
          : []),
      ]);
      getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی" }]);
      const user = userEvent.setup();
      render(
        <MemoryRouter
          initialEntries={[
            `/admin/attendance?contextType=${contextType}&contextId=${contextType}-1&section=${contextType}`,
          ]}
        >
          <LocaleProvider>
            <AttendancePage />
          </LocaleProvider>
        </MemoryRouter>,
      );

      await user.click(await screen.findByRole("button", { name: "افزودن یک امتیاز برای علی" }));
      await user.type(screen.getByRole("textbox", { name: "دلیل" }), "همکاری خوب");
      await user.click(screen.getByRole("button", { name: "ثبت امتیاز" }));

      await waitFor(() =>
        expect(awardAttendancePointsMock).toHaveBeenCalledWith(
          expect.objectContaining({
            organizationId: "org-1",
            contextType,
            contextId: `${contextType}-1`,
            studentId: "student-1",
            points: 1,
            reason: "همکاری خوب",
          }),
        ),
      );
    },
  );

  it("restores a shared dorm section URL before a room is selected", async () => {
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "dorm-1",
        contextType: "dorm",
        code: "101",
        name: "اتاق ۱۰۱",
        label: "اتاق ۱۰۱",
        total: 2,
        building: "ساختمان اصلی",
        floor: 1,
        activeOrganizationId: "org-1",
      },
    ]);

    render(
      <MemoryRouter initialEntries={["/admin/attendance?section=dorm"]}>
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("button", { name: "خوابگاه 1 مورد" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByText("ساختمان اصلی")).toBeVisible();
  });
  it("lets a supervisor record only dorm absences and saves every other resident as present", async () => {
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "dorm-1",
        contextType: "dorm",
        code: "101",
        name: "اتاق ۱۰۱",
        label: "اتاق ۱۰۱",
        total: 3,
        building: "ساختمان اصلی",
        floor: 1,
        activeOrganizationId: "org-1",
      },
    ]);
    getAttendanceParticipantsMock.mockResolvedValue([
      { id: "student-1", name: "علی" },
      { id: "student-2", name: "رضا" },
      { id: "student-3", name: "حسن" },
    ]);
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={["/admin/attendance?section=dorm&contextType=dorm&contextId=dorm-1"]}
      >
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const ali = await screen.findByRole("group", { name: "وضعیت علی" });
    expect(within(ali).getByRole("button", { name: "غایب" })).toBeVisible();
    expect(within(ali).queryByRole("button", { name: "حاضر" })).not.toBeInTheDocument();
    expect(within(ali).queryByRole("button", { name: "تأخیر" })).not.toBeInTheDocument();
    await user.click(within(ali).getByRole("button", { name: "غایب" }));
    await user.click(screen.getByRole("button", { name: /بررسی و ثبت اتاق/ }));
    expect(
      screen.getByText("فقط غایبان انتخاب شده‌اند. ۲ ساکن دیگر خودکار حاضر ثبت می‌شوند."),
    ).toBeVisible();
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() =>
      expect(bulkMarkAttendanceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          contextType: "dorm",
          contextId: "dorm-1",
          entries: [
            { studentId: "student-1", status: "absent" },
            { studentId: "student-2", status: "present" },
            { studentId: "student-3", status: "present" },
          ],
        }),
      ),
    );
  });
  it("keeps a retry's original timestamp and request ID after a timeout", async () => {
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "class-1",
        contextType: "class",
        code: "A",
        name: "کلاس",
        label: "کلاس",
        total: 1,
        activeOrganizationId: "org-1",
      },
    ]);
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی" }]);
    bulkMarkAttendanceMock.mockRejectedValueOnce(new Error("network timeout"));
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/attendance?contextId=class-1"]}>
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );
    const group = await screen.findByRole("group", { name: "وضعیت علی" });
    expect(screen.getByRole("searchbox", { name: "جستجوی طلبه" })).toBeVisible();
    await user.click(within(group).getByRole("button", { name: "غایب" }));
    await user.click(screen.getByRole("button", { name: /بررسی و ثبت حضور/ }));
    expect(bulkMarkAttendanceMock).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await within(screen.getByRole("dialog")).findByText("network timeout");
    expect(within(group).getByRole("button", { name: "غایب", hidden: true })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() => expect(bulkMarkAttendanceMock).toHaveBeenCalledTimes(2));
    expect(bulkMarkAttendanceMock.mock.calls[1][0]).toEqual(
      bulkMarkAttendanceMock.mock.calls[0][0],
    );
    expect(bulkMarkAttendanceMock.mock.calls[0][0].requestId).toMatch(/^[0-9a-f-]{36}$/);
  });

  it("preserves a draft until discarding is explicitly confirmed in the responsive panel", async () => {
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "class-1",
        contextType: "class",
        code: "A",
        name: "کلاس",
        total: 1,
        activeOrganizationId: "org-1",
      },
    ]);
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی" }]);
    const user = userEvent.setup();
    render(
      <MemoryRouter initialEntries={["/admin/attendance?contextId=class-1"]}>
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );
    const group = await screen.findByRole("group", { name: "وضعیت علی" });
    await user.click(within(group).getByRole("button", { name: "حاضر" }));
    await user.click(screen.getByRole("button", { name: "پاک‌کردن" }));
    await user.click(screen.getByRole("button", { name: "بازگشت و حفظ تغییرات" }));
    expect(within(group).getByRole("button", { name: "حاضر" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(screen.getByRole("button", { name: "پاک‌کردن" }));
    await user.click(screen.getByRole("button", { name: "ادامه و پاک‌کردن" }));
    expect(within(group).getByRole("button", { name: "حاضر" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    expect(bulkMarkAttendanceMock).not.toHaveBeenCalled();
  });

  it("submits only changed marks and preserves saved excused absences", async () => {
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "class-1",
        contextType: "class",
        name: "کلاس",
        total: 2,
        activeOrganizationId: "org-1",
      },
    ]);
    getSavedAttendanceSessionMock.mockResolvedValue({
      id: "session-1",
      contextType: "class",
      contextId: "class-1",
      title: "کلاس",
      revision: 2,
      status: "open",
      organizationId: "org-1",
      roster: [
        { id: "student-1", name: "علی" },
        { id: "student-2", name: "رضا" },
      ],
      records: [
        { studentId: "student-1", legacyStatus: "present" },
        { studentId: "student-2", legacyStatus: "excused" },
      ],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          "/admin/attendance?contextType=class&contextId=class-1&sessionId=session-1",
        ]}
      >
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );
    const group = await screen.findByRole("group", { name: "وضعیت علی" });
    expect(within(group).queryByRole("button", { name: "حاضر" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /بررسی و ثبت حضور/ })).toBeDisabled();
    await user.click(within(group).getByRole("button", { name: "تأخیر" }));
    await user.click(screen.getByRole("button", { name: /بررسی و ثبت حضور/ }));
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() => expect(submitAttendanceAbsencesMock).toHaveBeenCalledOnce());
    expect(submitAttendanceAbsencesMock.mock.calls[0]).toMatchObject([
      "session-1",
      expect.objectContaining({
        expectedRevision: 2,
        absentStudentIds: [],
        lateStudentIds: ["student-1"],
      }),
    ]);
  });

  it("allows a timetable-assigned teacher to submit a linked class session", async () => {
    canMock.mockImplementation((capability: string) => capability === "attendance.class.manage");
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "class-1",
        contextType: "class",
        name: "کلاس",
        total: 1,
        activeOrganizationId: "org-1",
      },
    ]);
    getSavedAttendanceSessionMock.mockResolvedValue({
      id: "session-1",
      contextType: "class",
      contextId: "class-1",
      title: "کلاس",
      revision: 0,
      status: "open",
      organizationId: "org-1",
      roster: [{ id: "student-1", name: "علی" }],
      records: [],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          "/admin/attendance?contextType=class&contextId=class-1&sessionId=session-1",
        ]}
      >
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );
    const group = await screen.findByRole("group", { name: "وضعیت علی" });
    expect(within(group).queryByRole("button", { name: "حاضر" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تأیید حضور همه" })).toBeEnabled();
    await user.click(within(group).getByRole("button", { name: "غایب" }));
    await user.click(screen.getByRole("button", { name: /بررسی و ثبت حضور/ }));
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() => expect(submitAttendanceAbsencesMock).toHaveBeenCalledOnce());
  });

  it("keeps a finalized timetable occurrence editable for its assigned teacher", async () => {
    canMock.mockImplementation((capability: string) => capability === "attendance.class.manage");
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "class-1",
        contextType: "class",
        name: "کلاس",
        total: 1,
        activeOrganizationId: "org-1",
      },
    ]);
    getSavedAttendanceSessionMock.mockResolvedValue({
      id: "session-1",
      contextType: "class",
      contextId: "class-1",
      title: "کلاس",
      revision: 2,
      status: "finalized",
      sourceKind: "class_schedule",
      assignedStaffId: "teacher-1",
      organizationId: "org-1",
      roster: [{ id: "student-1", name: "علی" }],
      records: [],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          "/admin/attendance?contextType=class&contextId=class-1&sessionId=session-1",
        ]}
      >
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );

    const group = await screen.findByRole("group", { name: "وضعیت علی" });
    await user.click(within(group).getByRole("button", { name: "غایب" }));
    await user.click(screen.getByRole("button", { name: /بررسی و ثبت حضور/ }));
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت" }));
    await waitFor(() => expect(submitAttendanceAbsencesMock).toHaveBeenCalledOnce());
  });

  it("keeps absence-first selections while the mobile roster is searched", async () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "class-1",
        contextType: "class",
        name: "کلاس",
        total: 2,
        activeOrganizationId: "org-1",
      },
    ]);
    getSavedAttendanceSessionMock.mockResolvedValue({
      id: "session-1",
      contextType: "class",
      contextId: "class-1",
      title: "کلاس",
      revision: 0,
      status: "open",
      organizationId: "org-1",
      roster: [
        { id: "student-1", name: "علی", nationalCode: "101" },
        { id: "student-2", name: "رضا", nationalCode: "102" },
      ],
      records: [],
    });
    const user = userEvent.setup();
    render(
      <MemoryRouter
        initialEntries={[
          "/admin/attendance?contextType=class&contextId=class-1&sessionId=session-1",
        ]}
      >
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );
    const ali = await screen.findByRole("group", { name: "وضعیت علی" });
    const drawer = screen.getByRole("dialog");
    expect(drawer.querySelector('[class*="overflow-y-auto"]')).toBeInTheDocument();
    expect(drawer.querySelector('[class*="shrink-0"][class*="border-t"]')).toBeInTheDocument();
    await user.click(within(ali).getByRole("button", { name: "غایب" }));
    const search = screen.getByRole("searchbox", { name: "جستجوی طلبه" });
    await user.type(search, "102");
    expect(screen.queryByRole("group", { name: "وضعیت علی" })).not.toBeInTheDocument();
    expect(screen.getByRole("group", { name: "وضعیت رضا" })).toBeVisible();
    await user.clear(search);
    expect(
      within(await screen.findByRole("group", { name: "وضعیت علی" })).getByRole("button", {
        name: "غایب",
      }),
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("hides marking and save actions for read-only attendance access", async () => {
    canMock.mockImplementation((capability: string) => capability === "attendance.read");
    listAttendanceContextsMock.mockResolvedValue([
      {
        id: "class-1",
        contextType: "class",
        code: "A",
        name: "کلاس",
        label: "کلاس",
        total: 1,
        activeOrganizationId: "org-1",
      },
    ]);
    getAttendanceParticipantsMock.mockResolvedValue([{ id: "student-1", name: "علی" }]);
    render(
      <MemoryRouter initialEntries={["/admin/attendance?contextId=class-1"]}>
        <LocaleProvider>
          <AttendancePage />
        </LocaleProvider>
      </MemoryRouter>,
    );
    await screen.findByText("علی");
    expect(screen.queryByRole("group", { name: "وضعیت علی" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /بررسی و ثبت حضور/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "ثبت‌نشده‌ها حاضر" })).not.toBeInTheDocument();
    expect(bulkMarkAttendanceMock).not.toHaveBeenCalled();
  });
});
