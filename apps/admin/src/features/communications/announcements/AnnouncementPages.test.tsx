import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter, useLocation } from "react-router-dom";
import { LocaleProvider } from "../../../shared/ui/locale";
import { AnnouncementInboxPage, AnnouncementManagementPage } from "./AnnouncementPages";

const mocks = vi.hoisted(() => ({
  announcement: {
    id: "announcement-1",
    audience: "USERS",
    classroomId: null,
    title: "جلسه اولیا",
    body: "جلسه روز دوشنبه برگزار می‌شود.",
    category: "مدرسه",
    linkUrl: null,
    mediaUrl: null,
    mediaType: null,
    recipientIds: ["user-1"],
    status: "ACTIVE",
    publishedAt: "2026-10-20T08:00:00.000Z",
    expiresAt: "2026-10-21T08:00:00.000Z",
    createdAt: "2026-10-20T08:00:00.000Z",
  },
  notification: {
    id: "notification-1",
    title: "جلسه اولیا",
    type: "announcement",
    isRead: false,
    data: { announcementId: "announcement-1" },
  },
  markRead: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@tanstack/react-query", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@tanstack/react-query")>();
  return {
    ...actual,
    useQuery: () => ({
      data: [mocks.announcement],
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    }),
  };
});

vi.mock("../../identity/auth", () => ({
  useAuth: () => ({
    context: { activeOrganization: { id: "school-1" } },
    can: (capability: string) => capability === "announcements.read",
  }),
}));

vi.mock("../notifications/hooks/useAdminNotifications", () => ({
  useAdminNotifications: () => ({
    items: [mocks.notification],
    markRead: mocks.markRead,
  }),
}));

vi.mock("../../../shared/ui/floating-island", () => ({
  useFloatingIsland: () => ({ show: vi.fn(), expand: vi.fn() }),
}));

vi.mock("react-router-dom", async (importOriginal) => {
  const actual = await importOriginal<typeof import("react-router-dom")>();
  return {
    ...actual,
    useNavigate: () => mocks.navigate,
  };
});

describe("AnnouncementInboxPage", () => {
  beforeEach(() => {
    mocks.markRead.mockClear();
    mocks.navigate.mockClear();
  });

  afterEach(cleanup);

  it("keeps old announcement links compatible by moving them into the notification inbox", async () => {
    function Location() {
      const location = useLocation();
      return <output>{`${location.pathname}${location.search}`}</output>;
    }
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LocaleProvider>
          <MemoryRouter initialEntries={["/admin/announcements?announcementId=announcement-1"]}>
            <AnnouncementInboxPage />
            <Location />
          </MemoryRouter>
        </LocaleProvider>
      </QueryClientProvider>,
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "/admin/communication/notifications?type=announcement&announcementId=announcement-1",
        ),
      ).toBeInTheDocument(),
    );
  });
});

describe("AnnouncementManagementPage", () => {
  afterEach(cleanup);

  it("keeps announcement management disabled for future use", () => {
    render(
      <MemoryRouter>
        <AnnouncementManagementPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "مدیریت اطلاعیه‌ها فعلاً غیرفعال است" }),
    ).toBeInTheDocument();
    expect(screen.getByText("در آینده به این بخش برمی‌گردیم.")).toBeInTheDocument();
  });
});
