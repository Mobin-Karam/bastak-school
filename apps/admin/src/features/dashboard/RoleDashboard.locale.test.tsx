import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../shared/ui/locale";
import { RoleDashboard } from "./components/RoleDashboard";

const { viewportShellMock } = vi.hoisted(() => ({
  viewportShellMock: vi.fn(() => "desktop"),
}));

vi.mock("../auth", () => ({
  useAuth: () => ({ activeRole: "ADVISOR", capabilities: ["exams.read"], can: () => false }),
}));

vi.mock("../../app/layout/lib/viewport-shell", () => ({
  useViewportShell: viewportShellMock,
}));

describe("RoleDashboard localization", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
    viewportShellMock.mockReturnValue("desktop");
  });

  it("renders the active English role workspace in LTR", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <MemoryRouter>
        <LocaleProvider>
          <RoleDashboard
            data={{
              context: "ADVISOR",
              generatedAt: "2026-01-01T00:00:00.000Z",
              assignedStudents: 2,
              unreadConversations: 1,
            }}
            loading={false}
            error={false}
            refreshing={false}
            workItems={[]}
            workLoading={false}
            workError={false}
            onRefresh={vi.fn()}
            onRetry={vi.fn()}
            onRetryWork={vi.fn()}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("region", { name: "Advisor workspace" })[0]).toBeVisible();
    expect(screen.getAllByText("Assigned students")[0]).toBeVisible();
    expect(screen.queryByRole("link", { name: "Assessments" })).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });

  it("keeps hook order stable while dashboard data changes from loading to ready", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    const props = {
      refreshing: false,
      error: false,
      workItems: [],
      workLoading: false,
      workError: false,
      onRefresh: vi.fn(),
      onRetry: vi.fn(),
      onRetryWork: vi.fn(),
    };
    const { rerender } = render(
      <MemoryRouter>
        <LocaleProvider>
          <RoleDashboard {...props} loading data={undefined} />
        </LocaleProvider>
      </MemoryRouter>,
    );

    rerender(
      <MemoryRouter>
        <LocaleProvider>
          <RoleDashboard
            {...props}
            loading={false}
            data={{
              context: "ADVISOR",
              generatedAt: "2026-01-01T00:00:00.000Z",
              assignedStudents: 2,
              unreadConversations: 1,
            }}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("region", { name: "Advisor workspace" })[0]).toBeVisible();
  });

  it("keeps unrelated URL context while sharing only presentation choices", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <MemoryRouter initialEntries={["/admin?studentId=student-1"]}>
        <LocaleProvider>
          <LocationProbe />
          <RoleDashboard
            data={{
              context: "ADVISOR",
              generatedAt: "2026-01-01T00:00:00.000Z",
              assignedStudents: 2,
              unreadConversations: 1,
            }}
            loading={false}
            error={false}
            refreshing={false}
            workItems={[]}
            workLoading={false}
            workError={false}
            onRefresh={vi.fn()}
            onRetry={vi.fn()}
            onRetryWork={vi.fn()}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(screen.getByTestId("dashboard-location")).toHaveTextContent(
      "?studentId=student-1&dashboard-density=compact",
    );
  });

  it("mounts the task-focused home only for the mobile shell", () => {
    viewportShellMock.mockReturnValue("mobile");

    render(
      <MemoryRouter>
        <LocaleProvider>
          <RoleDashboard
            data={{
              context: "ADVISOR",
              generatedAt: "2026-01-01T00:00:00.000Z",
              assignedStudents: 2,
              unreadConversations: 1,
            }}
            loading={false}
            error={false}
            refreshing={false}
            workItems={[]}
            workLoading={false}
            workError={false}
            onRefresh={vi.fn()}
            onRetry={vi.fn()}
            onRetryWork={vi.fn()}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getByRole("region", { name: "خانه موبایل" })).toBeVisible();
  });

  it("renders the platform health decision widget for the platform role", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <MemoryRouter>
        <LocaleProvider>
          <RoleDashboard
            data={{
              context: "PLATFORM_ADMIN",
              generatedAt: "2026-01-01T00:00:00.000Z",
              assignedStudents: 0,
              unreadConversations: 0,
              organizations: 4,
              users: 12,
              systemHealth: { database: "ok" },
              releaseStatus: { version: "2.1.0", environment: "production" },
              auditSummary: { events24h: 3, lockedLogins: 1 },
            }}
            loading={false}
            error={false}
            refreshing={false}
            workItems={[]}
            workLoading={false}
            workError={false}
            onRefresh={vi.fn()}
            onRetry={vi.fn()}
            onRetryWork={vi.fn()}
          />
        </LocaleProvider>
      </MemoryRouter>,
    );

    expect(screen.getAllByRole("heading", { name: "Platform health" })[0]).toBeVisible();
    expect(screen.getAllByText("2.1.0")[0]).toBeVisible();
    expect(screen.getByRole("group", { name: "Dashboard density" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(
      window.localStorage.getItem("moshaver-admin:dashboard-view:role-workspace:PLATFORM_ADMIN"),
    ).toContain('"density":"compact"');
    fireEvent.click(screen.getAllByRole("button", { name: "Layout" })[0]);
    fireEvent.click(screen.getAllByRole("checkbox", { name: "Platform health" })[0]);
    expect(screen.queryAllByRole("heading", { name: "Platform health" })).toHaveLength(0);
    expect(
      window.localStorage.getItem("moshaver-admin:dashboard-view:role-workspace:PLATFORM_ADMIN"),
    ).toContain('"id":"platform-health","zone":"secondary","order":5,"visible":false');
  });
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="dashboard-location">{location.search}</output>;
}
