import type { RoleCode } from "../../../shared/types/domain";

/**
 * Selects an existing dashboard composition for an AccountContext role. This is
 * presentation only: route and API authorization remain capability-enforced.
 */
export type DashboardComposition = "student" | "guardian" | "teacher" | "school" | "operational";

const compositionByRole: Partial<Record<RoleCode, DashboardComposition>> = {
  STUDENT: "student",
  GUARDIAN: "guardian",
  TEACHER: "teacher",
  PRINCIPAL: "school",
  SCHOOL_SUPERVISOR: "school",
  DISCIPLINARIAN: "school",
};

export function dashboardCompositionForRole(role: RoleCode | null | undefined): DashboardComposition {
  return (role && compositionByRole[role]) || "operational";
}

/** Maps school-specific role identifiers to the existing reusable dashboard widget sets. */
export function dashboardWidgetRole(role: string): string {
  if (
    [
      "SCHOOL_ADMIN",
      "SCHOOL_SUPERVISOR",
      "PRINCIPAL",
      "DISCIPLINARIAN",
      "RELIGIOUS_EDUCATION_MANAGER",
      "GOVERNMENT_EDUCATION_MANAGER",
    ].includes(role)
  ) {
    return "ORGANIZATION_ADMIN";
  }
  if (role === "STUDENT_AFFAIRS_MENTOR") return "MENTOR";
  if (role === "COUNSELOR") return "ADVISOR";
  return role;
}
