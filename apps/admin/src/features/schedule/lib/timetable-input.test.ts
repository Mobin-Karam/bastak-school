import { describe, it, expect } from "vitest";
import { normalizeTimetableClock, assertTimetableRange } from "./timetable-input";
import { timetableToday, timetableDateLabel } from "./timetable-time";
describe("timetable canonical date and clock inputs", () => {
  it("converts Persian/Arabic digits and single-digit hours without changing minutes", () => {
    expect(normalizeTimetableClock("۷:۳۰")).toBe("07:30");
    expect(normalizeTimetableClock("١٦:٥٠")).toBe("16:50");
    expect(() => assertTimetableRange("08:20", "07:30", "time")).toThrow();
    expect(() => assertTimetableRange("24:00", "25:00", "time")).toThrow();
  });
  it("rejects incomplete or reversed dates", () => {
    expect(() => assertTimetableRange("", "2026-01-01", "date")).toThrow();
    expect(() => assertTimetableRange("2026-02-01", "2026-01-01", "date")).toThrow();
  });
  it("uses the school timezone for today but never shifts a calendar date's label", () => {
    expect(timetableToday("Asia/Tehran", new Date("2026-10-11T22:00:00Z"))).toBe("2026-10-12");
    expect(timetableDateLabel("2026-10-12", "Pacific/Kiritimati")).toBe(
      timetableDateLabel("2026-10-12", "America/Adak"),
    );
  });
});
