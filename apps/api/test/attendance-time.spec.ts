import {
  operationalDate,
  schoolCalendarDate,
  schoolLocalInstant,
  schoolWeekday,
  shiftSchoolDate,
  validateTimeZone,
} from "../src/modules/attendance/attendance-time";

describe("school-local attendance dates", () => {
  it("changes the operational day at 04:00 Tehran, independently of UTC midnight", () => {
    expect(operationalDate(new Date("2026-10-11T00:29:59.999Z"))).toBe(
      "2026-10-10",
    );
    expect(operationalDate(new Date("2026-10-11T00:30:00.000Z"))).toBe(
      "2026-10-11",
    );
    expect(schoolCalendarDate(new Date("2026-10-11T00:29:59Z"))).toBe(
      "2026-10-11",
    );
  });
  it("supports a school's configured timezone and minute-accurate boundary", () => {
    expect(
      operationalDate(
        new Date("2026-10-11T05:14:59Z"),
        "Europe/London",
        "06:15",
      ),
    ).toBe("2026-10-10");
    expect(
      operationalDate(
        new Date("2026-10-11T05:15:00Z"),
        "Europe/London",
        "06:15",
      ),
    ).toBe("2026-10-11");
  });
  it("keeps an overnight roll call's original day through midnight", () => {
    const start = schoolLocalInstant("2026-10-10", "21:00");
    const end = schoolLocalInstant("2026-10-11", "02:00");
    expect(operationalDate(start)).toBe("2026-10-10");
    expect(operationalDate(end)).toBe("2026-10-10");
  });
  it("converts school wall times using the school's zone rather than process TZ", () => {
    expect(schoolLocalInstant("2026-10-11", "08:00").toISOString()).toBe(
      "2026-10-11T04:30:00.000Z",
    );
    expect(
      schoolLocalInstant(
        "2026-10-11",
        "08:00",
        "America/New_York",
      ).toISOString(),
    ).toBe("2026-10-11T12:00:00.000Z");
  });
  it("rejects a spring DST gap and consistently chooses the first fall occurrence", () => {
    expect(() =>
      schoolLocalInstant("2026-03-08", "02:30", "America/New_York"),
    ).toThrow(RangeError);
    expect(
      schoolLocalInstant(
        "2026-11-01",
        "01:30",
        "America/New_York",
      ).toISOString(),
    ).toBe("2026-11-01T05:30:00.000Z");
    expect(
      operationalDate(new Date("2026-11-01T08:59:59Z"), "America/New_York"),
    ).toBe("2026-10-31");
    expect(
      operationalDate(new Date("2026-11-01T09:00:00Z"), "America/New_York"),
    ).toBe("2026-11-01");
  });
  it("rejects malformed dates, nonexistent calendar days, times and timezones", () => {
    for (const date of ["2026-02-30", "2026-13-01", "2026-01-00", "11/10/2026"])
      expect(() => schoolLocalInstant(date, "08:00")).toThrow(RangeError);
    expect(() => schoolLocalInstant("2026-10-11", "24:00")).toThrow(RangeError);
    expect(() => validateTimeZone("Not/A_Timezone")).toThrow(RangeError);
    expect(() => operationalDate(new Date("invalid"))).toThrow(RangeError);
  });
  it("handles leap/month/year boundaries and Gregorian weekdays", () => {
    expect(shiftSchoolDate("2024-03-01", -1)).toBe("2024-02-29");
    expect(shiftSchoolDate("2026-01-01", -1)).toBe("2025-12-31");
    expect(shiftSchoolDate("2026-12-31", 1)).toBe("2027-01-01");
    expect(schoolWeekday("2026-10-11")).toBe(0);
  });
});
