import axe from "axe-core";
import { act, cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { MemoryRouter, useSearchParams } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../locale";
import {
  DataTable,
  defaultTableQuery,
  useDataTableUrlQuery,
  type DataTableColumn,
  type DataTableQuery,
} from "./index";
import { tableCsv } from "./data-table-export";
import * as tableExports from "./data-table-export";

type RecordRow = { id: string; title: string; teacher: string; code: string };
const rows: RecordRow[] = Array.from({ length: 28 }, (_, index) => ({
  id: `row-${index}`,
  title: `Book ${String(index + 1).padStart(2, "0")}`,
  teacher: index % 2 ? "Baker" : "Ali",
  code: `C${index}`,
}));
const columns: DataTableColumn<RecordRow>[] = [
  {
    id: "title",
    label: "Title",
    value: (row) => row.title,
    primary: true,
    filter: { type: "text" },
  },
  {
    id: "teacher",
    label: "Teacher",
    value: (row) => row.teacher,
    filter: {
      type: "select",
      options: [
        { value: "Ali", label: "Ali" },
        { value: "Baker", label: "Baker" },
      ],
    },
  },
  { id: "code", label: "Code", value: (row) => row.code },
];
const rowId = (row: RecordRow) => row.id;
function mount(props: Partial<React.ComponentProps<typeof DataTable<RecordRow>>> = {}) {
  return render(
    <LocaleProvider>
      <DataTable
        label="Books"
        language="en"
        data={rows}
        columns={columns}
        getRowId={rowId}
        {...props}
      />
    </LocaleProvider>,
  );
}
const table = () => within(screen.getByRole("table"));
beforeEach(() => {
  localStorage.setItem("moshaver-admin-location", "international");
  vi.stubGlobal("PointerEvent", MouseEvent);
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

describe("shared DataTable", () => {
  it("keeps controls and column headings fixed while a bounded results viewport scrolls", () => {
    mount({ scrollRows: true, className: "h-96" });
    expect(screen.getByRole("toolbar", { name: "Search records…" })).not.toHaveClass(
      "overflow-x-auto",
    );
    expect(screen.getByRole("table").querySelector("thead")).toHaveClass("sticky", "top-0");
    expect(screen.getByRole("table").querySelector("th")).toHaveClass("sticky", "top-0");
    expect(screen.getByRole("table").querySelector("tbody")).toHaveClass("divide-y");
    expect(screen.getByRole("table").querySelector("tbody tr")).toHaveClass("border-b");
    expect(screen.getByRole("region", { name: "Books" })).toHaveClass("overflow-hidden");
  });

  it("grows with a larger page instead of creating a vertical results viewport by default", async () => {
    mount();
    const workspace = screen.getByRole("region", { name: "Books" });
    expect(workspace).not.toHaveAttribute("data-scroll-rows");
    expect(workspace).not.toHaveClass("max-h-[100dvh]", "overflow-auto");

    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Rows per page" }), "25");
    expect(table().getAllByRole("row")).toHaveLength(26);
  });

  it("shares pagination, locale sorting and debounced search between table and cards", async () => {
    mount();
    expect(table().getAllByRole("row")).toHaveLength(11);
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(table().getByText("Book 11")).toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    await userEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    expect(table().getAllByRole("row")[1]).toHaveTextContent("Book 28");
    await userEvent.type(screen.getByRole("textbox", { name: "Search records…" }), "Baker");
    await screen.findByText("14 records");
    expect(table().queryByText("Ali")).not.toBeInTheDocument();
    const cards = within(screen.getByRole("list", { name: "Books — Card view" }));
    expect(cards.getAllByRole("listitem")).toHaveLength(10);
    expect(cards.getAllByRole("listitem")[0].querySelector("dl")).toHaveClass("divide-y");
    expect(cards.queryByText("Ali")).not.toBeInTheDocument();
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Rows per page" }), "25");
    expect(table().getAllByRole("row")).toHaveLength(15);
  });

  it("combines column filters, displays chips, and resets filters and search together", async () => {
    mount();
    await userEvent.type(screen.getByRole("textbox", { name: "Search records…" }), "Book");
    await screen.findByRole("button", { name: "Book Remove filter" });
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    const drawer = within(screen.getByRole("dialog"));
    await userEvent.type(drawer.getByRole("textbox", { name: "Title" }), "Book 0");
    await userEvent.selectOptions(drawer.getByRole("combobox", { name: "Teacher" }), "Ali");
    await userEvent.click(drawer.getByRole("button", { name: "Done" }));
    expect(screen.getByRole("button", { name: "Filters (2)" })).toBeInTheDocument();
    expect(table().getAllByRole("row")).toHaveLength(6);
    await userEvent.click(screen.getByRole("button", { name: "Reset filters" }));
    expect(screen.getByRole("button", { name: "Filters" })).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search records…" })).toHaveValue("");
    expect(table().getAllByRole("row")).toHaveLength(11);
  });

  it("selects rows across presentations and pages and passes records to bulk actions", async () => {
    let selected: RecordRow[] = [];
    mount({
      selectable: true,
      bulkActions: (records, clear) => {
        selected = records;
        return <button onClick={clear}>Clear bulk</button>;
      },
    });
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row-0" }));
    expect(screen.getByRole("checkbox", { name: "Select row-0 (Card view)" })).toBeChecked();
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Select row-10 (Card view)" }));
    expect(selected.map(rowId)).toEqual(["row-0", "row-10"]);
    await userEvent.click(screen.getByRole("button", { name: "Clear bulk" }));
    expect(screen.getByText("0 selected")).toBeInTheDocument();
  });

  it("persists visibility and card mode without hiding the primary column", async () => {
    const view = mount({ preferenceKey: "test-table" });
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    const settings = within(screen.getByRole("dialog", { name: "Columns" }));
    await userEvent.click(settings.getByRole("checkbox", { name: "Code" }));
    await userEvent.selectOptions(
      settings.getByRole("combobox", { name: "Responsive view" }),
      "cards",
    );
    await userEvent.keyboard("{Escape}");
    expect(table().queryByRole("columnheader", { name: /Code/ })).not.toBeInTheDocument();
    view.unmount();
    mount({ preferenceKey: "test-table" });
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    expect(
      within(screen.getByRole("dialog", { name: "Columns" })).getByRole("combobox", {
        name: "Responsive view",
      }),
    ).toHaveValue("cards");
    await userEvent.keyboard("{Escape}");
    expect(screen.getByRole("list", { name: "Books — Card view" })).toHaveTextContent("Book 01");
  });

  it("offers keyboard row actions with per-record permission visibility", async () => {
    const edit = vi.fn();
    mount({
      actions: [{ id: "edit", label: "Edit", onClick: edit, visible: (row) => row.id === "row-0" }],
    });
    await userEvent.click(screen.getByRole("button", { name: "Actions row-0" }));
    await userEvent.keyboard("{ArrowDown}{Enter}");
    expect(edit).toHaveBeenCalledWith(rows[0]);
    expect(screen.queryByRole("button", { name: "Actions row-1" })).not.toBeInTheDocument();
  });

  it("supports controlled server queries without re-filtering or paginating the returned page", async () => {
    const requests = vi.fn();
    function ServerTable() {
      const [query, setQuery] = useState<DataTableQuery>(defaultTableQuery);
      return (
        <DataTable
          label="Books"
          language="en"
          data={rows.slice(0, 2)}
          columns={columns}
          getRowId={rowId}
          server={{ rowCount: 200 }}
          query={query}
          onQueryChange={(next) => {
            requests(next);
            setQuery(next);
          }}
        />
      );
    }
    render(
      <LocaleProvider>
        <ServerTable />
      </LocaleProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    expect(requests).toHaveBeenLastCalledWith(
      expect.objectContaining({ pagination: { pageIndex: 1, pageSize: 10 } }),
    );
    expect(table().getAllByRole("row")).toHaveLength(3);
    await userEvent.type(screen.getByRole("textbox", { name: "Search records…" }), "missing");
    await screen.findByRole("button", { name: "missing Remove filter" });
    expect(requests).toHaveBeenLastCalledWith(
      expect.objectContaining({ search: "missing", pagination: { pageIndex: 0, pageSize: 10 } }),
    );
    expect(table().getByText("Book 01")).toBeInTheDocument();
    expect(screen.getByText("200 records")).toBeInTheDocument();
  });

  it("syncs queries with the URL while preserving unrelated feature params", async () => {
    function UrlTable() {
      const query = useDataTableUrlQuery("books");
      const [params] = useSearchParams();
      return (
        <>
          <output data-testid="url">{params.toString()}</output>
          <DataTable
            label="Books"
            language="en"
            data={rows}
            columns={columns}
            getRowId={rowId}
            {...query}
          />
        </>
      );
    }
    render(
      <LocaleProvider>
        <MemoryRouter initialEntries={["/?class=one&books=invalid"]}>
          <UrlTable />
        </MemoryRouter>
      </LocaleProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Next" }));
    await screen.findByText("Page 2 of 3");
    expect(table().getByText("Book 11")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Search records…" }), "Book 01");
    await screen.findByText("1 records");
    const params = new URLSearchParams(screen.getByTestId("url").textContent!);
    expect(params.get("class")).toBe("one");
    expect(JSON.parse(params.get("books")!)).toMatchObject({ search: "Book 01" });
  });

  it("distinguishes loading, error/retry, empty and filtered empty states", async () => {
    const refresh = vi.fn();
    const view = mount({ loading: true });
    expect(screen.getByRole("status", { name: "Loading records…" })).toBeInTheDocument();
    view.unmount();
    const failure = mount({ error: true, onRefresh: refresh, errorMessage: "Unavailable" });
    expect(screen.getByRole("alert")).toHaveTextContent("Unavailable");
    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(refresh).toHaveBeenCalled();
    failure.unmount();
    mount({ data: [] });
    expect(screen.getByText("No records yet.")).toBeInTheDocument();
    await userEvent.type(screen.getByRole("textbox", { name: "Search records…" }), "missing");
    expect(await screen.findByText("No matching records.")).toBeInTheDocument();
  });

  it("renders a bounded page for 10000 rows and supplies Persian direction and counts", () => {
    localStorage.setItem("moshaver-admin-location", "iran");
    const big = Array.from({ length: 10000 }, (_, index) => ({ ...rows[0], id: String(index) }));
    mount({ data: big, language: "fa" });
    expect(table().getAllByRole("row")).toHaveLength(11);
    expect(screen.getByRole("region", { name: "Books" }).closest("section")).toHaveAttribute(
      "dir",
      "rtl",
    );
    expect(screen.getByText("۱۰٬۰۰۰ رکورد")).toBeInTheDocument();
  });

  it("has accessible table, card, filter and detail surfaces", async () => {
    const view = mount({ selectable: true, renderDetail: (row) => <p>{row.title}</p> });
    const check = async (element: HTMLElement) => {
      const result = await axe.run(element, { rules: { "color-contrast": { enabled: false } } });
      expect(result.violations.map((issue) => `${issue.id}: ${issue.help}`)).toEqual([]);
    };
    await check(view.container);
    await userEvent.click(screen.getByRole("button", { name: "Filters" }));
    await check(screen.getByRole("dialog"));
    await userEvent.click(screen.getByRole("button", { name: "Done" }));
    fireEvent.click(table().getByText("Book 01"));
    await check(screen.getByRole("dialog"));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("reports offline status and disables actions during work", async () => {
    mount({ selectable: true, busy: true });
    expect(screen.getByRole("checkbox", { name: "Select row-0" })).toBeDisabled();
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    act(() => window.dispatchEvent(new Event("offline")));
    expect(screen.getByText(/You are offline/)).toBeInTheDocument();
  });

  it("quotes exported values and neutralizes spreadsheet formulas", () => {
    const csv = tableCsv([{ ...rows[0], title: '=HYPERLINK("bad")', teacher: "A, B\nC" }], columns);
    expect(csv).toContain('"\'=HYPERLINK(""bad"")"');
    expect(csv).toContain('"A, B\nC"');
    expect(
      tableCsv([{ amount: -12 }], [{ id: "amount", label: "Amount", value: (row) => row.amount }]),
    ).toContain('"-12"');
  });
  it("exports every filtered row rather than only the current page", async () => {
    const download = vi.spyOn(tableExports, "exportTable").mockResolvedValue();
    mount({ exportFilename: "books" });
    await userEvent.type(screen.getByRole("textbox", { name: "Search records…" }), "Baker");
    await screen.findByText("14 records");
    await userEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    await userEvent.click(screen.getByRole("button", { name: "Sort by Title" }));
    await userEvent.click(screen.getByRole("button", { name: "Export results" }));
    await userEvent.click(screen.getByRole("menuitem", { name: "CSV" }));
    expect(download).toHaveBeenCalledWith(
      "csv",
      rows.filter((row) => row.teacher === "Baker").reverse(),
      columns,
      "books",
      false,
    );
  });

  it("supports secondary sorting and the mobile sort control", async () => {
    mount();
    fireEvent.click(screen.getByRole("button", { name: "Sort by Teacher" }));
    fireEvent.click(screen.getByRole("button", { name: "Sort by Title" }), { shiftKey: true });
    expect(table().getByRole("columnheader", { name: /Teacher/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    expect(table().getByRole("columnheader", { name: /Title/ })).toHaveAttribute(
      "aria-sort",
      "ascending",
    );
    await userEvent.click(screen.getByRole("button", { name: "Columns" }));
    const settings = within(screen.getByRole("dialog", { name: "Columns" }));
    await userEvent.selectOptions(settings.getByRole("combobox", { name: "Sort by" }), "title");
    await userEvent.click(settings.getByRole("button", { name: "Ascending" }));
    await userEvent.keyboard("{Escape}");
    expect(table().getAllByRole("row")[1]).toHaveTextContent("Book 28");
  });
  it("keeps newer search text when a controlled consumer acknowledges an older query", async () => {
    vi.useFakeTimers();
    function DelayedTable() {
      const [query, setQuery] = useState<DataTableQuery>(defaultTableQuery);
      return (
        <DataTable
          label="Books"
          language="en"
          data={rows}
          columns={columns}
          getRowId={rowId}
          query={query}
          onQueryChange={(next) => {
            setTimeout(() => setQuery(next), 100);
          }}
        />
      );
    }
    render(
      <LocaleProvider>
        <DelayedTable />
      </LocaleProvider>,
    );
    const input = screen.getByRole("textbox", { name: "Search records…" });
    fireEvent.change(input, { target: { value: "Book" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(250);
    });
    fireEvent.change(input, { target: { value: "Book 01" } });
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });
    expect(input).toHaveValue("Book 01");
    await act(async () => {
      await vi.advanceTimersByTimeAsync(400);
    });
    expect(screen.getByText("1 records")).toBeInTheDocument();
  });
});
