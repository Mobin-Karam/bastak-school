import { useState } from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { api, getApiWorkContextKey, setApiWorkContext } from "../../shared/api/api";
import { AuthProvider, useAuth } from "./AuthProvider";

const originalFetch = globalThis.fetch;

function Probe() {
  const auth = useAuth();

  return (
    <div>
      <span>{auth.status}</span>
      <span>{auth.message}</span>
      <button onClick={() => void api.get("/protected").catch(() => undefined)}>protected</button>
      <button onClick={auth.stopRestore}>stop restore</button>
    </div>
  );
}

beforeEach(() => {
  setApiWorkContext();
  sessionStorage.clear();
  localStorage.clear();
});

afterEach(() => {
  cleanup();
  globalThis.fetch = originalFetch;
  vi.restoreAllMocks();
});

describe("AuthProvider", () => {
  it("accepts a Student-only account as a released workspace", async () => {
    globalThis.fetch = vi.fn(async (input) => {
      if (String(input).endsWith("/auth/me")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: { id: "student-1", role: "STUDENT", csrfToken: "csrf" },
          }),
          { status: 200 },
        );
      }
      if (String(input).endsWith("/me/context")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              user: { id: "student-1", role: "STUDENT" },
              roles: ["STUDENT"],
              capabilities: ["student.profile.read"],
              memberships: [],
              activeOrganization: null,
              availableOrganizations: [],
            },
          }),
          { status: 200 },
        );
      }
      return new Response(JSON.stringify({ ok: true, data: { loggedOut: true } }), { status: 200 });
    }) as typeof fetch;

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText("authenticated")).toBeInTheDocument();
    expect(screen.queryByText("این حساب مدیر نیست.")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("moshaver_admin_csrf")).toBe("csrf");
  });

  it("does not erase a possible session when the server is temporarily unreachable", async () => {
    globalThis.fetch = vi.fn(async () => {
      throw new TypeError("offline");
    }) as typeof fetch;

    const view = render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(
      await screen.findByText(
        "ارتباط با سرور برقرار نشد؛ تلاش 1 از 3 انجام شد و دوباره تلاش می‌کنیم…",
      ),
    ).toBeInTheDocument();

    expect(screen.getByText("checking")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "stop restore" }));

    expect(screen.getByText("anonymous")).toBeInTheDocument();
    expect(
      screen.getByText("بازیابی نشست متوقف شد. برای ادامه وارد حساب شوید."),
    ).toBeInTheDocument();

    view.unmount();
  });

  it("ends the local session when a later protected request returns 401", async () => {
    globalThis.fetch = vi.fn(async (input) => {
      if (String(input).endsWith("/auth/me")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: { id: "admin-1", role: "PLATFORM_ADMIN" },
          }),
          { status: 200 },
        );
      }
      if (String(input).endsWith("/me/context")) {
        return new Response(
          JSON.stringify({
            ok: true,
            data: {
              user: { id: "admin-1", role: "PLATFORM_ADMIN" },
              roles: ["PLATFORM_ADMIN"],
              capabilities: ["system.manage"],
              memberships: [],
              activeOrganization: null,
              availableOrganizations: [],
            },
          }),
          { status: 200 },
        );
      }
      return new Response(
        JSON.stringify({
          ok: false,
          error: {
            code: "UNAUTHORIZED",
            message: "نشست پایان یافته است",
          },
        }),
        { status: 401 },
      );
    }) as typeof fetch;

    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );

    expect(await screen.findByText("authenticated")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "protected" }));

    await waitFor(() => expect(screen.getByText("anonymous")).toBeInTheDocument());

    expect(screen.getByText("نشست پایان یافته است")).toBeInTheDocument();
  });
});

