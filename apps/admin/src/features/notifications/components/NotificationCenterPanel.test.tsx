import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AdminNotification } from "../model/notification-model";
import { NotificationCenterPanel } from "./NotificationCenterPanel";

const mocks = vi.hoisted(() => ({
  notifications: {
    items: [] as AdminNotification[],
    unread: 1,
    loading: false,
    error: false,
    errorMessage: "",
    hasMore: false,
    loadingMore: false,
    refreshing: false,
    markingAllRead: false,
    markRead: vi.fn(),
    markAllRead: vi.fn(),
    loadMore: vi.fn(),
    refresh: vi.fn(),
  },
}));

vi.mock("../hooks/useAdminNotifications", () => ({
  useAdminNotifications: () => mocks.notifications,
}));
vi.mock("../../../shared/ui/locale", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../shared/ui/locale")>()),
  useLocale: () => ({ language: "fa", formatDateTime: (value: string) => value }),
}));

describe("NotificationCenterPanel", () => {
  beforeEach(() => {
    mocks.notifications.items = [
      {
        id: "notice-1",
        title: "پیام جدید",
        body: "پیام آزمایشی",
        type: "message",
        isRead: false,
        createdAt: "2026-10-01T10:00:00.000Z",
      },
    ];
    mocks.notifications.error = false;
    mocks.notifications.loading = false;
  });

  it("uses the shared list shell while retaining notification controls", () => {
    mocks.notifications.hasMore = true;
    render(
      <MemoryRouter>
        <NotificationCenterPanel
          mobilePanel="notifications"
          filter="all"
          setFilter={vi.fn()}
          typeFilter="all"
          setTypeFilter={vi.fn()}
          search=""
          setSearch={vi.fn()}
          items={mocks.notifications.items}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "اعلان‌های مدیر" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /خواندن همه/ })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "جستجوی اعلان‌ها" })).toBeInTheDocument();
    expect(screen.getByText("پیام جدید")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "نمایش اعلان‌های بیشتر" })).toBeInTheDocument();
    mocks.notifications.hasMore = false;
  });

  it("uses the shared retry state when the inbox request fails", () => {
    mocks.notifications.items = [];
    mocks.notifications.error = true;
    mocks.notifications.errorMessage = "خطای دریافت";
    render(
      <MemoryRouter>
        <NotificationCenterPanel
          mobilePanel="notifications"
          filter="all"
          setFilter={vi.fn()}
          typeFilter="all"
          setTypeFilter={vi.fn()}
          search=""
          setSearch={vi.fn()}
          items={[]}
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("خطای دریافت");
    expect(screen.getByRole("button", { name: /تلاش دوباره/ })).toBeInTheDocument();
  });
});
