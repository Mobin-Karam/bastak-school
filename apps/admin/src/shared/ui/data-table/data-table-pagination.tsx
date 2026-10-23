import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import type { Table } from "@tanstack/react-table";
import { Button } from "../ui";
import type { DataTableCopy } from "./data-table-copy";

export function DataTablePagination<TData>({
  table,
  total,
  copy,
  locale,
  disabled,
}: {
  table: Table<TData>;
  total: number;
  copy: DataTableCopy;
  locale: string;
  disabled?: boolean;
}) {
  const { pageIndex, pageSize } = table.getState().pagination;
  const pages = Math.max(1, table.getPageCount());
  const number = (value: number) => value.toLocaleString(locale);
  return (
    <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[rgb(var(--border-subtle))] p-3 text-sm">
      <span role="status" aria-live="polite">
        {number(total)} {copy.records}
      </span>
      <label className="flex items-center gap-2">
        {copy.pageSize}
        <AdaptiveSelect
          className="h-11 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-2"
          value={pageSize}
          disabled={disabled}
          onChange={(event) => table.setPageSize(Number(event.target.value))}
        >
          {[10, 25, 50, 100].map((size) => (
            <option key={size} value={size}>
              {number(size)}
            </option>
          ))}
        </AdaptiveSelect>
      </label>
      <nav
        aria-label={`${copy.page} ${copy.records}`}
        className="flex flex-wrap items-center gap-2"
      >
        <Button
          variant="soft"
          disabled={disabled || !table.getCanPreviousPage()}
          onClick={() => table.previousPage()}
        >
          {copy.previous}
        </Button>
        <span>
          {copy.page} {number(pageIndex + 1)} {copy.of} {number(pages)}
        </span>
        <Button
          variant="soft"
          disabled={disabled || !table.getCanNextPage()}
          onClick={() => table.nextPage()}
        >
          {copy.next}
        </Button>
      </nav>
    </footer>
  );
}
