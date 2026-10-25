import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  getPrincipalDashboard,
  getAttendanceSessionForReview,
  reviewAttendanceSession,
} from "../api/principal-dashboard.api";
import { PrincipalDashboard } from "./PrincipalDashboard";

const authCan = vi.hoisted(() => vi.fn((capability: string) => capability === "attendance.review"));

vi.mock("../../../identity/auth/hooks/useAuth", () => ({ useAuth: () => ({ can: authCan }) }));
vi.mock("../api/principal-dashboard.api", () => ({
  getPrincipalDashboard: vi.fn(),
  getAttendanceSessionForReview: vi.fn(),
  reviewAttendanceSession: vi.fn(),
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
  assignedStaffName: "",
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
  expected: 10,
  marked: 9,
  unmarked: 1,
  canManage: false,
  canCorrect: false,
};

const dashboardData = {
  organizationId: "school-a",
  generatedAt: "2026-10-21T09:00:00.000Z",
  from: "2026-10-15",
  to: "2026-10-21",
  attendance: {
    today: { present: 8, absent: 1, late: 1, excused: 0, rate: 90 },
    present: 8,
    absent: 1,
    late: 1,
    excused: 0,
    rate: 90,
    trend: [],
    classes: [],
  },
  behaviour: {
    dimensions: [{ key: "attendance", label: "حضور", value: 90 }],
    risks: [],
  },
  queues: {
    attendanceReviews: 0,
    leaveRequests: 0,
    exitRequests: 0,
    permissionRequests: 0,
  },
  sessionReviews: {
    pendingCount: 1,
    items: [
      {
        id: "session-a",
        contextType: "class",
        contextId: "class-a",
        title: "پایه اول",
        sessionDate: "2026-10-21T08:00:00.000Z",
        status: "submitted",
        expected: 10,
        marked: 9,
        present: 8,
        absent: 1,
        late: 0,
        excused: 0,
        lastReviewedAt: null,
      },
    ],
  },
  operations: { activeStudents: 10, currentlyOut: 0, scheduleEntries: 4, staff: 2 },
  todayAbsences: [{ id: "student-a", name: "علی رضایی", context: "پایه اول", sessions: 1 }],
  pendingLeaveRequests: [
    {
      id: "leave-a",
      studentName: "رضا احمدی",
      leaveType: "LEAVE",
      startDate: "2026-10-21T00:00:00.000Z",
      endDate: "2026-10-22T00:00:00.000Z",
    },
  ],
};

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

  it("shows absent-student details before the principal confirms review", async () => {
    const user = userEvent.setup();
    renderDashboard();

    expect(
      await screen.findByRole("heading", { name: "جلسه‌های حضورِ نیازمند بررسی" }),
    ).toBeVisible();
    expect(screen.getByText(/۱ جلسه در چرخهٔ بازبینی هر ۲۴ ساعت/)).toBeVisible();
    expect(screen.getByText("پایه اول")).toBeVisible();
    await user.click(screen.getByRole("button", { name: /مشاهدهٔ جزئیات/ }));

    expect(await screen.findByText("علی رضایی")).toBeVisible();
    expect(reviewAttendanceSession).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "جزئیات را بررسی و تأیید می‌کنم" }));

    await waitFor(() =>
      expect(reviewAttendanceSession).toHaveBeenCalledWith("session-a", expect.anything()),
    );
    await waitFor(() => expect(getPrincipalDashboard).toHaveBeenCalledTimes(2));
  });

  it("records the review immediately when the session has no absences", async () => {
    const user = userEvent.setup();
    vi.mocked(getPrincipalDashboard).mockResolvedValue({
      ...dashboardData,
      sessionReviews: {
        pendingCount: 1,
        items: [{ ...dashboardData.sessionReviews.items[0], absent: 0 }],
      },
    });
    vi.mocked(getAttendanceSessionForReview).mockClear();
    renderDashboard();

    await user.click(await screen.findByRole("button", { name: "تأیید بازبینی و ثبت" }));

    await waitFor(() =>
      expect(reviewAttendanceSession).toHaveBeenCalledWith("session-a", expect.anything()),
    );
    expect(getAttendanceSessionForReview).not.toHaveBeenCalled();
  });

  it("hides the leadership review section when the active context lacks attendance.review", async () => {
    authCan.mockImplementation(() => false);
    renderDashboard();

    expect(await screen.findByRole("heading", { name: "نبض مدرسه" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "جلسه‌های حضورِ نیازمند بررسی" })).toBeNull();
  });

  it("puts today’s four operational sections first", async () => {
    authCan.mockImplementation((capability) =>
      ["students.read", "attendance.read", "leave.read"].includes(capability),
    );
    renderDashboard();

    expect(await screen.findByRole("heading", { name: "دانش‌آموزان غایب" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "درخواست‌های مرخصی" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "خلاصهٔ حضور مدرسه" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "عملیات فعال" })).toBeVisible();
    expect(screen.getByRole("link", { name: /علی رضایی/ })).toHaveAttribute(
      "href",
      "/admin/students?studentId=student-a",
    );
    expect(screen.getByRole("link", { name: /رضا احمدی/ })).toHaveAttribute(
      "href",
      "/admin/leave-requests?requestId=leave-a",
    );
  });
});
