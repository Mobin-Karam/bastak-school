import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPrincipalDashboard,
  getAttendanceSessionForReview,
  reviewAttendanceSession,
  type PrincipalDashboardContract,
} from "../api/principal-dashboard.api";
import { PrincipalDashboard } from "./PrincipalDashboard";

const authCan = vi.hoisted(() => vi.fn((capability: string) => capability === "attendance.review"));
vi.mock("../../../identity/auth/hooks/useAuth", () => ({ useAuth: () => ({ can: authCan }) }));
vi.mock("../api/principal-dashboard.api", () => ({
  getPrincipalDashboard: vi.fn(),
  getAttendanceSessionForReview: vi.fn(),
  reviewAttendanceSession: vi.fn(),
}));
vi.mock("../../../student-life/attendance/api/attendance.api", () => ({
  listAttendanceAbsenceReviews: vi.fn().mockResolvedValue([]),
  markDormAbsenceOutsideSchool: vi.fn(),
  reviewAttendanceAbsence: vi.fn(),
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
  roster: [{ id: "student-a", name: "علی رضایی", nationalCode: null, userId: null }],
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
  ],
  expected: 1,
  marked: 1,
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
        absent: 1,
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
    const submit = screen.getByRole("button", { name: /ثبت بازبینی و انتقال به آرشیو/ });
    expect(submit).toBeDisabled();
    await user.type(screen.getByLabelText(/پیام مدیر برای استاد/), "علت غیبت را پیگیری کنید.");
    expect(submit).toBeEnabled();
    await user.click(submit);

    await waitFor(() =>
      expect(reviewAttendanceSession).toHaveBeenCalledWith("session-a", "علت غیبت را پیگیری کنید."),
    );
  });
});
