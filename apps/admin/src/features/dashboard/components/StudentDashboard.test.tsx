import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { StudentDashboard } from "./StudentDashboard";

vi.mock("../../auth", () => ({
  useAuth: () => ({ capabilities: ["schedule.read", "prayer_times.read", "attendance.self.read"] }),
}));
vi.mock("../../schedule/api/schedule.api", () => ({
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
vi.mock("../../attendance/api/attendance.api", () => ({
  listSelfAttendance: async () => [],
  getSelfAttendanceSummary: async () => ({
    studentId: "student-1",
    totalSessions: 3,
    present: 2,
    absent: 1,
    late: 0,
    excused: 0,
    recent: [],
  }),
}));
vi.mock("../api/dashboard.api", () => ({
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

describe("StudentDashboard", () => {
  it("keeps the student home limited to calendar, current class, prayer and attendance", async () => {
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

    expect(await screen.findByRole("region", { name: "خانه دانش‌آموز" })).toBeVisible();
    expect(screen.getByRole("region", { name: "کلاس جاری" })).toHaveTextContent("فقه کاربردی");
    expect(screen.getByRole("region", { name: "اوقات شرعی" }).querySelector("time")).toBeVisible();
    expect(screen.getByRole("region", { name: "خلاصه حضور و غیاب" })).toHaveTextContent("حاضر");
    expect(screen.getByRole("link", { name: /برنامه کامل/ })).toHaveAttribute(
      "href",
      "/admin/schedule",
    );
    fireEvent.click(screen.getByRole("button", { name: /باز کردن ۱ پیام مدرسه/ }));
    expect(screen.getByRole("dialog")).toHaveTextContent("برنامه مراسم صبحگاه");
    expect(screen.queryByRole("link", { name: /مشاهده همه/ })).not.toBeInTheDocument();
  });
});
