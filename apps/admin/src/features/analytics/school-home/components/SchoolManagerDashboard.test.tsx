import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SchoolIncomingPanel } from "./SchoolManagerDashboard";

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
