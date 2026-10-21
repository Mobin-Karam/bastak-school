import { describe, expect, it, vi } from "vitest";

const { get } = vi.hoisted(() => ({ get: vi.fn() }));

vi.mock("../../../../shared/api/api", () => ({ api: { get } }));

import {
  getAttendanceHistorySessions,
  getAttendanceReportSummary,
} from "./attendance-operations.api";

describe("attendance report API", () => {
  it("omits empty filters and sends inclusive date and academic filters when selected", () => {
    getAttendanceReportSummary();
    expect(get).toHaveBeenLastCalledWith("/attendance/reports/summary");

    getAttendanceReportSummary({
      from: "2026-10-01",
      to: "2026-10-31",
      academicYearId: "year-1",
      termId: "term-1",
    });
    expect(get).toHaveBeenLastCalledWith(
      "/attendance/reports/summary?from=2026-10-01T00%3A00%3A00.000Z&to=2026-10-31T23%3A59%3A59.999Z&academicYearId=year-1&termId=term-1",
    );
  });
});

describe("attendance session history API", () => {
  it("requests a bounded server-side history page", () => {
    getAttendanceHistorySessions(2, 50);
    expect(get).toHaveBeenLastCalledWith("/attendance/history/sessions?page=2&limit=50");
  });
});
