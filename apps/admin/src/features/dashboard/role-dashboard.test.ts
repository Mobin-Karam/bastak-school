import { describe, expect, it } from "vitest";
import { roleDashboardMetrics } from "./components/RoleDashboard";
import { quickActionsForRole } from "./model/role-experience";
import type { RoleDashboardData } from "./model/dashboard.types";

describe("role dashboard metrics", () => {
  it.each([
    "GUARDIAN",
    "ADVISOR",
    "TEACHER",
    "MENTOR",
    "CONTENT_MANAGER",
    "ORGANIZATION_ADMIN",
    "PLATFORM_ADMIN",
  ])("builds useful cards for %s", (context) => {
    const cards = roleDashboardMetrics({
      context,
      generatedAt: "2026-01-01",
      assignedStudents: 2,
      unreadConversations: 1,
      children: 1,
      subjects: context === "TEACHER" ? [] : 2,
    } as RoleDashboardData);
    expect(cards.length).toBeGreaterThanOrEqual(2);
    expect(cards.every((card) => card.label && card.hint && card.value !== undefined)).toBe(true);
  });

  it("uses the active English adapter for role metrics", () => {
    const cards = roleDashboardMetrics(
      {
        context: "ADVISOR",
        generatedAt: "2026-01-01",
        assignedStudents: 2,
        unreadConversations: 1,
      } as RoleDashboardData,
      "en",
    );

    expect(cards.map((card) => card.label)).toContain("Assigned students");
    expect(cards.map((card) => card.label)).toContain("Unread messages");
  });
});

describe("role dashboard workflows", () => {
  it("prioritizes each role's own work instead of a generic action list", () => {
    expect(
      quickActionsForRole("GUARDIAN", [
        "students.read",
        "plans.read",
        "reports.read",
        "chat.read",
      ])[0],
    ).toMatchObject({
      to: "/admin/students",
      label: "دانش‌آموزان",
    });
    expect(
      quickActionsForRole("CONTENT_MANAGER", ["learning_resources.manage", "questions.read"])[0].to,
    ).toBe("/admin/resources");
    expect(
      quickActionsForRole("PLATFORM_ADMIN", ["student_onboarding.manage", "users.read"])[0].to,
    ).toBe("/admin/onboarding");
  });

  it("never exposes an action missing from the active capability set", () => {
    const actions = quickActionsForRole("TEACHER", ["exams.read", "subjects.read"]);
    expect(actions.map((item) => item.to)).toEqual([
      "/admin/education",
      "/admin/exams",
      "/admin/subjects",
    ]);
    expect(actions.some((item) => item.to === "/admin/questions")).toBe(false);
  });

  it("surfaces additional permitted operational tools without exposing unavailable ones", () => {
    const actions = quickActionsForRole(
      "ORGANIZATION_ADMIN",
      ["students.read", "permission_requests.read", "recovery_requests.read", "student.live.read"],
      "en",
    );

    expect(actions.map((item) => item.to)).toEqual(
      expect.arrayContaining([
        "/admin/permission-requests",
        "/admin/follow-up",
        "/admin/communication/live",
      ]),
    );
    expect(actions.map((item) => item.to)).not.toContain("/admin/database");
    expect(actions.every((item) => item.label && item.description)).toBe(true);
  });

  it("gives every displayed handoff a plain-language outcome", () => {
    const actions = quickActionsForRole("ADVISOR", [
      "students.read",
      "plans.read",
      "learning.read",
      "reports.read",
      "chat.read",
      "learning_resources.manage",
    ]);

    expect(actions).toHaveLength(6);
    expect(actions.every((action) => action.description.length > 12)).toBe(true);
  });
});
