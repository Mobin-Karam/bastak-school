import { PrincipalDashboardService } from "../src/modules/dashboard/principal-dashboard.service";

const principal = {
  id: "principal-1",
  username: "principal",
  role: "PRINCIPAL",
  roles: ["PRINCIPAL"],
  sessionId: "session-1",
  activeOrganizationId: "school-a",
  organizationIds: ["school-a", "school-b"],
  capabilities: [
    "students.read",
    "attendance.review",
    "analytics.read",
    "leave.read",
    "exit.read",
    "permission_requests.read",
    "dormitory.read",
    "schedule.read.all",
  ],
};

describe("PrincipalDashboardService", () => {
  it("binds every leadership query to the active organization and exposes only enabled sections", async () => {
    const db = {
      query: jest.fn(async (sql: string, parameters: unknown[]) => {
        expect(parameters).toContain("school-a");
        expect(parameters).not.toContain("school-b");
        if (sql.includes("COUNT(r.id) total"))
          return [{ present: 8, absent: 1, late: 1, excused: 0, total: 10 }];
        if (sql.includes("GROUP BY date(s.sessionDate)"))
          return [
            { date: "2026-10-20", present: 8, absent: 1, late: 1, excused: 0 },
          ];
        if (sql.includes("GROUP BY s.contextId"))
          return [{ id: "class-a", name: "پایه اول", marked: 10, onTime: 9 }];
        if (sql.includes("COUNT(t.id) total"))
          return [{ total: 4, complete: 3 }];
        if (sql.includes("COUNT(ss.id) sessions")) return [{ sessions: 5 }];
        if (sql.includes("AVG(ea.score)")) return [{ average: 78 }];
        if (sql.includes("COUNT(DISTINCT s.id)")) return [{ count: 5 }];
        if (sql.includes("HAVING absent"))
          return [
            { id: "student-a", name: "دانش‌آموز الف", absent: 2, late: 1 },
          ];
        return [{ count: 2 }];
      }),
    };
    const service = new PrincipalDashboardService(db as never);

    const dashboard = await service.get(principal, "2026-10-14", "2026-10-20");

    expect(dashboard.organizationId).toBe("school-a");
    expect(dashboard.attendance).toMatchObject({
      rate: 90,
      classes: [{ id: "class-a", rate: 90 }],
    });
    expect(dashboard.behaviour?.risks).toEqual([
      expect.objectContaining({ id: "student-a", attention: "high" }),
    ]);
    expect(dashboard.queues).toEqual({
      attendanceReviews: 2,
      leaveRequests: 2,
      exitRequests: 2,
      permissionRequests: 2,
    });
  });

  it("does not return attendance, behaviour, queues, or operations without their source capabilities", async () => {
    const service = new PrincipalDashboardService({
      query: jest.fn().mockResolvedValue([]),
    } as never);
    const dashboard = await service.get(
      { ...principal, capabilities: ["students.read"] },
      "2026-10-14",
      "2026-10-20",
    );
    expect(dashboard).not.toHaveProperty("attendance");
    expect(dashboard).not.toHaveProperty("behaviour");
    expect(dashboard).not.toHaveProperty("queues");
    expect(dashboard.operations).toEqual({
      activeStudents: 0,
      currentlyOut: 0,
      scheduleEntries: 0,
      staff: 0,
    });
  });
});
