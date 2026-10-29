import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPrincipalDashboard,
  getAttendanceSessionForReview,
  getReviewablePresentSessions,
  reviewAttendanceSession,
  type PrincipalDashboardContract,
} from "../api/principal-dashboard.api";
import {
  getAttendancePolicy,
  updateAttendancePolicy,
} from "../../../student-life/attendance/api/attendance-operations.api";
import { PrincipalDashboard } from "./PrincipalDashboard";

const authCan = vi.hoisted(() => vi.fn((capability: string) => capability === "attendance.review"));
vi.mock("../../../identity/auth/hooks/useAuth", () => ({ useAuth: () => ({ can: authCan }) }));
vi.mock("../api/principal-dashboard.api", () => ({
  getPrincipalDashboard: vi.fn(),
  getAttendanceSessionForReview: vi.fn(),
  getReviewablePresentSessions: vi.fn(),
  reviewAttendanceSession: vi.fn(),
}));
vi.mock("../../../student-life/attendance/api/attendance.api", () => ({
  listAttendanceAbsenceReviews: vi.fn().mockResolvedValue([]),
  markDormAbsenceOutsideSchool: vi.fn(),
  reviewAttendanceAbsence: vi.fn(),
}));
vi.mock("../../../student-life/attendance/api/attendance-operations.api", () => ({
  getAttendancePolicy: vi.fn(),
  updateAttendancePolicy: vi.fn(),
}));
vi.mock("../../reports/api/reports.api", () => ({
  getTeacherStudentReports: vi.fn().mockResolvedValue([]),
  markTeacherStudentReportSeen: vi.fn(),
  actOnTeacherStudentReport: vi.fn(),
}));

const sessionDetail = {
  id: "session-a",
  organizationId: "school-a",
  organizationName: "مدرسه",
  contextType: "class" as const,
  contextId: "class-a",
  title: "پایه اول",
  subjectId: null,
  subjectName: null,
  academicYearId: null,
  academicYearName: null,
  termId: null,
  termName: null,
  operationalDate: null,
  sessionDate: "2026-10-21T08:00:00.000Z",
  scheduledStartAt: null,
  scheduledEndAt: null,
  timeZone: "Asia/Tehran",
  status: "submitted" as const,
  revision: 1,
  assignedStaffId: null,
  assignedStaffName: "استاد",
  submittedAt: null,
  submittedById: null,
  roster: [
    { id: "student-a", name: "علی رضایی", nationalCode: null, userId: null },
    { id: "student-b", name: "رضا احمدی", nationalCode: null, userId: null },
    { id: "student-c", name: "حسن موسوی", nationalCode: null, userId: null },
  ],
  rosterComplete: true,
  records: [
    {
      id: "record-a",
      studentId: "student-a",
      physicalStatus: "absent" as const,
      legacyStatus: "absent" as const,
      note: "",
      revision: 1,
      minutesLate: null,
      arrivalAt: null,
      recordedById: null,
      recordedByName: "",
      recordedAt: "2026-10-21T08:00:00.000Z",
      reviewStatus: null,
      reviewNote: "",
      reviewedAt: null,
    },
    {
      id: "record-b",
      studentId: "student-b",
      physicalStatus: "absent" as const,
      legacyStatus: "excused" as const,
      note: "مجوز ثبت شده است",
      revision: 1,
      minutesLate: null,
      arrivalAt: null,
      recordedById: null,
      recordedByName: "",
      recordedAt: "2026-10-21T08:00:00.000Z",
      reviewStatus: null,
      reviewNote: "",
      reviewedAt: null,
    },
    {
      id: "record-c",
      studentId: "student-c",
      physicalStatus: "late" as const,
      legacyStatus: "late" as const,
      note: "ده دقیقه تأخیر",
      revision: 1,
      minutesLate: 10,
      arrivalAt: null,
      recordedById: null,
      recordedByName: "",
      recordedAt: "2026-10-21T08:00:00.000Z",
      reviewStatus: null,
      reviewNote: "",
      reviewedAt: null,
    },
  ],
  expected: 3,
  marked: 3,
  unmarked: 0,
  canManage: false,
  canCorrect: false,
};

const dashboardData = {
  organizationId: "school-a",
  generatedAt: "2026-10-21T09:00:00.000Z",
  from: "2026-10-15",
  to: "2026-10-21",
  sessionReviews: {
    mode: "absences_only" as const,
    pendingCount: 1,
    items: [
      {
        id: "session-a",
        contextType: "class",
        contextId: "class-a",
        title: "پایه اول",
        sessionDate: "2026-10-21T08:00:00.000Z",
        status: "submitted",
        expected: 1,
        marked: 1,
        present: 0,
        // The list projection can be stale; the detail roster remains authoritative.
        absent: 0,
        late: 0,
        excused: 0,
        lastReviewedAt: null,
      },
    ],
  },
  principalLists: {
    counts: { dorm: 0, reports: 0, leave: 0, groups: 0 },
    teacherSessions: [],
    teacherReports: [],
    dormAttendance: [],
    classGroupAttendance: [],
    teacherLeaveRequests: [],
  },
} satisfies PrincipalDashboardContract;

