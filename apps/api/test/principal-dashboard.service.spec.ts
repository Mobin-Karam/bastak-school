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
        if (sql.includes("GROUP BY COALESCE(s.operationalDate"))
          return [
            { date: "2026-10-20", present: 8, absent: 1, late: 1, excused: 0 },
          ];
        if (sql.includes("GROUP BY s.contextId")) {
          expect(sql).toContain("GROUP BY sessionId");
          expect(sql).toContain("SUM(COALESCE(records.marked,0)) marked");
          return [{ id: "class-a", name: "پایه اول", marked: 9, expected: 10 }];
        }
        if (
          sql.includes("attendance_session_reviews") &&
          sql.includes("COUNT(DISTINCT s.id)")
        ) {
          expect(sql).toContain("absent_record.physicalStatus='absent'");
          return [{ count: 2 }];
        }
        if (sql.includes("attendance_session_reviews")) {
          expect(sql).toContain("r.physicalStatus='absent'");
          return [
            {
              id: "session-a",
              contextType: "class",
              contextId: "class-a",
              title: "پایه اول",
              sessionDate: "2026-10-20 08:00:00",
              status: "submitted",
              expected: 10,
              marked: 9,
              present: 8,
              absent: 1,
              late: 0,
              excused: 0,
              lastReviewedAt: null,
            },
          ];
        }
        if (sql.includes("COUNT(t.id) total"))
          return [{ total: 4, complete: 3 }];
        if (sql.includes("COUNT(DISTINCT ss.studentId) participants"))
          return [{ participants: 4 }];
        if (sql.includes("COUNT(DISTINCT ea.studentId) participants"))
          return [{ participants: 3 }];
        if (sql.includes("COUNT(DISTINCT s.id)")) return [{ count: 5 }];
        if (sql.includes("HAVING absent"))
          return [
            { id: "student-a", name: "دانش‌آموز الف", absent: 2, late: 1 },
          ];
        if (sql.includes("r.status='absent'"))
          return [
            {
              id: "student-a",
              name: "دانش‌آموز الف",
              context: "پایه اول",
              sessions: 1,
            },
          ];
        if (sql.includes("FROM leave_requests l"))
          return [
            {
              id: "leave-a",
              studentName: "دانش‌آموز الف",
              leaveType: "LEAVE",
              startDate: "2026-10-20",
              endDate: "2026-10-21",
            },
          ];
        return [{ count: 2 }];
      }),
    };
    const service = new PrincipalDashboardService(db as never);

    const dashboard = await service.get(principal, "2026-10-14", "2026-10-20");

    expect(dashboard.organizationId).toBe("school-a");
    expect(dashboard.attendance).toMatchObject({
      rate: 90,
      today: { rate: 90 },
      classes: [{ id: "class-a", rate: 90, expected: 10, marked: 9 }],
    });
    expect(dashboard.behaviour?.dimensions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ key: "study", value: 80 }),
        expect.objectContaining({ key: "assessmentParticipation", value: 60 }),
      ]),
    );
    expect(dashboard.behaviour?.risks).toEqual([
      expect.objectContaining({ id: "student-a", attention: "high" }),
    ]);
    expect(dashboard.queues).toEqual({
      attendanceReviews: 2,
      leaveRequests: 2,
      exitRequests: 2,
      permissionRequests: 2,
    });
    expect(dashboard.sessionReviews).toEqual({
      mode: "absences_only",
      pendingCount: 2,
      items: [
        expect.objectContaining({ id: "session-a", marked: 9, absent: 1 }),
      ],
    });
    expect(dashboard.todayAbsences).toEqual([
      {
        id: "student-a",
        name: "دانش‌آموز الف",
        context: "پایه اول",
        sessions: 1,
      },
    ]);
    expect(dashboard.pendingLeaveRequests).toEqual([
      expect.objectContaining({ id: "leave-a", studentName: "دانش‌آموز الف" }),
    ]);
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
    expect(dashboard).not.toHaveProperty("sessionReviews");
    expect(dashboard).not.toHaveProperty("principalLists");
    expect(dashboard.operations).toEqual({
      activeStudents: 0,
      currentlyOut: 0,
      scheduleEntries: 0,
      staff: 0,
    });
  });

  it("puts every completed session in the principal queue when the all-session policy is enabled", async () => {
    const queries: string[] = [];
    const service = new PrincipalDashboardService({
      query: jest.fn(async (sql: string) => {
        queries.push(sql);
        if (sql.includes("SELECT principalReviewMode"))
          return [{ principalReviewMode: "all_sessions" }];
        if (sql.includes("COUNT(DISTINCT s.id)")) return [{ count: 1 }];
        if (sql.includes("attendance_session_reviews")) return [];
        if (sql.includes("COUNT(r.id) total"))
          return [{ present: 0, absent: 0, late: 0, excused: 0, total: 0 }];
        return [{ count: 0 }];
      }),
    } as never);
    const dashboard = await service.get(principal, "2026-10-14", "2026-10-20");
    expect(dashboard.sessionReviews).toMatchObject({
      mode: "all_sessions",
      pendingCount: 1,
    });
    const reviewCountQuery = queries.find((sql) =>
      sql.includes("COUNT(DISTINCT s.id)"),
    );
    expect(reviewCountQuery).not.toContain("absent_record");
  });

  it("never exposes operational principal lists to an attendance reader", async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new PrincipalDashboardService({ query } as never);

    await expect(
      service.get(
        {
          ...principal,
          roles: ["TEACHER"],
          role: "TEACHER",
          capabilities: ["attendance.read"],
        },
        "2026-10-14",
        "2026-10-20",
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "PRINCIPAL_DASHBOARD_FORBIDDEN" } },
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("never exposes the principal dashboard to the religious education manager", async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new PrincipalDashboardService({ query } as never);

    await expect(
      service.get(
        {
          ...principal,
          roles: ["RELIGIOUS_EDUCATION_MANAGER"],
          role: "RELIGIOUS_EDUCATION_MANAGER",
          capabilities: [
            "schedule.read.all",
            "attendance.read",
            "attendance.manage",
          ],
        },
        "2026-10-14",
        "2026-10-20",
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "PRINCIPAL_DASHBOARD_FORBIDDEN" } },
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("requires an explicit active organization and rejects unbounded or invalid date ranges", async () => {
    const query = jest.fn().mockResolvedValue([]);
    const service = new PrincipalDashboardService({ query } as never);
    await expect(
      service.get(
        { ...principal, activeOrganizationId: undefined },
        "2026-10-14",
        "2026-10-20",
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "ORGANIZATION_REQUIRED" } },
    });
    await expect(
      service.get(principal, "2026-01-01", "2026-03-01"),
    ).rejects.toMatchObject({
      response: { error: { code: "DATE_RANGE_TOO_LARGE" } },
    });
    await expect(
      service.get(principal, "2026-02-30", "2026-03-01"),
    ).rejects.toMatchObject({
      response: { error: { code: "DATE_RANGE_INVALID" } },
    });
    expect(query).not.toHaveBeenCalled();
  });

  it("rejects a class filter that is not active in the selected organization", async () => {
    const query = jest.fn().mockResolvedValue([{ count: 0 }]);
    const service = new PrincipalDashboardService({ query } as never);
    await expect(
      service.get(
        principal,
        "2026-10-14",
        "2026-10-20",
        "class-from-another-school",
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "CLASS_NOT_FOUND" } },
    });
    expect(query).toHaveBeenCalledWith(
      expect.stringContaining("education_classes"),
      ["class-from-another-school", "school-a"],
    );
  });
});
