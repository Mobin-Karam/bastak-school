import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolIncomingPanel, SupervisorAttendanceLaunchpad } from "./SchoolManagerDashboard";

const notifications = {
  items: [] as Array<{
    id: string;
    title: string;
    body?: string;
    isRead?: boolean;
    url?: string | null;
  }>,
  loading: false,
  error: false,
  refresh: vi.fn(),
};

vi.mock("../../../communications/notifications/hooks/useAdminNotifications", () => ({
  useAdminNotifications: () => notifications,
}));

describe("SchoolIncomingPanel", () => {
  beforeEach(() => {
    notifications.items = [];
    notifications.loading = false;
    notifications.error = false;
  });

  it("shows unread incoming work and preserves its authorized target link", () => {
    notifications.items = [
      {
        id: "permission-1",
        title: "درخواست مجوز جدید",
        body: "محمد: خروج عصرگاهی",
        isRead: false,
        url: "/admin/permission-requests",
      },
      { id: "read-1", title: "خوانده‌شده", isRead: true, url: "/admin/leave-requests" },
    ];

    render(
      <MemoryRouter>
        <SchoolIncomingPanel />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "پیگیری‌های ورودی" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /درخواست مجوز جدید/ })).toHaveAttribute(
      "href",
      "/admin/permission-requests",
    );
    expect(screen.queryByText("خوانده‌شده")).not.toBeInTheDocument();
  });

  it("offers a retry when incoming work cannot be loaded", () => {
    notifications.error = true;
    render(
      <MemoryRouter>
        <SchoolIncomingPanel />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("پیگیری‌های ورودی دریافت نشد");
  });
});

describe("SupervisorAttendanceLaunchpad", () => {
  it("links each attendance context to its shareable attendance section", () => {
    render(
      <MemoryRouter>
        <SupervisorAttendanceLaunchpad />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "حضور و غیاب مدرسه" })).toBeVisible();
    expect(screen.getByRole("link", { name: /کلاس‌ها/ })).toHaveAttribute(
      "href",
      "/admin/attendance?section=class",
    );
    expect(screen.getByRole("link", { name: /خوابگاه/ })).toHaveAttribute(
      "href",
      "/admin/attendance?section=dorm",
    );
    expect(screen.getByRole("link", { name: /گروه‌های کلاس/ })).toHaveAttribute(
      "href",
      "/admin/attendance?section=class_group",
    );
    expect(screen.getByRole("link", { name: /جلسات/ })).toHaveAttribute(
      "href",
      "/admin/attendance?section=sessions",
    );
  });
});
