import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingIslandProvider } from "../../../shared/ui/floating-island";
import type { AdminShellModel } from "../hooks/use-admin-shell-model";
import { AdminFloatingIsland } from "./AdminFloatingIsland";

const getAdminDashboard = vi.fn();

vi.mock("../../../features/analytics/dashboard/api/dashboard.api", () => ({
  getAdminDashboard: (...args: unknown[]) => getAdminDashboard(...args),
}));

function model({
  authenticated = true,
  canReadAnnouncements = false,
  unread = 0,
}: {
  authenticated?: boolean;
  canReadAnnouncements?: boolean;
  unread?: number;
} = {}) {
  return {
    auth: {
      user: authenticated ? { id: "user-1" } : null,
      status: authenticated ? "authenticated" : "anonymous",
      activeRole: "STUDENT",
      context: { activeOrganization: { id: "organization-1" } },
      can: (capability: string) => capability === "announcements.read" && canReadAnnouncements,
    },
    notificationState: {
      unread,
      items: unread
        ? [
            {
              id: "notification-1",
              title: "اعلان خصوصی",
              body: "فقط برای این کاربر",
              isRead: false,
            },
          ]
        : [],
    },
    direction: "rtl",
    performance: "reduced",
  } as unknown as AdminShellModel;
}

function renderIsland(shellModel: AdminShellModel) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <MemoryRouter>
      <QueryClientProvider client={client}>
        <FloatingIslandProvider>
          <AdminFloatingIsland model={shellModel} />
        </FloatingIslandProvider>
      </QueryClientProvider>
    </MemoryRouter>,
  );
}

describe("AdminFloatingIsland", () => {
  afterEach(() => {
    cleanup();
    getAdminDashboard.mockReset();
  });

  it("does not fetch or show announcements without announcements.read", () => {
    renderIsland(model());

    expect(getAdminDashboard).not.toHaveBeenCalled();
    expect(screen.queryByRole("button", { name: /اطلاعیه/ })).not.toBeInTheDocument();
  });

  it("does not show retained notification state after sign-out", () => {
    renderIsland(model({ authenticated: false, unread: 1 }));

    expect(screen.queryByRole("button", { name: /اعلان خصوصی/ })).not.toBeInTheDocument();
  });

  it("removes every queued notification activity after all notifications are read", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const view = (shellModel: AdminShellModel) => (
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <FloatingIslandProvider>
            <AdminFloatingIsland model={shellModel} />
          </FloatingIslandProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );
    const rendered = render(view(model({ unread: 1 })));

    expect(await screen.findByRole("button", { name: /اعلان خصوصی/ })).toBeVisible();

    rendered.rerender(view(model({ unread: 0 })));

    await waitFor(() => {
      expect(screen.queryByRole("button", { name: /اعلان خصوصی/ })).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /خوانده‌نشده/ })).not.toBeInTheDocument();
    });
  });

  it("shows an active announcement only to a user with its read capability", async () => {
    getAdminDashboard.mockResolvedValue({
      home: {
        announcements: [
          {
            id: "announcement-1",
            title: "اطلاعیه مدرسه",
            body: "فقط برای مخاطبان مجاز",
            status: "ACTIVE",
            publishedAt: new Date().toISOString(),
            expiresAt: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });

    renderIsland(model({ canReadAnnouncements: true }));

    expect(await screen.findByRole("button", { name: /اطلاعیه مدرسه/ })).toBeVisible();
  });
});
