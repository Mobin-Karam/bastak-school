import { flexRender, type Table } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import type { DataTableCopy } from "./data-table-copy";

export function DataTableDesktop<TData>({
  table,
  label,
  copy,
  density,
  onRowClick,
}: {
  table: Table<TData>;
  label: string;
  copy: DataTableCopy;
  density: "comfortable" | "compact";
  onRowClick?: (row: TData) => void;
}) {
  return (
    <div
      className="w-full min-w-0 max-w-full overflow-x-auto overflow-y-hidden"
      role="region"
      aria-label={`${label} — ${copy.table}`}
      tabIndex={0}
    >
      <table className="w-full min-w-[640px] text-sm">
        <caption className="sr-only">{label}</caption>
        <thead className="sticky top-0 z-10 bg-[rgb(var(--surface-muted))]">
          {table.getHeaderGroups().map((group) => (
            <tr key={group.id} className="border-y border-[rgb(var(--border-subtle))]">
              {group.headers.map((header) => (
                <th
                  key={header.id}
                  scope="col"
                  className="px-4 text-start font-medium text-slate-600 dark:text-slate-300"
                  aria-sort={
                    header.column.getIsSorted() === "asc"
                      ? "ascending"
                      : header.column.getIsSorted() === "desc"
                        ? "descending"
                        : undefined
                  }
                >
                  {header.isPlaceholder ? null : header.column.getCanSort() ? (
                    <button
                      type="button"
                      className="flex min-h-11 items-center gap-2 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
                      onClick={header.column.getToggleSortingHandler()}
                      title={copy.sortHelp}
                      aria-label={`${copy.sort} ${String(header.column.columnDef.header)}`}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? (
                        <ArrowUp size={14} aria-hidden="true" />
                      ) : header.column.getIsSorted() === "desc" ? (
                        <ArrowDown size={14} aria-hidden="true" />
                      ) : (
                        <ChevronsUpDown size={14} aria-hidden="true" />
                      )}
                      {table.getState().sorting.length > 1 && header.column.getIsSorted() ? (
                        <span className="text-xs">{header.column.getSortIndex() + 1}</span>
                      ) : null}
                    </button>
                  ) : (
                    <div className="py-3">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                    </div>
                  )}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="divide-y divide-[rgb(var(--border-subtle))]">
          {table.getRowModel().rows.map((row) => (
            <tr
              key={row.id}
              data-selected={row.getIsSelected() || undefined}
              className="hover:bg-[rgb(var(--surface-muted))] data-[selected]:bg-brand/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-brand"
              tabIndex={onRowClick ? 0 : undefined}
              onClick={(event) => {
                if (!(event.target as HTMLElement).closest("button,input,a,[role=menuitem]"))
                  onRowClick?.(row.original);
              }}
              onKeyDown={(event) => {
                if (
                  onRowClick &&
                  event.target === event.currentTarget &&
                  ["Enter", " "].includes(event.key)
                ) {
                  event.preventDefault();
                  onRowClick(row.original);
                }
              }}
            >
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id} className={`px-4 ${density === "compact" ? "py-1" : "py-3"}`}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
