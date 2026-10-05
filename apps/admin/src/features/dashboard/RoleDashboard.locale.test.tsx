import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../shared/ui/locale";
import { RoleDashboard } from "./components/RoleDashboard";

vi.mock("../auth", () => ({
  useAuth: () => ({ activeRole: "ADVISOR", capabilities: ["exams.read"], can: () => false }),
}));

describe("RoleDashboard localization", () => {
  afterEach(() => {
    cleanup();
    window.localStorage.clear();
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

    expect(screen.getByRole("heading", { name: "Advisor workspace" })).toBeVisible();
    expect(screen.getByText("Assigned students")).toBeVisible();
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

    expect(screen.getByRole("heading", { name: "Advisor workspace" })).toBeVisible();
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

    expect(screen.getByRole("heading", { name: "Platform health" })).toBeVisible();
    expect(screen.getByText("2.1.0")).toBeVisible();
    expect(screen.getByRole("group", { name: "Dashboard density" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "Compact" }));
    expect(
      window.localStorage.getItem("moshaver-admin:dashboard-view:role-workspace:PLATFORM_ADMIN"),
    ).toContain('"density":"compact"');
    fireEvent.click(screen.getByText("Layout"));
    fireEvent.click(screen.getByRole("checkbox", { name: "Platform health" }));
    expect(screen.queryByRole("heading", { name: "Platform health" })).not.toBeInTheDocument();
    expect(
      window.localStorage.getItem("moshaver-admin:dashboard-view:role-workspace:PLATFORM_ADMIN"),
    ).toContain('"id":"platform-health","zone":"secondary","order":5,"visible":false');
  });
});

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="dashboard-location">{location.search}</output>;
}