function renderDashboard() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <PrincipalDashboard />
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

describe("PrincipalDashboard", () => {
  afterEach(cleanup);

  beforeEach(() => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    authCan.mockImplementation((capability) => capability === "attendance.review");
    vi.mocked(getPrincipalDashboard).mockResolvedValue(dashboardData);
    vi.mocked(reviewAttendanceSession).mockResolvedValue({
      sessionId: "session-a",
      reviewedAt: "2026-10-21T09:00:00.000Z",
    });
    vi.mocked(getAttendanceSessionForReview).mockResolvedValue(sessionDetail);
    vi.mocked(getReviewablePresentSessions).mockResolvedValue([]);
    vi.mocked(getAttendancePolicy).mockResolvedValue({
      organizationId: "school-a",
      timeZone: "Asia/Tehran",
      dayStartsAt: "04:00",
      allowPartialSubmission: true,
      lateCountsAsPresent: true,
      correctionRequiresReview: false,
      principalReviewMode: "absences_only",
    });
    vi.mocked(updateAttendancePolicy).mockResolvedValue({
      organizationId: "school-a",
      timeZone: "Asia/Tehran",
      dayStartsAt: "04:00",
      allowPartialSubmission: true,
      lateCountsAsPresent: true,
      correctionRequiresReview: false,
      principalReviewMode: "all_sessions",
    });
  });

  it("shows only capability-authorized dashboard cards", async () => {
    renderDashboard();
    expect(await screen.findByRole("button", { name: /جلسه‌های کلاس/ })).toBeVisible();
    expect(screen.getByRole("button", { name: /بازبینی حضور خوابگاه/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /درخواست‌های مرخصی استادان/ })).toBeNull();
    authCan.mockImplementation(() => false);
    cleanup();
    renderDashboard();
    await waitFor(() => expect(screen.queryByRole("button", { name: /جلسه‌های کلاس/ })).toBeNull());
  });

  it("opens session review in a drawer and requires a teacher message for absences", async () => {
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole("button", { name: /جلسه‌های کلاس/ }));
    const sessionButton = await screen.findByRole("button", { name: /پایه اول.*غایب/ });
    await user.click(sessionButton);
    expect(await screen.findByText("علی رضایی")).toBeVisible();
    expect(screen.getByText("رضا احمدی")).toBeVisible();
    expect(screen.getByText("حسن موسوی")).toBeVisible();
    expect(screen.getByText("تأخیر · نیازمند پیگیری")).toBeVisible();
    expect(screen.getByText("غایبِ نیازمند پیگیری: ۲")).toBeVisible();
    const submit = screen.getByRole("button", { name: /ثبت بازبینی و انتقال به آرشیو/ });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/پیام مدیر برای استاد/), "علت غیبت را پیگیری کنید.");
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() =>
      expect(reviewAttendanceSession).toHaveBeenCalledWith("session-a", "علت غیبت را پیگیری کنید."),
    );
  });

  it("enables one-time auto-archive only when fully-present sessions are eligible", async () => {
    vi.mocked(getReviewablePresentSessions).mockResolvedValue([{ id: "present-a", revision: 2 }]);
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole("button", { name: /جلسه‌های کلاس/ }));
    const autoArchive = await screen.findByRole("switch", {
      name: "بایگانی خودکار جلسه‌های کاملاً حاضر",
    });
    expect(autoArchive).toBeEnabled();
    await user.click(autoArchive);
    await waitFor(() => expect(reviewAttendanceSession).toHaveBeenCalledWith("present-a"));
  });

  it("persists the review-mode switch immediately", async () => {
    authCan.mockImplementation(
      (capability) =>
        capability === "attendance.review" || capability === "attendance.settings.manage",
    );
    const user = userEvent.setup();
    renderDashboard();
    await user.click(await screen.findByRole("button", { name: /جلسه‌های کلاس/ }));
    await user.click(
      await screen.findByRole("switch", { name: "نمایش همهٔ جلسه‌ها برای بازبینی" }),
    );
    await waitFor(() =>
      expect(updateAttendancePolicy).toHaveBeenCalledWith(
        expect.objectContaining({ principalReviewMode: "all_sessions" }),
      ),
    );
  });
});
