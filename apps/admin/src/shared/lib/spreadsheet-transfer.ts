import type { CellValue, Worksheet } from "exceljs";

export type SpreadsheetColumn<T extends Record<string, unknown>> = {
  key: Extract<keyof T, string>;
  header: string;
  required?: boolean;
  example?: unknown;
  read?: (value: unknown) => unknown;
  write?: (value: unknown) => unknown;
};

export type SpreadsheetDefinition<T extends Record<string, unknown>> = {
  sheetName: string;
  columns: readonly SpreadsheetColumn<T>[];
  rightToLeft?: boolean;
};

export type SpreadsheetIssue = {
  sheet: string;
  row?: number;
  column?: string;
};

export class SpreadsheetValidationError extends Error {
  constructor(
    message: string,
    readonly issues: SpreadsheetIssue[],
  ) {
    super(message);
    this.name = "SpreadsheetValidationError";
  }
}

export function spreadsheetIssues(error: unknown) {
  return error instanceof SpreadsheetValidationError ? error.issues : [];
}

export function defineSpreadsheet<T extends Record<string, unknown>>(
  definition: SpreadsheetDefinition<T>,
) {
  if (!definition.sheetName.trim() || !definition.columns.length)
    throw new Error("SPREADSHEET_DEFINITION_INVALID");
  if (new Set(definition.columns.map((column) => column.header)).size !== definition.columns.length)
    throw new Error("SPREADSHEET_HEADERS_DUPLICATED");
  return definition;
}

export async function readSpreadsheet<T extends Record<string, unknown>>(
  file: Pick<File, "arrayBuffer">,
  definition: SpreadsheetDefinition<T>,
): Promise<T[]> {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  await workbook.xlsx.load(await file.arrayBuffer());
  const sheet = workbook.getWorksheet(definition.sheetName) ?? workbook.worksheets[0];
  if (!sheet) throw new Error("WORKBOOK_SHEET_MISSING");
  const indexes = columnIndexes(sheet, definition);
  const rows: T[] = [];
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const values = definition.columns.map((column) => valueAt(row, indexes.get(column.header)!));
    if (values.every(isBlank)) return;
    const item = {} as T;
    definition.columns.forEach((column, index) => {
      const value = values[index];
      item[column.key] = (column.read ? column.read(value) : value) as T[typeof column.key];
    });
    rows.push(item);
  });
  const requiredIssues = rows.flatMap((item, index) =>
    definition.columns
      .filter((column) => column.required && isBlank(item[column.key]))
      .map((column) => ({ sheet: sheet.name, row: index + 2, column: column.header })),
  );
  if (requiredIssues.length) throw new SpreadsheetValidationError("REQUIRED_CELLS", requiredIssues);
  return rows;
}

export async function createSpreadsheet<T extends Record<string, unknown>>(
  definition: SpreadsheetDefinition<T>,
  rows: readonly T[],
) {
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  workbook.creator = "Moshaver";
  const sheet = workbook.addWorksheet(definition.sheetName, {
    views: [{ state: "frozen", ySplit: 1, rightToLeft: definition.rightToLeft ?? true }],
  });
  sheet.addRow(definition.columns.map((column) => column.header));
  for (const row of rows)
    sheet.addRow(
      definition.columns.map((column) => {
        const value = row[column.key];
        return column.write ? column.write(value) : (value ?? "");
      }),
    );
  sheet.getRow(1).font = { bold: true };
  definition.columns.forEach((_, index) => {
    sheet.getColumn(index + 1).width = 20;
  });
  return workbook.xlsx.writeBuffer();
}

export async function downloadSpreadsheet<T extends Record<string, unknown>>(
  definition: SpreadsheetDefinition<T>,
  rows: readonly T[],
  filename: string,
) {
  const bytes = await createSpreadsheet(definition, rows);
  const url = URL.createObjectURL(
    new Blob([bytes], {
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = filename.endsWith(".xlsx") ? filename : `${filename}.xlsx`;
  link.click();
  URL.revokeObjectURL(url);
}

function columnIndexes<T extends Record<string, unknown>>(
  sheet: Worksheet,
  definition: SpreadsheetDefinition<T>,
) {
  const header = sheet.getRow(1);
  const indexes = new Map<string, number>();
  header.eachCell((cell, index) => indexes.set(text(cell.value), index));
  const missing = definition.columns.filter(
    (column) => column.required && !indexes.has(column.header),
  );
  if (missing.length)
    throw new SpreadsheetValidationError(
      `MISSING_COLUMNS:${missing.map((column) => column.header).join(",")}`,
      missing.map((column) => ({ sheet: sheet.name, column: column.header })),
    );
  return indexes;
}

function valueAt(row: { getCell(index: number): { value: CellValue } }, index: number) {
  return index ? text(row.getCell(index).value) : "";
}

function text(value: CellValue | undefined) {
  if (value === null || value === undefined) return "";
  if (typeof value === "object" && "text" in value) return String(value.text ?? "").trim();
  return String(value).trim();
}

function isBlank(value: unknown) {
  return value === "" || value === null || value === undefined;
}

/** Raw workbook layout for feature-owned mapping flows; merges retain their provenance. */
export type SpreadsheetLayoutCell = {
  address: string;
  row: number;
  column: number;
  value: string;
  master: string;
  merged: boolean;
};
export type SpreadsheetLayoutSheet = {
  name: string;
  rows: number;
  columns: number;
  cells: SpreadsheetLayoutCell[];
};
export async function readSpreadsheetLayout(
  file: Pick<File, "arrayBuffer">,
): Promise<SpreadsheetLayoutSheet[]> {
  const bytes = await file.arrayBuffer();
  if (bytes.byteLength > 10 * 1024 * 1024)
    throw new SpreadsheetValidationError("فایل باید کمتر از ۱۰ مگابایت باشد.", []);
  const { Workbook } = await import("exceljs");
  const workbook = new Workbook();
  await workbook.xlsx.load(bytes);
  if (workbook.worksheets.length > 30)
    throw new SpreadsheetValidationError("حداکثر ۳۰ کاربرگ مجاز است.", []);
  return workbook.worksheets.map((sheet) => {
    if (sheet.rowCount > 1000 || sheet.columnCount > 80)
      throw new SpreadsheetValidationError("کاربرگ باید کمتر از ۱۰۰۰ ردیف و ۸۰ ستون باشد.", [
        { sheet: sheet.name },
      ]);
    const cells: SpreadsheetLayoutCell[] = [];
    for (let row = 1; row <= sheet.rowCount; row++)
      for (let column = 1; column <= sheet.columnCount; column++) {
        const cell = sheet.getCell(row, column);
        let value = cell.value;
        if (value && typeof value === "object" && "richText" in value)
          value = value.richText.map((item) => item.text).join("");
        if (value && typeof value === "object" && "formula" in value) value = value.result ?? "";
        if (value && typeof value === "object" && "sharedFormula" in value)
          value = value.result ?? "";
        cells.push({
          address: cell.address,
          row,
          column,
          value: text(value),
          master: cell.master.address,
          merged: cell.isMerged,
        });
      }
    return { name: sheet.name, rows: sheet.rowCount, columns: sheet.columnCount, cells };
  });
}
