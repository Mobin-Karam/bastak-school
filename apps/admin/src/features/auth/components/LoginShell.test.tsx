import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";
import { ThemeProvider, ThemeSwitcher } from "../../../shared/theme/theme";
import { LocaleProvider } from "../../../shared/ui/locale";
import { LoginShell } from "./LoginShell";

beforeEach(() => localStorage.clear());
afterEach(() => {
  cleanup();
  document.documentElement.classList.remove("dark");
});
it("defaults auth to dark, keeps its preference separate, and restores the workspace theme", async () => {
  localStorage.setItem("admin-theme-preference", "light");
  const view = render(
    <LocaleProvider>
      <ThemeProvider>
        <LoginShell>
          <ThemeSwitcher />
        </LoginShell>
      </ThemeProvider>
    </LocaleProvider>,
  );
  expect(document.documentElement).toHaveClass("dark");
  await userEvent.click(screen.getByRole("button", { name: "حالت روشن" }));
  expect(document.documentElement).not.toHaveClass("dark");
  expect(localStorage.getItem("auth-theme-preference")).toBe("light");
  expect(localStorage.getItem("admin-theme-preference")).toBe("light");
  await userEvent.click(screen.getByRole("button", { name: "حالت تیره" }));
  view.rerender(
    <LocaleProvider>
      <ThemeProvider>
        <div>Workspace</div>
      </ThemeProvider>
    </LocaleProvider>,
  );
  expect(document.documentElement).not.toHaveClass("dark");
});
it("honors a saved auth preference even when the workspace uses a different theme", () => {
  localStorage.setItem("admin-theme-preference", "dark");
  localStorage.setItem("auth-theme-preference", "light");
  render(
    <LocaleProvider>
      <ThemeProvider>
        <LoginShell>Login</LoginShell>
      </ThemeProvider>
    </LocaleProvider>,
  );
  expect(document.documentElement).not.toHaveClass("dark");
});
