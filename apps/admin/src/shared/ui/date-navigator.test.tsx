import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { CalendarCheck2, Clock3 } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DateNavigator } from "./date-navigator";
import { LocaleProvider } from "./locale";

afterEach(cleanup);

describe("DateNavigator", () => {
  it("renders feature-owned icon metadata and selects a day", async () => {
    const onChange = vi.fn();
    render(
      <LocaleProvider>
        <DateNavigator
          value="2026-08-31"
          onChange={onChange}
          days={[
            { date: "2026-08-30", items: [{ id: "clock", label: "جلسه", icon: Clock3 }] },
            {
              date: "2026-08-31",
              items: [
                { id: "attendance", label: "حضور کامل", icon: CalendarCheck2, tone: "success" },
              ],
            },
          ]}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("حضور کامل")).toBeInTheDocument();
    const previousDay = screen.getByRole("option", { name: /شهریور ۸/ });
    expect(previousDay).toHaveAttribute("aria-selected", "false");
    await userEvent.click(previousDay);
    expect(onChange).toHaveBeenCalledWith("2026-08-30");
  });

  it("supports a feature-specific day renderer", () => {
    render(
      <LocaleProvider>
        <DateNavigator
          value="2026-08-31"
          onChange={() => undefined}
          days={[{ date: "2026-08-31", render: () => <span>زمان‌بندی اختصاصی</span> }]}
        />
      </LocaleProvider>,
    );
    expect(screen.getByText("زمان‌بندی اختصاصی")).toBeInTheDocument();
  });

  it("keeps keyboard navigation chronological in RTL", () => {
    const onChange = vi.fn();
    render(
      <LocaleProvider>
        <DateNavigator
          value="2026-08-31"
          onChange={onChange}
          days={[{ date: "2026-08-30" }, { date: "2026-08-31" }, { date: "2026-09-01" }]}
        />
      </LocaleProvider>,
    );

    const selected = screen.getByRole("option", { selected: true });
    expect(selected).toHaveAttribute("aria-current", "date");
    fireEvent.keyDown(screen.getByRole("listbox"), { key: "ArrowLeft" });
    expect(onChange).toHaveBeenCalledWith("2026-09-01");
  });
});
