import type { DataTableColumn } from "./data-table-types";

/** Quote CSV fields and neutralize spreadsheet formulas in untrusted text. */
export function tableCsv<TData>(rows: TData[], columns: DataTableColumn<TData>[]) {
  const quote = (value: string | number) => {
    const text = String(value);
    const safe = typeof value === "string" && /^[\s]*[=+\-@\t\r]/.test(text) ? `'${text}` : text;
    return `"${safe.replaceAll('"', '""')}"`;
  };
  return (
    "\uFEFF" +
    [
      columns.map((column) => quote(column.label)).join(","),
      ...rows.map((row) => columns.map((column) => quote(column.value(row))).join(",")),
    ].join("\r\n")
  );
}
export async function exportTable<TData>(
  format: "csv" | "xlsx",
  rows: TData[],
  columns: DataTableColumn<TData>[],
  filename: string,
  rtl: boolean,
) {
  if (format === "xlsx") {
    const { defineSpreadsheet, downloadSpreadsheet } =
      await import("../../lib/spreadsheet-transfer");
    const sheet = defineSpreadsheet<Record<string, string | number>>({
      sheetName: "Records",
      rightToLeft: rtl,
      columns: columns.map((column) => ({ key: column.id, header: column.label })),
    });
    await downloadSpreadsheet(
      sheet,
      rows.map((row) =>
        Object.fromEntries(columns.map((column) => [column.id, column.value(row)])),
      ),
      filename,
    );
    return;
  }
  const url = URL.createObjectURL(
    new Blob([tableCsv(rows, columns)], { type: "text/csv;charset=utf-8" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
