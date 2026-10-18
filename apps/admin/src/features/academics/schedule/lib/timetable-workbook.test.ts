import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { readSpreadsheetLayout } from "../../../shared/lib/spreadsheet-transfer";
import {
  detectWorkbookBlocks,
  extractWorkbookLessons,
  parseWorkbookInterval,
  normalizeTimetableText,
} from "./timetable-workbook";
import { timetableToday, timetableWeekStart } from "./timetable-time";
describe("Timetable workbook mapping", () => {
  it("normalizes Persian letters without correcting ambiguous intervals", () => {
    expect(normalizeTimetableText("شنــــبه")).toBe("شنبه");
    expect(parseWorkbookInterval("7:30-8:20")).toEqual({ startTime: "07:30", endTime: "08:20" });
    expect(parseWorkbookInterval("10:20:11:00").issue).toBeTruthy();
    expect(parseWorkbookInterval("16:00-16-50").issue).toBeTruthy();
  });
  it("inspects every synthetic sample sheet and preserves duplicated/special/historical blocks", async () => {
    const buffer = readFileSync(resolve("public/timetable-example.xlsx"));
    const sheets = await readSpreadsheetLayout({
      arrayBuffer: async () =>
        buffer.buffer.slice(
          buffer.byteOffset,
          buffer.byteOffset + buffer.byteLength,
        ) as ArrayBuffer,
    });
    expect(sheets).toHaveLength(5);
    expect(sheets.at(-1)?.rows).toBe(0);
    const main = sheets.find((x) => x.name.trim() === "اصلی")!;
    const blocks = detectWorkbookBlocks(main);
    expect(blocks.some((x) => x.classColumn === 2)).toBe(true);
    expect(blocks.some((x) => x.classColumn === 13)).toBe(true);
    const rows = extractWorkbookLessons(main, blocks);
    expect(rows.find((x) => x.source.endsWith("C4"))?.weekday).toBe(6);
    expect(rows.find((x) => x.source.endsWith("C4"))?.subjectLabel).toBe("میراث");
    const tuesday = sheets.find((x) => x.name === "ورقه1")!;
    expect(detectWorkbookBlocks(tuesday).length).toBeGreaterThanOrEqual(2);
    expect(
      extractWorkbookLessons(tuesday, detectWorkbookBlocks(tuesday)).every((x) => x.weekday === 2),
    ).toBe(true);
    const special = sheets.find((x) => x.name === "ورقة1")!;
    expect(
      extractWorkbookLessons(special, detectWorkbookBlocks(special)).some(
        (x) => x.weekday === null,
      ),
    ).toBe(true);
    expect(
      extractWorkbookLessons(special, detectWorkbookBlocks(special)).some((x) =>
        x.issues.some((issue) => issue.includes("زمان مبهم")),
      ),
    ).toBe(true);
  }, 15000);
  it("does not read a later block when only the first repeated block is selected", () => {
    const entries: Array<[number, number, string]> = [
      [2, 2, "کلاس"],
      [2, 3, "زنگ اول"],
      [2, 4, "مدرس"],
      [3, 2, "ساعت"],
      [3, 3, "8:00-8:50"],
      [4, 1, "یکشنبه"],
      [4, 2, "اول"],
      [4, 3, "نحو"],
      [4, 4, "استاد"],
      [6, 2, "کلاس"],
      [6, 3, "زنگ اول"],
      [6, 4, "مدرس"],
      [7, 2, "ساعت"],
      [7, 3, "8:00-8:50"],
      [8, 1, "دوشنبه"],
      [8, 2, "دوم"],
      [8, 3, "فقه"],
      [8, 4, "استاد"],
    ];
    const sheet = {
      name: "تکراری",
      rows: 8,
      columns: 4,
      cells: entries.map(([row, column, value]) => ({
        row,
        column,
        value,
        address: `${row}:${column}`,
        master: `${row}:${column}`,
        merged: false,
      })),
    };
    const blocks = detectWorkbookBlocks(sheet);
    expect(blocks).toHaveLength(2);
    const lessons = extractWorkbookLessons(sheet, [blocks[0]]);
    expect(lessons).toHaveLength(1);
    expect(lessons[0].subjectLabel).toBe("نحو");
    expect(lessons[0].weekday).toBe(0);
  });
  it("keeps side-by-side blocks separate when only the first block names its class column", () => {
    const entries: Array<[number, number, string]> = [
      [2, 2, "کلاس"],
      [2, 3, "زنگ اول"],
      [2, 4, "مدرس"],
      [2, 5, "زنگ دوم"],
      [2, 6, "مدرس"],
      [2, 12, "زنگ اول"],
      [2, 13, "مدرس"],
      [2, 14, "زنگ دوم"],
      [2, 15, "مدرس"],
      [3, 3, "08:00-08:50"],
      [3, 5, "09:00-09:50"],
      [3, 12, "16:00-16:50"],
      [3, 14, "17:00-17:50"],
      [4, 1, "شنبه"],
      [4, 2, "اول"],
      [4, 3, "نحو"],
      [4, 4, "استاد اول"],
      [4, 5, "فقه"],
      [4, 6, "استاد دوم"],
      [4, 11, "دوم"],
      [4, 12, "صرف"],
      [4, 13, "استاد سوم"],
      [4, 14, "حدیث"],
      [4, 15, "استاد چهارم"],
    ];
    const sheet = {
      name: "دو بخش",
      rows: 4,
      columns: 15,
      cells: entries.map(([row, column, value]) => ({
        row,
        column,
        value,
        address: `${row}:${column}`,
        master: `${row}:${column}`,
        merged: false,
      })),
    };
    const blocks = detectWorkbookBlocks(sheet);
    expect(blocks.map((block) => block.id)).toEqual(["2:2", "2:11"]);
    expect(extractWorkbookLessons(sheet, blocks).map((lesson) => lesson.classLabel)).toEqual([
      "اول",
      "اول",
      "دوم",
      "دوم",
    ]);
  });
  it("uses the school timezone across a UTC date boundary", () => {
    expect(timetableToday("Asia/Tehran", new Date("2026-10-10T22:00:00Z"))).toBe("2026-10-11");
    expect(timetableWeekStart("2026-10-11")).toBe("2026-10-10");
  });
});
