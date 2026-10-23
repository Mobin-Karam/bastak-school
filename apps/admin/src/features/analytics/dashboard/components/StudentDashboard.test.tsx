import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { StudentDashboard } from "./StudentDashboard";

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    can: () => true,
    capabilities: ["schedule.read", "prayer_times.read", "attendance.self.read"],
  }),
}));
vi.mock("../../../academics/schedule/api/schedule.api.ts", () => ({
  listSchedule: async () => [
    {
      id: "schedule-1",
      title: "فقه کاربردی",
      weekday: new Date(`${new Date().toISOString().slice(0, 10)}T12:00:00`).getDay(),
      startTime: "08:00",
      endTime: "09:00",
      room: "کلاس ۱",
      status: "ACTIVE",
      organization: { id: "org-1", name: "مدرسه" },
    },
  ],
}));
vi.mock("../../../student-life/attendance/api/attendance-operations.api.ts", () => ({
  getAttendanceEncouragement: async () => ({
    studentId: "student-1",
    totalSessions: 3,
    present: 2,
    absent: 1,
    late: 0,
    excused: 0,
    points: 8,
    attendanceRate: 67,
    message: "برای حضور منظم‌تر برنامه‌ریزی کنید.",
  }),
}));
vi.mock("../../../student-life/attendance/api/attendance.api.ts", () => ({
  listSelfAttendance: async () => [
    {
      id: "attendance-1",
      sessionId: "session-1",
      status: "present",
      note: "",
      title: "فقه کاربردی · کلاس دهم",
      sessionDate: "2026-10-08T08:00:00.000Z",
      contextType: "class",
      contextId: "class-1",
      organizationId: "org-1",
      recordedAt: "2026-10-08T09:00:00.000Z",
    },
    {
      id: "attendance-2",
      sessionId: "session-2",
      status: "absent",
      note: "غیبت ثبت‌شده",
      title: "اخلاق · کلاس دهم",
      sessionDate: "2026-10-07T08:00:00.000Z",
      contextType: "class",
      contextId: "class-1",
      organizationId: "org-1",
      recordedAt: "2026-10-07T09:00:00.000Z",
    },
  ],
}));
vi.mock("../api/dashboard.api.ts", () => ({
  getAdminDashboard: async () => ({
    context: "STUDENT",
    generatedAt: "2026-10-08T08:00:00.000Z",
    assignedStudents: 0,
    unreadConversations: 0,
    home: {
      calendar: { date: "2026-10-08", audience: "personal", entries: [] },
      prayer: {
        organizationId: "org-1",
        date: "2026-10-08",
        times: {
          id: "p1",
          date: "",
          fajr: "05:00",
          sunrise: "06:20",
          dhuhr: "12:00",
          asr: "15:30",
          maghrib: "18:00",
          isha: "19:10",
          source: "school",
          updatedAt: "2026-10-08",
        },
      },
      announcements: [
        {
          id: "announcement-1",
          audience: "STUDENTS",
          classroomId: null,
          title: "برنامه مراسم صبحگاه",
          body: "فردا صبحگاه رأس ساعت هفت و نیم برگزار می‌شود.",
          status: "ACTIVE",
          publishedAt: "2026-10-08T08:00:00.000Z",
          expiresAt: null,
          createdAt: "2026-10-08T08:00:00.000Z",
        },
      ],
      currentClass: null,
    },
  }),
}));

beforeEach(() => {
  vi.useFakeTimers({ toFake: ["Date"] });
  vi.setSystemTime(new Date("2026-10-08T08:00:00Z"));
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("StudentDashboard", () => {
  it("shows the student’s scoped class, prayer, class times, and attendance", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <LocaleProvider>
            <StudentDashboard />
          </LocaleProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const dashboard = await screen.findByRole("region", { name: "خانه دانش‌آموز" });
    expect(dashboard).toBeVisible();
    expect(dashboard).toHaveClass("student-dashboard");
    expect(screen.getByRole("region", { name: "کلاس جاری" })).toHaveTextContent("فقه کاربردی");
    expect(
      screen.getByRole("region", { name: "وقت شرعی پیش رو" }).querySelector("time"),
    ).toBeVisible();
    expect(screen.getByRole("region", { name: "زمان کلاس‌های امروز" })).toHaveTextContent("۰۸:۰۰");
    expect(screen.getByRole("region", { name: "خلاصه حضور و غیاب" })).toHaveTextContent("حاضر");
    expect(screen.getByRole("region", { name: "خلاصه حضور و غیاب" })).toHaveTextContent("۸");
    expect(screen.getByRole("heading", { name: "دستاوردهای من" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "بازار سکه‌های من" })).toBeVisible();
    expect(screen.getByRole("link", { name: /دیدن بازار آینده/ })).toHaveAttribute(
      "href",
      "/admin/coin-shop",
    );
    expect(screen.getByRole("link", { name: /دیدن دستاوردها/ })).toHaveAttribute(
      "href",
      "/admin/achievements",
    );
    expect(
      document.querySelector('img[src="/images/coin/Ornate%20Gold%20Kaaba%20Medallion.png"]'),
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "همه" })).toHaveAttribute("href", "/admin/schedule");
    fireEvent.click(screen.getByRole("button", { name: /باز کردن ۱ پیام مدرسه/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("برنامه مراسم صبحگاه");
    expect(screen.queryByRole("link", { name: /مشاهده همه/ })).not.toBeInTheDocument();
  });

  it("opens the complete attendance drawer with coins and per-class history", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <LocaleProvider>
            <StudentDashboard />
          </LocaleProvider>
        </QueryClientProvider>
      </MemoryRouter>,
    );

    await user.click(await screen.findByRole("button", { name: "جزئیات" }));
    const drawer = await screen.findByRole("dialog");
    expect(drawer).toHaveTextContent("پرونده کامل حضور من");
    expect(drawer).toHaveTextContent("۸");
    expect(drawer).toHaveTextContent("فقه کاربردی · کلاس دهم");
    expect(drawer).toHaveTextContent("اخلاق · کلاس دهم");
    expect(drawer).toHaveTextContent("غایب");
    expect(drawer).toHaveAccessibleName("پرونده کامل حضور من");
    expect(within(drawer).getByRole("button", { name: "بستن" })).toBeVisible();
  });
});
