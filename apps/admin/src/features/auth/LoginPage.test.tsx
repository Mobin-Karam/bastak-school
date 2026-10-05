import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { LoginPage } from "./LoginPage";
import { LocaleProvider } from "../../shared/ui/locale";

afterEach(cleanup);
beforeEach(() => localStorage.clear());

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
        <LocaleProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </LocaleProvider>
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "ورود" }));

    expect(await screen.findByText("نام کاربری لازم است")).toBeInTheDocument();

    expect(screen.getByText("رمز عبور لازم است")).toBeInTheDocument();
  });

  it("fills credentials for every Admin v2 demo role", async () => {
    globalThis.fetch = vi.fn(
      async () =>
        new Response(JSON.stringify({ ok: false, error: { message: "unauthorized" } }), {
          status: 401,
        }),
    ) as typeof fetch;
    render(
      <MemoryRouter>
        <LocaleProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </LocaleProvider>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByText("ورود سریع نقش‌های آزمایشی"));
    await userEvent.click(screen.getByRole("button", { name: /مدیر سازمان/ }));
    expect(screen.getByLabelText("نام کاربری")).toHaveValue("e2e.orgadmin.a");
    expect(screen.getByLabelText("رمز عبور")).toHaveValue("Moshaver-e2e-2026!");
    expect(
      screen.getAllByRole("button", {
        name: /سرپرست|مشاور|دبیر|منتور|مدیر محتوا|مدیر سازمان|مدیر پلتفرم|چندنقشی/,
      }),
    ).toHaveLength(8);
  });

  it("switches the sign-in flow to English and changes document direction", async () => {
    globalThis.fetch = vi.fn(
      async () => new Response(JSON.stringify({ ok: true, data: { status: "ok" } })),
    ) as typeof fetch;

    render(
      <MemoryRouter>
        <LocaleProvider>
          <AuthProvider>
            <LoginPage />
          </AuthProvider>
        </LocaleProvider>
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "English" }));

    expect(await screen.findByRole("heading", { name: "Welcome back" })).toBeInTheDocument();
    expect(screen.getByLabelText("Username")).toHaveAttribute("dir", "ltr");
    expect(screen.getByRole("button", { name: "Show password" })).toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
    expect(document.documentElement).toHaveAttribute("lang", "en-US");
  });
});
