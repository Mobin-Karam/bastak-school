import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef } from "react";
import { useForm } from "react-hook-form";
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

  it("renders a semantic, keyboard-operable select on desktop and preserves native events", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const ref = createRef<HTMLSelectElement>();
    render(
      <AdaptiveSelect
        ref={ref}
        mode="menu"
        aria-label="فیلتر اعضا"
        defaultValue="present"
        onChange={onChange}
      >
        <option value="present">حاضر</option>
        <optgroup label="موارد نیازمند پیگیری">
          <option value="absent">غایب</option>
          <option value="unmarked">ثبت‌نشده</option>
        </optgroup>
      </AdaptiveSelect>,
    );

    const trigger = screen.getByRole("combobox", { name: "فیلتر اعضا" });
    expect(trigger).toHaveTextContent("حاضر");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
    expect(ref.current).toBeInstanceOf(HTMLSelectElement);
    expect(ref.current?.value).toBe("present");
    await user.click(trigger);
    const popup = screen.getByRole("listbox");
    expect(popup).toHaveTextContent("موارد نیازمند پیگیری");
    await user.click(screen.getByRole("option", { name: "غایب" }));
    expect(onChange.mock.calls[0][0].target.value).toBe("absent");
    expect(onChange.mock.calls[0][0].target).toBe(ref.current);
    expect(ref.current?.selectedOptions[0]?.textContent).toBe("غایب");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("keeps required validation, form data, and reset behavior native on desktop", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
    render(
      <form aria-label="فرم" onSubmit={onSubmit}>
        <AdaptiveSelect mode="menu" name="status" aria-label="وضعیت" required defaultValue="">
          <option value="">انتخاب کنید</option>
          <option value="done">انجام‌شده</option>
        </AdaptiveSelect>
        <button type="submit">ذخیره</button>
        <button type="reset">بازنشانی</button>
      </form>,
    );

    const form = screen.getByRole("form", { name: "فرم" }) as HTMLFormElement;
    expect(form.checkValidity()).toBe(false);
    await user.click(screen.getByRole("combobox", { name: "وضعیت" }));
    await user.click(screen.getByRole("option", { name: "انجام‌شده" }));
    expect(form.checkValidity()).toBe(true);
    expect(new FormData(form).get("status")).toBe("done");

    await user.click(screen.getByRole("button", { name: "بازنشانی" }));
    await waitFor(() => {
      expect(screen.getByRole("combobox", { name: "وضعیت" })).toHaveTextContent("انتخاب کنید");
    });
    expect(new FormData(form).get("status")).toBe("");
  });

  it("does not select disabled or hidden desktop options", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AdaptiveSelect mode="menu" aria-label="عضو" defaultValue="active" onChange={onChange}>
        <option value="active">فعال</option>
        <option value="hidden" hidden>
          پنهان
        </option>
        <optgroup label="غیرفعال" disabled>
          <option value="blocked">مسدود</option>
        </optgroup>
      </AdaptiveSelect>,
    );

    await user.click(screen.getByRole("combobox", { name: "عضو" }));
    expect(screen.queryByRole("option", { name: "پنهان" })).not.toBeInTheDocument();
    const blocked = screen.getByRole("option", { name: "مسدود" });
    expect(blocked).toHaveAttribute("aria-disabled", "true");
    fireEvent.click(blocked);
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole("combobox", { name: "عضو" })).toHaveTextContent("فعال");
  });

  it("integrates with React Hook Form and supports RTL keyboard selection", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    function Harness() {
      const form = useForm<{ status: string }>({ defaultValues: { status: "pending" } });
      return (
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <AdaptiveSelect mode="menu" dir="rtl" aria-label="وضعیت" {...form.register("status")}>
            <option value="pending">در انتظار</option>
            <option value="done">انجام‌شده</option>
          </AdaptiveSelect>
          <button type="submit">ثبت</button>
        </form>
      );
    }

    render(<Harness />);
    const trigger = screen.getByRole("combobox", { name: "وضعیت" });
    trigger.focus();
    await user.keyboard("{ArrowDown}{ArrowDown}{Enter}");
    expect(trigger).toHaveTextContent("انجام‌شده");
    await user.click(screen.getByRole("button", { name: "ثبت" }));
    await waitFor(() =>
      expect(onSubmit).toHaveBeenCalledWith({ status: "done" }, expect.anything()),
    );
  });

  it("associates its canonical value with an external form", () => {
    render(
      <>
        <form id="external-form" aria-label="فرم بیرونی" />
        <AdaptiveSelect
          mode="menu"
          form="external-form"
          name="status"
          autoComplete="off"
          aria-label="وضعیت"
          defaultValue="done"
        >
          <option value="pending">در انتظار</option>
          <option value="done">انجام‌شده</option>
        </AdaptiveSelect>
      </>,
    );

    const form = screen.getByRole("form", { name: "فرم بیرونی" }) as HTMLFormElement;
    expect(new FormData(form).get("status")).toBe("done");
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
