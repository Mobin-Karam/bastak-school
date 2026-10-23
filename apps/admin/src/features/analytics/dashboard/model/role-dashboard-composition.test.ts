import { describe, expect, it } from "vitest";
import { dashboardCompositionForRole, dashboardWidgetRole } from "./role-dashboard-composition";

describe("role dashboard composition", () => {
  it.each([
    ["STUDENT", "student"],
    ["GUARDIAN", "guardian"],
    ["TEACHER", "teacher"],
    ["PRINCIPAL", "school"],
    ["SCHOOL_SUPERVISOR", "school"],
    ["COUNSELOR", "operational"],
  ] as const)("reuses the %s role composition", (role, composition) => {
    expect(dashboardCompositionForRole(role)).toBe(composition);
  });

  it("maps contextual school roles to existing reusable widget sets", () => {
    expect(dashboardWidgetRole("RELIGIOUS_EDUCATION_MANAGER")).toBe("ORGANIZATION_ADMIN");
    expect(dashboardWidgetRole("STUDENT_AFFAIRS_MENTOR")).toBe("MENTOR");
    expect(dashboardWidgetRole("COUNSELOR")).toBe("ADVISOR");
  });
});
