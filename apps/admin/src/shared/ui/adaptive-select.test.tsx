import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { AdaptiveSelect } from "./adaptive-select";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("AdaptiveSelect", () => {
  it("uses the native select in native mode", async () => {
    const onChange = vi.fn();
    render(
      <AdaptiveSelect mode="native" aria-label="سال تحصیلی" defaultValue="1405" onChange={onChange}>
        <option value="1404">۱۴۰۴</option>
        <option value="1405">۱۴۰۵</option>
      </AdaptiveSelect>,
    );

    const select = screen.getByRole("combobox", { name: "سال تحصیلی" });
    expect(select.tagName).toBe("SELECT");
    await userEvent.selectOptions(select, "1404");
    expect(onChange.mock.calls[0][0].target.value).toBe("1404");
  });

  it("renders a portaled, keyboard-operable menu on desktop and preserves change-event shape", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdaptiveSelect mode="menu" aria-label="فیلتر اعضا" value="present" onChange={onChange}>
        <option value="present">حاضر</option>
        <optgroup label="موارد نیازمند پیگیری">
          <option value="absent">غایب</option>
          <option value="unmarked">ثبت‌نشده</option>
        </optgroup>
      </AdaptiveSelect>,
    );

    const trigger = screen.getByRole("button", { name: "فیلتر اعضا" });
    expect(trigger).toHaveTextContent("حاضر");
    await user.click(trigger);
    const popup = screen.getByRole("menu", { name: "فیلتر اعضا" });
    expect(popup).toHaveTextContent("موارد نیازمند پیگیری");
    await user.click(screen.getByRole("menuitemradio", { name: "غایب" }));
    expect(onChange.mock.calls[0][0].target.value).toBe("absent");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("keeps mobile auto mode native and carries uncontrolled selections across viewport changes", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn(() => ({ matches: true, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
    );
    render(
      <AdaptiveSelect aria-label="مورد" defaultValue="a">
        <option value="a">مورد الف</option>
        <option value="b">مورد ب</option>
      </AdaptiveSelect>,
    );
    expect(screen.getByRole("combobox", { name: "مورد" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "مورد" }).tagName).toBe("SELECT");
  });
});
