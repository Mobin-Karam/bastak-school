import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { CollectionToolbar } from "./collection-toolbar";
import { LocaleProvider } from "./locale";

describe("CollectionToolbar", () => {
  it("keeps an explicit accessible search label and exposes clear/filter controls", async () => {
    const user = userEvent.setup();
    const onSearchChange = vi.fn();
    const onClear = vi.fn();
    render(
      <CollectionToolbar
        search="پیام"
        onSearchChange={onSearchChange}
        searchLabel="جستجوی اعلان‌ها"
        placeholder="جستجو در اعلان‌ها"
        onClear={onClear}
        filters={
          <select aria-label="نوع اعلان">
            <option>همه</option>
          </select>
        }
      />,
    );

    const input = screen.getByRole("searchbox", { name: "جستجوی اعلان‌ها" });
    fireEvent.change(input, { target: { value: "پیام جدید" } });
    expect(onSearchChange).toHaveBeenCalledWith("پیام جدید");
    expect(screen.getByRole("combobox", { name: "نوع اعلان" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "پاک کردن فیلترها" }));
    expect(onClear).toHaveBeenCalledOnce();
  });

  it("can retain text-input semantics for non-search indexing controls", () => {
    render(
      <CollectionToolbar
        search=""
        onSearchChange={vi.fn()}
        searchLabel="جستجوی اعلان‌ها"
        searchInputType="text"
      />,
    );
    expect(screen.getByRole("textbox", { name: "جستجوی اعلان‌ها" })).toBeInTheDocument();
  });

  it("keeps result context and primary actions in the same responsive toolbar", () => {
    render(
      <CollectionToolbar
        label="ابزارهای کاربران"
        resultLabel="۱۲ کاربر نمایش داده می‌شود"
        actions={<button type="button">کاربر جدید</button>}
      />,
    );

    expect(screen.getByLabelText("ابزارهای کاربران")).toHaveTextContent("کاربر جدید");
    expect(screen.getByRole("status")).toHaveTextContent("۱۲ کاربر نمایش داده می‌شود");
  });

  it("uses English copy for generic controls when the shared locale is English", () => {
    localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <CollectionToolbar filters={<button type="button">Status</button>} onClear={vi.fn()} />
      </LocaleProvider>,
    );

    expect(screen.getByLabelText("List filters")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Clear filters" })).toBeInTheDocument();
    localStorage.removeItem("moshaver-admin-location");
  });
});
