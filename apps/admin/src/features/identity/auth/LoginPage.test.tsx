import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { LoginPage } from "./LoginPage";
import { ThemeProvider } from "../../../shared/theme/theme";
import { LocaleProvider } from "../../../shared/ui/locale";
import { currentAppDomain } from "../../../app/routing/portal-domain";

vi.mock("../../../app/routing/portal-domain", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../../app/routing/portal-domain")>()),
  currentAppDomain: vi.fn(() => "local"),
}));

afterEach(cleanup);
beforeEach(() => {
  localStorage.clear();
  vi.mocked(currentAppDomain).mockReturnValue("local");
});

describe("LoginPage", () => {
  it("validates required fields", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(
          JSON.stringify({
            ok: false,
            error: { message: "unauthorized" },
          }),
          { status: 401 },
        ),
    ) as typeof fetch;

    render(
      <MemoryRouter>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "ادامه" }));

    expect(await screen.findByText("شماره همراه معتبر لازم است")).toBeInTheDocument();

    expect(screen.queryByLabelText("رمز عبور")).not.toBeInTheDocument();
  });

  it.each([true, false])(
    "checks the phone before revealing the password (exists=%s)",
    async (exists) => {
      globalThis.fetch = vi.fn(async (input) => {
        if (String(input).includes("check-phone"))
          return new Response(JSON.stringify({ ok: true, data: { exists } }));
        return new Response(JSON.stringify({ ok: false, error: { message: "unauthorized" } }), {
          status: 401,
        });
      }) as typeof fetch;
      render(
        <MemoryRouter>
          <ThemeProvider>
            <LocaleProvider>
              <AuthProvider>
                <LoginPage />
              </AuthProvider>
            </LocaleProvider>
          </ThemeProvider>
        </MemoryRouter>,
      );
      const phone = await screen.findByLabelText("شماره همراه");
      expect(screen.queryByLabelText("رمز عبور")).not.toBeInTheDocument();
      await userEvent.type(phone, "09123456789");
      await userEvent.click(screen.getByRole("button", { name: "ادامه" }));
      if (!exists) {
        expect(await screen.findByText(/حسابی با این شماره یافت نشد/)).toBeInTheDocument();
        expect(screen.queryByLabelText("رمز عبور")).not.toBeInTheDocument();
        return;
      }
      expect(await screen.findByLabelText("رمز عبور")).toHaveFocus();
      await userEvent.click(screen.getByRole("button", { name: "ورود" }));
      expect(await screen.findByText("رمز عبور لازم است")).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "تغییر شماره" }));
      expect(screen.getByLabelText("شماره همراه")).toHaveValue("09123456789");
      expect(screen.queryByLabelText("رمز عبور")).not.toBeInTheDocument();
    },
  );

  it("submits the checked phone and password together", async () => {
    const fetchMock = vi.fn(async (input: RequestInfo | URL, _init?: RequestInit) => {
      if (String(input).includes("check-phone"))
        return new Response(JSON.stringify({ ok: true, data: { exists: true } }));
      return new Response(
        JSON.stringify({ ok: false, error: { message: "Invalid credentials" } }),
        { status: 401 },
      );
    });
    globalThis.fetch = fetchMock as typeof fetch;
    render(
      <MemoryRouter>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    await userEvent.type(await screen.findByLabelText("شماره همراه"), "09123456789");
    await userEvent.click(screen.getByRole("button", { name: "ادامه" }));
    await userEvent.type(await screen.findByLabelText("رمز عبور"), "fixture-password");
    await userEvent.click(screen.getByRole("button", { name: "ورود" }));
    expect(await screen.findByText("Invalid credentials")).toBeInTheDocument();
    const loginCall = fetchMock.mock.calls.find(([input]) => String(input).endsWith("/auth/login"));
    expect(loginCall).toBeDefined();
    expect(JSON.parse(loginCall![1]!.body as string)).toEqual({
      phoneNumber: "09123456789",
      password: "fixture-password",
    });
  });

  it("starts with an empty phone field without demo credentials", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: false, error: { message: "unauthorized" } }), {
          status: 401,
        }),
    ) as typeof fetch;
    render(
      <MemoryRouter>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    expect(await screen.findByLabelText("شماره همراه")).toHaveValue("");
    expect(screen.queryByText("ورود سریع نقش‌های آزمایشی")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("رمز عبور")).not.toBeInTheDocument();
  });

  it("keeps localization available while omitting the language-switch control", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true, data: { status: "ok" } })),
    ) as typeof fetch;

    render(
      <MemoryRouter>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "ورود به میز کار" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "English" })).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(document.documentElement).toHaveAttribute("lang", "fa-IR");
  });

  it("uses the dedicated student portal login presentation on the student hostname", async () => {
    vi.mocked(currentAppDomain).mockReturnValue("student");
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true, data: { status: "ok" } })),
    ) as typeof fetch;

    render(
      <MemoryRouter>
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    expect(await screen.findByRole("heading", { name: "ورود دانش‌آموزان" })).toBeInTheDocument();
    expect(screen.getByText("پرتال دانش‌آموزی")).toBeInTheDocument();
    expect(screen.getByText("برنامه")).toBeInTheDocument();
    expect(screen.getByText("کتابخانه")).toBeInTheDocument();
  });
});
