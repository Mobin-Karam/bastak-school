import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ThemeProvider, ThemeSwitcher } from "./theme";
import { LocaleProvider } from "../ui/locale";

describe("admin theme switcher", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );
  });

  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("defaults to light mode instead of following the system setting", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn((query: string) => ({
        matches: query === "(prefers-color-scheme: dark)",
        media: query,
        onchange: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        addListener: vi.fn(),
        removeListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    );

    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    expect(document.documentElement).not.toHaveClass("dark");
    expect(screen.getByRole("button", { name: "حالت روشن" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("offers light, dark and system modes and persists the selection", () => {
    render(
      <ThemeProvider>
        <ThemeSwitcher />
      </ThemeProvider>,
    );

    expect(screen.getAllByRole("button")).toHaveLength(3);
    act(() => fireEvent.click(screen.getByRole("button", { name: "حالت تیره" })));

    expect(document.documentElement).toHaveClass("dark");
    expect(window.localStorage.getItem("admin-theme-preference")).toBe("dark");
    expect(screen.getByRole("button", { name: "حالت تیره" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("uses English labels in the international LTR workspace", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <ThemeProvider>
          <ThemeSwitcher />
        </ThemeProvider>
      </LocaleProvider>,
    );

    expect(screen.getByRole("group", { name: "Appearance" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Use Dark" })).toBeInTheDocument();
  });
});