function SwitchProbe() {
  const auth = useAuth();
  const [error, setError] = useState("");
  return (
    <div>
      <span>{auth.status}</span>
      <span>{auth.activeRole}</span>
      <span>{auth.context?.activeOrganization?.id}</span>
      <span>{error}</span>
      <button
        onClick={() =>
          void auth
            .setActiveOrganization({
              id: "school-b",
              name: "B",
              type: "SCHOOL",
              membershipId: "mb",
            })
            .catch((e) => setError(e.message))
        }
      >
        switch school
      </button>
      <button
        onClick={() =>
          void auth.setActiveRole("SCHOOL_SUPERVISOR").catch((e) => setError(e.message))
        }
      >
        switch role
      </button>
    </div>
  );
}

const switchContext = (school: string, roles: string[]) => ({
  user: { id: "multi", role: "ADMIN" },
  roles,
  capabilities: [],
  workContexts: roles.map((role) => ({ role, capabilities: [] })),
  memberships: [
    { id: "school-a", name: "A", membershipId: "ma" },
    { id: "school-b", name: "B", type: "SCHOOL", membershipId: "mb" },
  ],
  activeOrganization: { id: school, name: school, membershipId: school },
  availableOrganizations: [
    { id: "school-a", name: "A", membershipId: "ma" },
    { id: "school-b", name: "B", type: "SCHOOL", membershipId: "mb" },
  ],
});
it("refreshes a proposed school without the previous role and chooses a valid new role", async () => {
  let resolveSwitch: (response: Response) => void = () => {};
  let selectedHeaders: Headers | undefined;
  globalThis.fetch = vi.fn(async (input, init) => {
    if (String(input).endsWith("/auth/me"))
      return new Response(JSON.stringify({ ok: true, data: { id: "multi", role: "ADMIN" } }));
    const headers = new Headers(init?.headers);
    if (headers.get("X-Organization-Id") === "school-b") {
      selectedHeaders = headers;
      return await new Promise<Response>((resolve) => {
        resolveSwitch = resolve;
      });
    }
    return new Response(
      JSON.stringify({
        ok: true,
        data: switchContext("school-a", ["TEACHER", "SCHOOL_SUPERVISOR"]),
      }),
    );
  }) as typeof fetch;
  render(
    <AuthProvider>
      <SwitchProbe />
    </AuthProvider>,
  );
  await screen.findByText("authenticated");
  await userEvent.click(screen.getByRole("button", { name: "switch school" }));
  await screen.findByText("checking");
  expect(selectedHeaders?.has("X-Work-Role")).toBe(false);
  expect(getApiWorkContextKey()).toBe("TEACHER:school-a");
  resolveSwitch(
    new Response(JSON.stringify({ ok: true, data: switchContext("school-b", ["PRINCIPAL"]) })),
  );
  await screen.findByText("PRINCIPAL");
  expect(screen.getByText("school-b")).toBeInTheDocument();
  expect(getApiWorkContextKey()).toBe("PRINCIPAL:school-b");
});
it("keeps the previous role and request headers after a failed role-context refresh", async () => {
  globalThis.fetch = vi.fn(async (input, init) => {
    if (String(input).endsWith("/auth/me"))
      return new Response(JSON.stringify({ ok: true, data: { id: "multi", role: "ADMIN" } }));
    if (new Headers(init?.headers).get("X-Work-Role") === "SCHOOL_SUPERVISOR")
      return new Response(
        JSON.stringify({ ok: false, error: { code: "WORK_CONTEXT_FORBIDDEN", message: "Denied" } }),
        { status: 403 },
      );
    return new Response(
      JSON.stringify({
        ok: true,
        data: switchContext("school-a", ["TEACHER", "SCHOOL_SUPERVISOR"]),
      }),
    );
  }) as typeof fetch;
  render(
    <AuthProvider>
      <SwitchProbe />
    </AuthProvider>,
  );
  await screen.findByText("authenticated");
  await userEvent.click(screen.getByRole("button", { name: "switch role" }));
  await screen.findByText("Denied");
  expect(screen.getByText("TEACHER")).toBeInTheDocument();
  expect(getApiWorkContextKey()).toBe("TEACHER:school-a");
});
