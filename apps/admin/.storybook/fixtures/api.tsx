import { useLayoutEffect, type ReactNode } from "react";

type Fixture = Record<string, unknown> | readonly unknown[];

const dashboardFixture = {
  context: "SCHOOL_ADMIN",
  generatedAt: "2026-10-20T00:00:00.000Z",
  assignedStudents: 84,
  unreadConversations: 5,
  attentionStudents: 4,
  taskIssues: 2,
  recoveryRequests: 1,
  retryRequests: 2,
  organizations: 1,
  members: 36,
  students: 84,
  staff: 18,
};

function fixtureFor(pathname: string): Fixture {
  if (pathname.endsWith("/dashboard")) return dashboardFixture;
  if (pathname.endsWith("/dashboard/work-queue")) return { generatedAt: dashboardFixture.generatedAt, items: [] };
  if (pathname.endsWith("/auth/me/context")) return { user: { id: "storybook-admin", displayName: "مدیر نمونه", role: "SCHOOL_ADMIN" }, roles: ["SCHOOL_ADMIN"], capabilities: [], memberships: [], activeOrganization: null, availableOrganizations: [] };
  if (pathname.endsWith("/auth/me")) return { id: "storybook-admin", csrfToken: "storybook" };
  return [];
}

/** Prevents Storybook pages from reaching a live backend; expand fixtures per feature story. */
export function StorybookApiFixture({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    const originalFetch = window.fetch;
    window.fetch = async (input, init) => {
      const requestUrl =
        typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
      const url = new URL(requestUrl, window.location.origin);
      if (!url.pathname.includes("/api/v2/")) return originalFetch(input, init);
      return new Response(JSON.stringify({ ok: true, data: fixtureFor(url.pathname) }), { status: 200, headers: { "Content-Type": "application/json" } });
    };
    return () => { window.fetch = originalFetch; };
  }, []);
  return <>{children}</>;
}
