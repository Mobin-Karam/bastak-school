import type { Table } from "@tanstack/react-table";
import { Button } from "../ui";
import { DataTableRowActions } from "./data-table-row-actions";
import type { DataTableAction, DataTableColumn } from "./data-table-types";
import type { DataTableCopy } from "./data-table-copy";

export function DataTableMobileCards<TData>({
  table,
  columns,
  actions,
  copy,
  label,
  selectable,
  busy,
  density,
  onRowClick,
}: {
  table: Table<TData>;
  columns: DataTableColumn<TData>[];
  actions: DataTableAction<TData>[];
  copy: DataTableCopy;
  label: string;
  selectable?: boolean;
  busy?: boolean;
  density: "comfortable" | "compact";
  onRowClick?: (row: TData) => void;
}) {
  return (
    <div
      role="list"
      aria-label={`${label} — ${copy.cards}`}
      className="grid gap-3 border-t border-[rgb(var(--border-subtle))] p-3 lg:grid-cols-2"
    >
      {table.getRowModel().rows.map((row) => (
        <div
          key={row.id}
          role="listitem"
          className={`min-w-0 rounded-lg border border-[rgb(var(--border-subtle))] ${density === "compact" ? "p-3" : "p-4"} ${row.getIsSelected() ? "ring-2 ring-brand/30" : ""}`}
        >
          <div className="mb-2 flex items-center justify-between gap-2">
            {selectable ? (
              <label className="flex min-h-11 items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-brand"
                  checked={row.getIsSelected()}
                  disabled={busy}
                  onChange={row.getToggleSelectedHandler()}
                  aria-label={`${copy.select} ${row.id} (${copy.cards})`}
                />
                {copy.select}
              </label>
            ) : (
              <span />
            )}
            <DataTableRowActions
              row={row.original}
              actions={actions}
              label={`${copy.actions} ${row.id} (${copy.cards})`}
              busy={busy}
            />
          </div>
          <dl className={`grid ${density === "compact" ? "gap-2" : "gap-3"}`}>
            {columns
              .filter((column) => table.getColumn(column.id)?.getIsVisible())
              .map((column) => (
                <div
                  key={column.id}
                  className={
                    column.primary
                      ? "grid gap-1"
                      : "flex flex-wrap items-baseline justify-between gap-2"
                  }
                >
                  <dt className="text-xs text-slate-500 dark:text-slate-400">{column.label}</dt>
                  <dd
                    className={`min-w-0 break-words ${column.primary ? "text-base font-semibold text-ink" : "text-sm"}`}
                  >
                    {column.cell?.(row.original) ?? column.value(row.original)}
                  </dd>
                </div>
              ))}
          </dl>
          {onRowClick ? (
            <Button
              variant="ghost"
              className="mt-3 w-full"
              onClick={() => onRowClick(row.original)}
            >
              {copy.view}
            </Button>
          ) : null}
        </div>
      ))}
    </div>
  );
}
