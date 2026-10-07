import { describe, expect, it } from "vitest";
import { createSpreadsheet, defineSpreadsheet, readSpreadsheet } from "./spreadsheet-transfer";

const students = defineSpreadsheet<{ firstName: string; gradeId: number | undefined }>({
  sheetName: "Students",
  columns: [
    { key: "firstName", header: "نام", required: true },
    { key: "gradeId", header: "پایه", read: (value) => Number(value) || undefined },
  ],
});

describe("spreadsheet transfer", () => {
  it("round-trips a feature-defined Excel sheet", async () => {
    const bytes = await createSpreadsheet(students, [{ firstName: "زهرا", gradeId: 8 }]);
    await expect(
      readSpreadsheet({ arrayBuffer: async () => bytes.slice(0) as ArrayBuffer }, students),
    ).resolves.toEqual([{ firstName: "زهرا", gradeId: 8 }]);
  });

  it("requires feature-defined required headers", async () => {
    const { Workbook } = await import("exceljs");
    const workbook = new Workbook();
    workbook.addWorksheet("Students").addRow(["نام دیگر"]);
    const bytes = await workbook.xlsx.writeBuffer();
    await expect(
      readSpreadsheet({ arrayBuffer: async () => bytes.slice(0) as ArrayBuffer }, students),
    ).rejects.toThrow("MISSING_COLUMNS:نام");
  });
});
