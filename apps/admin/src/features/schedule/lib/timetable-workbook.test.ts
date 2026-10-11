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
describe("Bastak timetable workbook mapping", () => {
  it("normalizes Persian letters without correcting ambiguous intervals", () => {
    expect(normalizeTimetableText("شنــــبه")).toBe("شنبه");
    expect(parseWorkbookInterval("7:30-8:20")).toEqual({ startTime: "07:30", endTime: "08:20" });
    expect(parseWorkbookInterval("10:20:11:00").issue).toBeTruthy();
    expect(parseWorkbookInterval("16:00-16-50").issue).toBeTruthy();
  });
  it("inspects every actual sheet and preserves duplicated/special/historical blocks", async () => {
    const buffer = readFileSync(resolve("public/مبین.xlsx"));
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
      extractWorkbookLessons(special, detectWorkbookBlocks(special)).some((x) =>
        x.issues.some((issue) => issue.includes("زمان مبهم")),
      ),
    ).toBe(true);
  }, 15000);
  it("uses the school timezone across a UTC date boundary", () => {
    expect(timetableToday("Asia/Tehran", new Date("2026-10-10T22:00:00Z"))).toBe("2026-10-11");
    expect(timetableWeekStart("2026-10-11")).toBe("2026-10-10");
  });
});
