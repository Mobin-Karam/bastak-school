import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { MobileDashboardHome } from "./MobileDashboardHome";

describe("MobileDashboardHome", () => {
  it("keeps the role-aware home sequence compact and exposes exactly six safe shortcuts", () => {
    render(
      <MemoryRouter>
        <LocaleProvider>
          <MobileDashboardHome
            data={dashboardData}
            activeRole="PRINCIPAL"
            capabilities={[
              "organization.manage",
              "schedule.read",
              "exams.read",
              "students.read",
              "leave.read",
              "recovery_requests.read",
              "student.live.read",
              "users.read",
            ]}
            calendarDate="2026-10-07"
            onCalendarDateChange={() => undefined}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: "کلاس‌های امروز" })).toBeVisible();
    expect(screen.getByRole("region", { name: "اوقات شرعی" })).toBeVisible();
    expect(screen.getByRole("region", { name: "اوقات شرعی" }).querySelector("time")).toBeVisible();
    expect(screen.getByRole("region", { name: "پیام‌های مدرسه" })).toBeVisible();
    expect(screen.getByText("یادآوری جلسه اولیا")).toBeVisible();
    expect(
      screen.getByRole("navigation", { name: "دسترسی سریع" }).querySelectorAll("a"),
    ).toHaveLength(6);
    expect(screen.getByRole("link", { name: /برنامه هفتگی/ })).toHaveAttribute(
      "href",
      "/admin/schedule",
    );
  });
});

const dashboardData = {
  context: "ORGANIZATION_ADMIN",
  activeRole: "PRINCIPAL",
  generatedAt: "2026-10-07T08:00:00.000Z",
  assignedStudents: 0,
  unreadConversations: 0,
  home: {
    calendar: {
      date: "2026-10-07",
      audience: "organization",
      entries: [
        {
          id: "first-class",
          title: "فقه کاربردی",
          weekday: 3,
          startTime: "08:00",
          endTime: "09:00",
          room: "کلاس ۱",
          className: "پایه اول",
          classId: "class-1",
        },
        {
          id: "second-class",
          title: "اخلاق اسلامی",
          weekday: 3,
          startTime: "09:15",
          endTime: "10:15",
          room: "کلاس ۲",
          className: "پایه اول",
          classId: "class-2",
        },
      ],
    },
    prayer: {
      organizationId: "org-1",
      date: "2026-10-07",
      times: {
        id: "prayer-1",
        date: "",
        fajr: "۰۴:۵۰",
        sunrise: "۰۶:۱۲",
        dhuhr: "۱۱:۵۴",
        asr: "۱۵:۲۰",
        maghrib: "۱۸:۱۰",
        isha: "۱۹:۲۵",
        source: "مدرسه",
        updatedAt: "2026-10-07T08:00:00.000Z",
      },
    },
    announcements: [
      {
        id: "announcement-1",
        audience: "STUDENTS" as const,
        classroomId: null,
        title: "یادآوری جلسه اولیا",
        body: "جلسه این هفته برگزار می‌شود.",
        status: "ACTIVE" as const,
        publishedAt: "2026-10-07T08:00:00.000Z",
        expiresAt: null,
        createdAt: "2026-10-07T08:00:00.000Z",
      },
    ],
    currentClass: null,
  },
};
