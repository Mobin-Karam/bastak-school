import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminDataTable } from "./admin-data-table";
import { LocaleProvider } from "./locale";

const rows = [
  { id: "1", name: "کاربر اول" },
  { id: "2", name: "کاربر دوم" },
];
afterEach(cleanup);

function SelectionHarness() {
  const [selected, setSelected] = useState<string[]>([]);
  return (
    <AdminDataTable
      rows={rows}
      rowId={(row) => row.id}
      label="کاربران"
      selectedIds={selected}
      onSelectionChange={setSelected}
      columns={[{ id: "name", header: "نام", cell: (row) => row.name }]}
    />
  );
}

describe("AdminDataTable", () => {
  it("selects one row, all visible rows, and clears selection", () => {
    render(<SelectionHarness />);
    fireEvent.click(screen.getByLabelText("انتخاب ردیف 1"));
    expect(screen.getByText("۱ انتخاب‌شده")).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("انتخاب همه موارد این صفحه"));
    expect(screen.getByText("۲ انتخاب‌شده")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "لغو انتخاب" }));
    expect(screen.queryByText(/انتخاب‌شده/)).not.toBeInTheDocument();
  });

  it("supports semantic sorting and keyboard row activation independently", async () => {
    const sort = vi.fn(),
      open = vi.fn();
    render(
      <AdminDataTable
        rows={rows}
        rowId={(row) => row.id}
        label="کاربران"
        sortId="name"
        onSort={sort}
        onRowClick={open}
        columns={[{ id: "name", header: "نام", sortLabel: "نام", cell: (row) => row.name }]}
      />,
    );
    fireEvent.click(screen.getByRole("button", { name: "مرتب‌سازی بر اساس نام" }));
    expect(screen.getByRole("columnheader", { name: /نام/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    screen.getByText("کاربر اول").closest("tr")?.focus();
    await userEvent.keyboard("{Enter}");
    expect(sort).toHaveBeenCalledWith("name");
    expect(open).toHaveBeenCalledWith(rows[0]);
  });

  it("uses the shared alert contract for contextual load failures", () => {
    render(
      <AdminDataTable
        rows={[]}
        rowId={(row: { id: string }) => row.id}
        label="کاربران"
        error
        errorDescription="اتصال شبکه را بررسی کنید."
        columns={[]}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("دریافت کاربران ناموفق بود.");
    expect(screen.getByRole("alert")).toHaveTextContent("اتصال شبکه را بررسی کنید.");
  });

  it("offers a feature-owned compact card representation without removing the table semantics", () => {
    render(
      <AdminDataTable
        rows={rows}
        rowId={(row) => row.id}
        label="کاربران"
        columns={[{ id: "name", header: "نام", cell: (row) => row.name }]}
        mobileCard={(row) => <span>کارت {row.name}</span>}
      />,
    );
    expect(screen.getByLabelText("کاربران، نمای کارت")).toHaveTextContent("کارت کاربر اول");
    expect(screen.getByRole("table")).toBeInTheDocument();
  });

  it("can make the supplied card renderer the explicit desktop presentation", () => {
    render(
      <AdminDataTable
        rows={rows}
        rowId={(row) => row.id}
        label="کاربران"
        displayMode="cards"
        columns={[{ id: "name", header: "نام", cell: (row) => row.name }]}
        mobileCard={(row) => <span>کارت {row.name}</span>}
      />,
    );

    expect(screen.getByLabelText("کاربران، نمای کارت")).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("keeps wide tables discoverable and keyboard-reachable without hiding their columns", () => {
    render(
      <AdminDataTable
        rows={rows}
        rowId={(row) => row.id}
        label="کاربران"
        columns={[{ id: "name", header: "نام", cell: (row) => row.name }]}
      />,
    );

    expect(
      screen.getByText("برای دیدن همه ستون‌ها، جدول را به چپ و راست بکشید."),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "کاربران، جدول قابل پیمایش افقی" })).toHaveAttribute(
      "tabindex",
      "0",
    );
  });

  it("offers a contextual recovery action for filtered empty results", () => {
    render(
      <AdminDataTable
        rows={[]}
        rowId={(row: { id: string }) => row.id}
        label="کاربران"
        emptyTitle="نتیجه‌ای پیدا نشد."
        emptyAction={<button type="button">پاک کردن فیلترها</button>}
        columns={[]}
      />,
    );
    expect(screen.getByRole("button", { name: "پاک کردن فیلترها" })).toBeInTheDocument();
  });

  it("uses the active English locale for shared table state and accessibility copy", () => {
    localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <AdminDataTable
          rows={[]}
          rowId={(row: { id: string }) => row.id}
          label="students"
          loading
          columns={[]}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Loading students…")).toBeInTheDocument();
    localStorage.removeItem("moshaver-admin-location");
  });
});
