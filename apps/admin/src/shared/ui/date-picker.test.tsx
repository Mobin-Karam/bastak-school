import { ResponsiveModal } from "./responsive-modal";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DatePicker } from "./date-picker";
import { LocaleProvider } from "./locale";
import { Button } from "./ui";

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("localized calendar and loading controls", () => {
  it("renders ISO values as a Persian calendar for Iran", async () => {
    localStorage.setItem("moshaver-admin-location", "iran");
    render(
      <LocaleProvider>
        <DatePicker value="2026-08-31" onChange={() => undefined} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: /شهریور/ })).toHaveTextContent("۱۴۰۵");
    await userEvent.click(screen.getByRole("button", { name: /شهریور/ }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("selects Farvardin within the current Shamsi year and emits its canonical ISO date", async () => {
    const onChange = vi.fn();
    render(
      <LocaleProvider>
        <DatePicker
          calendar="persian"
          ariaLabel="تاریخ شمسی"
          value="2026-08-31"
          onChange={onChange}
        />
      </LocaleProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "تاریخ شمسی" }));
    await userEvent.click(screen.getByRole("button", { name: /شهریور/ }));
    await userEvent.click(screen.getByRole("button", { name: "فروردین" }));
    await userEvent.click(screen.getByRole("button", { name: "۱" }));
    expect(onChange).toHaveBeenCalledWith("2026-03-21");
  });
  it("changes Shamsi years exactly and clamps a leap day to the target month's last day", async () => {
    const change = vi.fn();
    render(
      <LocaleProvider>
        <DatePicker
          calendar="persian"
          ariaLabel="تاریخ شمسی"
          value="2025-03-20"
          onChange={change}
        />
      </LocaleProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "تاریخ شمسی" }));
    await userEvent.click(screen.getByRole("button", { name: "۱۴۰۳" }));
    await userEvent.click(screen.getByRole("button", { name: "۱۴۰۴" }));
    await userEvent.click(screen.getByRole("button", { name: "۲۹" }));
    expect(change).toHaveBeenCalledWith("2026-03-20");
  });
  it("opens a blank bounded picker inside its historical range", async () => {
    render(
      <LocaleProvider>
        <DatePicker
          calendar="persian"
          ariaLabel="تاریخ محدود"
          today="2026-10-12"
          value=""
          min="2025-03-21"
          max="2025-04-20"
          onChange={() => undefined}
        />
      </LocaleProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "تاریخ محدود" }));
    expect(screen.getByRole("button", { name: /فروردین/ })).toBeVisible();
    expect(screen.getByRole("button", { name: "۱" })).toBeEnabled();
  });
  it.each([false, true])(
    "keeps calendar selection and Escape inside its modal (mobile=%s)",
    async (mobile) => {
      const original = window.matchMedia;
      window.matchMedia = vi.fn().mockReturnValue({
        matches: mobile,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      });
      const change = vi.fn(),
        close = vi.fn();
      try {
        render(
          <LocaleProvider>
            <ResponsiveModal
              open
              onOpenChange={close}
              title="تنظیم سال"
              description="تاریخ را انتخاب کنید"
            >
              <DatePicker
                calendar="persian"
                ariaLabel="تاریخ شمسی"
                value="2026-08-31"
                onChange={change}
              />
            </ResponsiveModal>
          </LocaleProvider>,
        );
        const outer = screen.getByRole("dialog");
        await userEvent.click(screen.getByRole("button", { name: "تاریخ شمسی" }));
        expect(outer.querySelector('[role="dialog"]')).not.toBeNull();
        await userEvent.click(screen.getByRole("button", { name: "۹" }));
        expect(change).toHaveBeenCalledWith("2026-08-31");
        expect(screen.getByRole("button", { name: "تاریخ شمسی" })).toHaveFocus();
        expect(close).not.toHaveBeenCalled();
        await userEvent.click(screen.getByRole("button", { name: "تاریخ شمسی" }));
        await userEvent.keyboard("{Escape}");
        expect(close).not.toHaveBeenCalled();
        expect(outer.querySelector('[role="dialog"]')).toBeNull();
      } finally {
        window.matchMedia = original;
      }
    },
  );
  it("shows an accessible circular loader and disables a pending button", () => {
    render(<Button loading>ذخیره</Button>);
    const button = screen.getByRole("button", { name: "ذخیره" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button.querySelector("svg")).toHaveClass("animate-spin");
  });

  it("supports clearing an optional date from the keyboard", async () => {
    const onChange = vi.fn();
    render(
      <LocaleProvider>
        <DatePicker value="2026-08-31" onChange={onChange} />
      </LocaleProvider>,
    );
    const trigger = screen.getByRole("button", { name: /برای پاک کردن/ });
    trigger.focus();
    await userEvent.keyboard("{Delete}");
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("does not expose clear behavior for a required date", async () => {
    const onChange = vi.fn();
    render(
      <LocaleProvider>
        <DatePicker required value="2026-08-31" onChange={onChange} />
      </LocaleProvider>,
    );
    const trigger = screen.getByRole("button", { name: /۱۴۰۵/ });
    trigger.focus();
    await userEvent.keyboard("{Delete}");
    expect(onChange).not.toHaveBeenCalled();
  });

  it("handles an invalid external value without rendering an invalid date", () => {
    render(
      <LocaleProvider>
        <DatePicker value="not-a-date" onChange={() => undefined} />
      </LocaleProvider>,
    );
    expect(screen.getByRole("button", { name: "انتخاب تاریخ" })).toHaveTextContent("انتخاب تاریخ");
  });

  it("uses English labels and the configured Persian calendar in the international workspace", async () => {
    localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <DatePicker value="2026-08-31" onChange={() => undefined} />
      </LocaleProvider>,
    );
    const trigger = screen.getByRole("button", { name: /Shahrivar|شهریور|1405/ });
    expect(trigger).toHaveTextContent("1405");
    await userEvent.click(trigger);
    expect(screen.getByRole("button", { name: "Previous month" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Today" })).toBeInTheDocument();
  });
});
