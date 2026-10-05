import { DashboardService } from "../src/modules/dashboard/dashboard.service";

const advisor = {
  id: "advisor-1",
  username: "advisor",
  role: "ADVISOR",
  roles: ["ADVISOR"],
  capabilities: ["recovery_requests.read"],
  sessionId: "session-1",
};

describe("DashboardService attentionQueue", () => {
  it("only returns student work that passes the existing source capability and student scope", async () => {
    const db = {
      query: jest.fn().mockResolvedValue([
        {
          id: "recovery-1",
          studentId: "student-allowed",
          studentName: "دانش‌آموز مجاز",
          createdAt: "2026-10-01T08:00:00.000Z",
          planDate: "2026-10-01",
          message: "نیاز به بازیابی",
        },
        {
          id: "recovery-2",
          studentId: "student-forbidden",
          studentName: "دانش‌آموز غیرمجاز",
          createdAt: "2026-10-01T09:00:00.000Z",
          planDate: "2026-10-01",
          message: "نباید نمایش داده شود",
        },
      ]),
    };
    const authorization = {
      hasCapability: jest.fn(
        (_: unknown, capability: string) =>
          capability === "recovery_requests.read",
      ),
      canAccessStudent: jest.fn(
        (_: unknown, studentId: string) => studentId === "student-allowed",
      ),
    };
    const service = new DashboardService(db as never, authorization as never);

    const queue = await service.attentionQueue(advisor, 20);

    expect(queue.items).toHaveLength(1);
    expect(queue.items[0]).toMatchObject({
      id: "recovery:recovery-1",
      type: "recovery",
      descriptionKind: "user",
      status: "open",
      student: { id: "student-allowed" },
      deepLink: "/admin/follow-up",
    });
    expect(authorization.canAccessStudent).toHaveBeenCalledWith(
      expect.anything(),
      "student-forbidden",
      "recovery_requests.read",
    );
  });
});

describe("DashboardService organization dashboard", () => {
  it("derives student health only from the active organization scope", async () => {
    const db = {
      query: jest.fn(async (sql: string, args: unknown[] = []) => {
        if (sql.includes("lastActiveAt")) {
          expect(args).toEqual(["org-allowed", "org-allowed", "org-allowed"]);
          return [
            {
              id: "student-1",
              name: "دانش‌آموز مجاز",
              plansToday: 0,
              tasksToday: 0,
              completedToday: 0,
              reportSubmitted: 0,
              syncStatus: "failed",
              openIssues: 1,
              pendingRecoveries: 0,
            },
          ];
        }
        if (sql.includes("COUNT(DISTINCT s.id)")) {
          expect(args.every((value) => value === "org-allowed")).toBe(true);
          return [{ n: 2 }];
        }
        if (sql.includes("COUNT(DISTINCT p.id) plans")) {
          expect(args).toEqual(["org-allowed"]);
          return [{ plans: 2, tasks: 4, completed: 1 }];
        }
        if (sql.includes("GROUP BY u.id")) {
          expect(args).toEqual(["org-allowed"]);
          return [];
        }
        if (sql.includes("chat_messages")) return [{ n: 0 }];
        expect(args).toEqual(["org-allowed"]);
        return [{ n: 1 }];
      }),
    };
    const service = new DashboardService(db as never, {} as never);
    const data = await service.get({
      id: "org-admin-1",
      username: "org-admin",
      role: "ORGANIZATION_ADMIN",
      roles: ["ORGANIZATION_ADMIN"],
      organizationIds: ["org-allowed"],
      sessionId: "session-1",
    });

    expect(data).toMatchObject({
      context: "ORGANIZATION_ADMIN",
      todayPlanHealth: { plans: 2, tasks: 4, completed: 1 },
      studentHealthSummary: { noPlan: 2, noReport: 2, syncFailed: 2, openIssues: 2, noAdvisor: 2 },
      studentHealth: [
        expect.objectContaining({
          id: "student-1",
          syncStatus: "failed",
          openIssues: 1,
        }),
      ],
      advisorCoverage: [],
    });
  });
});

describe("DashboardService platform enrollment overview", () => {
  it("reports only actionable direct-signup capacity and pending assignment work", async () => {
    const db = {
      query: jest.fn(async (sql: string) => {
        if (sql.includes("COUNT(*)n FROM organizations")) return [{ n: 4 }];
        if (sql.includes("SUM(studentSignupLimit-studentSignupCount)")) return [{ n: 27 }];
        if (sql.includes("onboardingStatus='PENDING_ASSIGNMENT'")) return [{ n: 3 }];
        if (sql.includes("COUNT(*)n FROM users")) return [{ n: 19 }];
        if (sql.includes("chat_messages")) return [{ n: 0 }];
        return [{ n: 0 }];
      }),
    };
    const service = new DashboardService(db as never, {} as never);
    const data = await service.get({
      id: "platform-1", username: "platform", role: "PLATFORM_ADMIN", roles: ["PLATFORM_ADMIN"], sessionId: "session-1",
    });

    expect(data).toMatchObject({
      context: "PLATFORM_ADMIN",
      signupOverview: { enabledOrganizations: 4, remainingCapacity: 27, pendingAssignments: 3 },
    });
  });
});
