import { describe, expect, it } from "vitest";
import { operationalPulse } from "./DashboardOperationalPulse";

const copy = new Proxy({}, { get: (_, key) => String(key) }) as Record<string, string>;

describe("operationalPulse", () => {
  it("derives organization rings and signal bars from role-scoped health counts", () => {
    const pulse = operationalPulse(
      {
        context: "ORGANIZATION_ADMIN",
        generatedAt: "2026-10-04T00:00:00.000Z",
        assignedStudents: 0,
        unreadConversations: 0,
        students: 20,
        todayPlanHealth: { tasks: 10, completed: 7 },
        studentHealthSummary: { noAdvisor: 2, noReport: 5, noPlan: 4 },
      },
      copy,
    );

    expect(pulse?.rings.map((ring) => ring.value)).toEqual([70, 90, 75]);
    expect(pulse?.signals.map((signal) => signal.value)).toEqual([10, 7, 4, 5]);
  });

  it("keeps platform readiness values bounded when API counts are incomplete", () => {
    const pulse = operationalPulse(
      {
        context: "PLATFORM_ADMIN",
        generatedAt: "2026-10-04T00:00:00.000Z",
        assignedStudents: 0,
        unreadConversations: 0,
        organizations: 3,
        users: 10,
        signupOverview: { enabledOrganizations: 9, remainingCapacity: 20, pendingAssignments: 14 },
        auditSummary: { lockedLogins: 20, events24h: 2 },
      },
      copy,
    );

    expect(pulse?.rings.map((ring) => ring.value)).toEqual([100, 0, 0]);
    expect(pulse?.signals.map((signal) => signal.value)).toEqual([3, 20, 14, 2]);
  });
});
