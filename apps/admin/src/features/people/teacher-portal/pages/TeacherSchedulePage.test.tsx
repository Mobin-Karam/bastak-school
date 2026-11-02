import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { ScheduleEntry } from "../../../academics/schedule/api/schedule.api";
import type { TeacherWeekAttendanceSummary } from "../../../student-life/attendance/public";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { teacherSchoolWeekStart, TeacherSchedulePage } from "./TeacherSchedulePage";

const {
  getTeacherWeekAttendanceSummaryMock,
  listLegacyAcademicCyclesMock,
  listTeacherLeaveRequestsMock,
} = vi.hoisted(() => ({
  getTeacherWeekAttendanceSummaryMock: vi.fn(),
  listLegacyAcademicCyclesMock: vi.fn(),
  listTeacherLeaveRequestsMock: vi.fn(),
}));

vi.mock("../../../academics/schedule/api/schedule.api", () => ({
  listScheduleByAcademicPeriod: vi.fn(),
  listLegacyAcademicCycles: listLegacyAcademicCyclesMock,
}));

vi.mock("../../../academics/schedule/api/teacher-leave.api", () => ({
  listTeacherLeaveRequests: listTeacherLeaveRequestsMock,
}));

vi.mock("../../../student-life/attendance/api", () => ({
  getTeacherWeekAttendanceSummary: getTeacherWeekAttendanceSummaryMock,
}));

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    can: (capability: string) => capability === "attendance.class.manage",
    context: { activeOrganization: { id: "org-1" } },
  }),
}));

vi.mock("../components/TeacherClassAttendanceSheet", () => ({
  TeacherClassAttendanceSheet: ({
    entry,
    open,
    initialDate,
    canManage,
  }: {
    entry: ScheduleEntry | null;
    open: boolean;
    initialDate?: string;
    canManage: boolean;
  }) =>
    open ? (
      <div data-testid="attendance-sheet" data-date={initialDate} data-can-manage={canManage}>
        {entry?.title}
      </div>
    ) : null,
}));

const scheduleEntry = (
  id: string,
  title: string,
  weekday: number,
  startTime = "08:00",
): ScheduleEntry => ({
  id,
  title,
  weekday,
  startTime,
  endTime: "09:00",
  room: "",
  status: "ACTIVE",
  academicYearId: "year-1",
  termId: "term-1",
  organization: { id: "org-1", name: "School" },
  classroom: { id: `class-${id}`, name: "Class" },
});

const entries = [
  scheduleEntry("complete", "Completed lesson", 0),
  scheduleEntry("incomplete", "Incomplete lesson", 0, "09:00"),
  scheduleEntry("future", "Future lesson", 1, "08:00"),
];

const summaries: TeacherWeekAttendanceSummary[] = [
  {
    entryId: "complete",
    date: "2026-10-31",
    attendanceRecorded: true,
    rosterCount: 2,
    unmarkedCount: 1,
    pastUnmarkedCount: 1,
    mostRecentUnmarkedDate: "2026-10-24",
  },
  {
    entryId: "incomplete",
    date: "2026-10-31",
    attendanceRecorded: false,
    rosterCount: 3,
    unmarkedCount: 3,
    pastUnmarkedCount: 0,
    mostRecentUnmarkedDate: null,
  },
  {
    entryId: "future",
    date: "2026-11-01",
    attendanceRecorded: false,
    rosterCount: 2,
    unmarkedCount: 2,
    pastUnmarkedCount: 0,
    mostRecentUnmarkedDate: null,
  },
];

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <LocaleProvider>
      <QueryClientProvider client={queryClient}>
        <TeacherSchedulePage
          entries={entries}
          attendanceSummaries={summaries}
          weekOfDate="2026-11-01"
          now={new Date("2026-11-01T04:00:00.000Z")}
        />
      </QueryClientProvider>
    </LocaleProvider>,
  );
}

afterEach(cleanup);
beforeEach(() => {
  vi.clearAllMocks();
  listLegacyAcademicCyclesMock.mockResolvedValue({
    years: [{ id: "year-1", name: "1405", state: "ACTIVE" }],
    terms: [
      {
        id: "term-1",
        academicYearId: "year-1",
        name: "Term 1",
        state: "ACTIVE",
        startsOn: "2026-09-01",
        endsOn: "2027-06-30",
        correctionOpen: false,
      },
    ],
  });
  listTeacherLeaveRequestsMock.mockResolvedValue([]);
});

describe("TeacherSchedulePage", () => {
  it("uses Saturday as the first day of the Tehran school week", () => {
    expect(teacherSchoolWeekStart("2026-11-01")).toBe("2026-10-31");
  });

  it("shows all seven days and distinguishes completed, incomplete, and future lessons", async () => {
    renderPage();

    const completed = await screen.findByRole("button", { name: /Completed lesson/ });
    const incomplete = screen.getByRole("button", { name: /Incomplete lesson/ });
    const future = screen.getByRole("button", { name: /Future lesson/ });

    expect(completed).toHaveClass("border-emerald-500");
    expect(completed).toHaveTextContent("۱ نفر مانده");
    expect(incomplete).toHaveClass("border-rose-500");
    expect(incomplete).toHaveTextContent("۳ نفر مانده");
    expect(future).toHaveClass("border-amber-500");
    expect(future).toHaveTextContent("۲ نفر مانده");
    const headings = screen.getAllByRole("heading", { level: 3 });
    for (const day of ["شنبه", "یکشنبه", "دوشنبه", "سه‌شنبه", "چهارشنبه", "پنجشنبه", "جمعه"])
      expect(headings.some((heading) => heading.textContent?.startsWith(day))).toBe(true);
  });

  it("opens the selected lesson occurrence in the attendance sheet", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /Completed lesson/ }));

    await waitFor(() => {
      expect(screen.getByTestId("attendance-sheet")).toHaveTextContent("Completed lesson");
      expect(screen.getByTestId("attendance-sheet")).toHaveAttribute("data-date", "2026-10-31");
      expect(screen.getByTestId("attendance-sheet")).toHaveAttribute("data-can-manage", "true");
    });
  });

  it("jumps to the most recent past occurrence missing attendance", async () => {
    renderPage();
    const user = userEvent.setup();

    await user.click(await screen.findByRole("button", { name: /جلسه گذشته بدون حضور/ }));

    expect(await screen.findByTestId("attendance-sheet")).toHaveAttribute(
      "data-date",
      "2026-10-24",
    );
  });
});
