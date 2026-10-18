import type { EducationOperationsOverview } from "../api/education-catalog.api";

export type EducationOperationsFilters = {
  periodFrom: string;
  periodTo: string;
  cohortGrade: string;
};

export function hasCompleteEducationPeriod({ periodFrom, periodTo }: EducationOperationsFilters) {
  return Boolean(periodFrom) === Boolean(periodTo);
}

export function educationOperationsQueryKey(filters: EducationOperationsFilters) {
  return [
    "education-catalog",
    "operations",
    filters.periodFrom || "all",
    filters.periodTo || "all",
    filters.cohortGrade || "all",
  ] as const;
}

export function educationOperationsFiltersToRequest(filters: EducationOperationsFilters) {
  return {
    period:
      filters.periodFrom && filters.periodTo
        ? { from: filters.periodFrom, to: filters.periodTo }
        : null,
    grade: filters.cohortGrade ? Number(filters.cohortGrade) : null,
  };
}

export function educationOperationsCsv(overview: EducationOperationsOverview) {
  const rows = [
    ["شاخص", "مقدار"],
    ["محدوده", overview.scope],
    ["گروه پایه", overview.cohort?.grade ?? "همه"],
    ["از تاریخ", overview.period?.from ?? "همه زمان‌ها"],
    ["تا تاریخ", overview.period?.to ?? "همه زمان‌ها"],
    ["دانش‌آموزان", overview.students.total],
    ["پرونده کامل", overview.students.complete],
    ["بدون برنامه", overview.coverage.withoutPlan],
    ["بدون منبع", overview.coverage.withoutResources],
    ["میانگین آزمون", overview.trends.averageExamPercentage ?? ""],
    ["تلاش آزمون نهایی", overview.trends.submittedAttempts],
    ["ساعت مطالعه", overview.trends.totalStudyHours],
  ];

  return rows
    .map((row) => row.map((value) => `"${String(value).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
