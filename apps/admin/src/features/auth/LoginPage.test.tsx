import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AuthProvider } from "./AuthProvider";
import { LoginPage } from "./LoginPage";
import { ThemeProvider } from "../../shared/theme/theme";
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
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );

    await userEvent.click(await screen.findByRole("button", { name: "ورود" }));

    expect(await screen.findByText("شماره همراه معتبر لازم است")).toBeInTheDocument();

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
        <ThemeProvider>
          <LocaleProvider>
            <AuthProvider>
              <LoginPage />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
      </MemoryRouter>,
    );
    await userEvent.click(await screen.findByText("ورود سریع نقش‌های آزمایشی"));
    await userEvent.click(screen.getAllByRole("button", { name: /مدیر سازمان/ })[0]);
    expect(screen.getByLabelText("شماره همراه")).toHaveValue("09127873545");
    expect(screen.getByLabelText("رمز عبور")).toHaveValue("Moshaver-demo-2026!");
    expect(
      screen.getAllByRole("button", {
        name: /سرپرست|مشاور|دبیر|منتور|مدیر محتوا|مدیر سازمان|مدیر پلتفرم|چندنقشی/,
      }),
    ).toHaveLength(7);
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

    expect(await screen.findByRole("heading", { name: "خوش آمدید" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "English" })).not.toBeInTheDocument();
    expect(document.documentElement).toHaveAttribute("dir", "rtl");
    expect(document.documentElement).toHaveAttribute("lang", "fa-IR");
  });
});
