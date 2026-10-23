import { describe, expect, it } from "vitest";
import {
  educationOperationsCsv,
  educationOperationsFiltersToRequest,
  educationOperationsQueryKey,
  hasCompleteEducationPeriod,
} from "./education-operations";

describe("education operations flow model", () => {
  it("keeps incomplete date ranges out of the operations request", () => {
    expect(
      hasCompleteEducationPeriod({ periodFrom: "2026-10-01", periodTo: "", cohortGrade: "10" }),
    ).toBe(false);
    expect(
      educationOperationsFiltersToRequest({
        periodFrom: "2026-10-01",
        periodTo: "",
        cohortGrade: "10",
      }),
    ).toEqual({
      period: null,
      grade: 10,
    });
  });

  it("builds a stable scoped query key", () => {
    expect(educationOperationsQueryKey({ periodFrom: "", periodTo: "", cohortGrade: "" })).toEqual([
      "education-catalog",
      "operations",
      "all",
      "all",
      "all",
    ]);
  });

  it("escapes spreadsheet values when exporting operations", () => {
    expect(
      educationOperationsCsv({
        scope: "organization",
        period: null,
        cohort: null,
        students: { total: 2, complete: 1, incomplete: 1, missingMappings: 0 },
        coverage: {
          planned: 1,
          withoutPlan: 1,
          resourced: 2,
          withoutResources: 0,
          examined: 1,
          reported: 1,
        },
        trends: {
          submittedAttempts: 1,
          averageExamPercentage: 85,
          totalStudyHours: 12,
          averageStudyHours: 6,
        },
        remediation: {
          incompleteProfiles: [],
          withoutPlan: [],
          withoutResources: [],
          withoutExam: [],
          withoutReport: [],
        },
        catalog: { published: 1, draft: 0, archived: 0 },
        distribution: [],
      }),
    ).toContain('"میانگین آزمون","85"');
  });
});
