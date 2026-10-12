import type { Table } from "@tanstack/react-table";
import { Button, Field, Input } from "../ui";
import type { DataTableColumn } from "./data-table-types";
import type { DataTableCopy } from "./data-table-copy";

export function DataTableFilters<TData>({
  table,
  columns,
  copy,
  onClose,
}: {
  table: Table<TData>;
  columns: DataTableColumn<TData>[];
  copy: DataTableCopy;
  onClose: () => void;
}) {
  return (
    <div className="grid gap-4">
      {columns
        .filter((column) => column.filter)
        .map((column) => {
          const filter = column.filter!;
          const current = table.getColumn(column.id);
          return (
            <Field key={column.id} label={column.label}>
              {filter.type === "select" ? (
                <select
                  className="h-11 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
                  value={String(current?.getFilterValue() ?? "")}
                  onChange={(event) => current?.setFilterValue(event.target.value || undefined)}
                >
                  <option value="">{copy.all}</option>
                  {filter.options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  value={String(current?.getFilterValue() ?? "")}
                  onChange={(event) => current?.setFilterValue(event.target.value || undefined)}
                />
              )}
            </Field>
          );
        })}
      <div className="flex flex-wrap justify-end gap-2">
        <Button
          variant="ghost"
          onClick={() => {
            table.resetColumnFilters();
            table.setGlobalFilter("");
          }}
        >
          {copy.reset}
        </Button>
        <Button onClick={onClose}>{copy.close}</Button>
      </div>
    </div>
  );
}
