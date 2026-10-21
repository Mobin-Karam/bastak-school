import { describe, it, expect } from "vitest";
import type { TimetableWorkspace } from "@moshaver/api-contract";
import { timetableSetup } from "./TimetableOnboarding";
const empty: TimetableWorkspace = {
  organizationId: "org",
  years: [],
  terms: [],
  sections: [],
  locations: [],
  bells: [],
  sessions: [],
  periods: [],
  versions: [],
  lessons: [],
  overrides: [],
  holidays: [],
  availability: [],
  allocations: [],
  changes: [],
  classes: [],
  teachers: [],
  conflicts: [],
  occurrences: [],
};
describe("timetable setup progress", () => {
  it("resumes the next prerequisite from saved data", () => {
    expect(timetableSetup(empty).steps[timetableSetup(empty).next].kind).toBe("year");
    const year = {
      id: "year",
      name: "۱۴۰۵",
      organizationId: "org",
      startsOn: "2026-01-01",
      endsOn: "2026-12-31",
      active: true,
      timeZone: "Asia/Tehran",
    };
    const workspace = {
      ...empty,
      years: [year],
      terms: [
        {
          id: "term",
          name: "نیمسال",
          yearId: year.id,
          startsOn: year.startsOn,
          endsOn: year.endsOn,
        },
      ],
      bells: [{ id: "bell", name: "زنگ‌ها", organizationId: "org", sectionId: null }],
      sessions: [
        {
          id: "session",
          name: "صبح",
          bellId: "bell",
          kind: "MORNING" as const,
          startTime: "07:00",
          endTime: "12:00",
        },
      ],
    };
    expect(timetableSetup(workspace).steps[timetableSetup(workspace).next].kind).toBe("period");
    expect(
      timetableSetup({
        ...workspace,
        periods: [
          {
            id: "period",
            name: "اول",
            sessionId: "other-session",
            ordinal: 1,
            startTime: "08:00",
            endTime: "09:00",
          },
        ],
      }).next,
    ).toBe(4);
  });
});
