import { EducationSharingService } from "../src/modules/education-sharing/education-sharing.service";
import { AuditLog } from "../src/database/entities/audit-log.entity";

const actor = {
  id: "user-a",
  role: "STUDENT",
  roles: ["STUDENT"],
  capabilities: ["education.share"],
} as never;

function repository(overrides: Record<string, unknown> = {}) {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => ({ id: "saved", ...value })),
    delete: jest.fn(),
    ...overrides,
  } as never;
}

describe("EducationSharingService", () => {
  it("only exposes active peer students from a shared organization", async () => {
    const source = {
      id: "student-a",
      accountStatus: "active",
      user: { id: "user-a" },
    };
    const students = repository({
      findOne: jest.fn().mockResolvedValue(source),
    });
    const memberships = repository({
      find: jest
        .fn()
        .mockResolvedValueOnce([{ organization: { id: "org-a" } }])
        .mockResolvedValueOnce([
          {
            organization: { id: "org-a", name: "Private" },
            user: { student: source },
          },
          {
            organization: { id: "org-a", name: "Private" },
            user: {
              student: {
                id: "student-b",
                name: "B",
                grade: "12",
                accountStatus: "active",
              },
            },
          },
          {
            organization: { id: "org-a", name: "Private" },
            user: {
              student: {
                id: "student-c",
                name: "C",
                grade: "11",
                accountStatus: "inactive",
              },
            },
          },
        ]),
    });
    const service = new EducationSharingService(
      students,
      memberships,
      repository(),
      repository(),
      repository(),
      repository(),
      repository(),
      {} as never,
    );
    await expect(service.peers(actor)).resolves.toEqual([
      { id: "student-b", name: "B", grade: "12", organizationName: "Private" },
    ]);
  });

  it("copies a plan for a same-organization peer and resets task progress", async () => {
    const sourceStudent = {
      id: "student-a",
      accountStatus: "active",
      user: { id: "user-a" },
    };
    const targetStudent = {
      id: "student-b",
      accountStatus: "active",
      user: { id: "user-b" },
    };
    const students = repository({
      findOne: jest.fn().mockResolvedValue(targetStudent),
    });
    const memberships = repository({
      find: jest.fn().mockResolvedValue([{ organization: { id: "org-a" } }]),
    });
    const sourcePlan = {
      id: "plan-a",
      date: "2026-09-21",
      status: "PUBLISHED",
      title: "برنامه ریاضی",
      dayLabel: "شنبه",
      persianDate: "۱ مهر",
      jalaliId: "1405-07-01",
      motivationText: "با تمرکز ادامه بده",
      student: sourceStudent,
      tasks: [
        {
          type: "STUDY",
          title: "Math",
          subject: "Math",
          description: "",
          startTime: "08:00",
          endTime: "09:00",
          duration: 60,
          testCount: 0,
          note: "",
          priority: 0,
          pages: "10 تا 20",
          examRef: "math-exam",
          examId: "exam-1",
          conflict: true,
          conflictGroup: "morning",
          status: "DONE",
          completedAt: new Date(),
        },
      ],
    };
    const plans: any = repository({
      findOne: jest
        .fn()
        .mockResolvedValueOnce(sourcePlan)
        .mockResolvedValueOnce(null),
      findOneOrFail: jest.fn().mockResolvedValue({ id: "copy" }),
    });
    const tasks: any = repository();
    const service = new EducationSharingService(
      students,
      memberships,
      plans,
      tasks,
      repository(),
      repository(),
      repository(),
      {} as never,
    );
    await service.sharePlan(actor, "plan-a", "student-b");
    expect(tasks.save).toHaveBeenCalledWith([
      expect.objectContaining({
        status: "PLANNED",
        completedAt: null,
        pages: "10 تا 20",
        examRef: "math-exam",
        conflict: true,
      }),
    ]);
    expect(plans.save).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "برنامه ریاضی",
        persianDate: "۱ مهر",
        motivationText: "با تمرکز ادامه بده",
      }),
    );
  });

  it("rejects student sharing across organization boundaries", async () => {
    const source = {
      id: "student-a",
      accountStatus: "active",
      user: { id: "user-a" },
    };
    const target = {
      id: "student-b",
      accountStatus: "active",
      user: { id: "user-b" },
    };
    const students = repository({
      findOne: jest.fn().mockResolvedValue(target),
    });
    const memberships = repository({
      find: jest
        .fn()
        .mockResolvedValueOnce([{ organization: { id: "org-a" } }])
        .mockResolvedValueOnce([{ organization: { id: "org-b" } }]),
    });
    const plans = repository({
      findOne: jest
        .fn()
        .mockResolvedValue({ id: "plan-a", student: source, tasks: [] }),
    });
    const service = new EducationSharingService(
      students,
      memberships,
      plans,
      repository(),
      repository(),
      repository(),
      repository(),
      {} as never,
    );
    await expect(
      service.sharePlan(actor, "plan-a", "student-b"),
    ).rejects.toMatchObject({
      response: { error: { code: "SHARE_SCOPE_FORBIDDEN" } },
    });
  });

  it("copies a date range to every authorized target and skips existing plans by default", async () => {
    const sourceStudent = {
      id: "student-a",
      accountStatus: "active",
      user: { id: "user-a" },
    };
    const targetOne = {
      id: "student-b",
      accountStatus: "active",
      user: { id: "user-b" },
    };
    const targetTwo = {
      id: "student-c",
      accountStatus: "active",
      user: { id: "user-c" },
    };
    const sourcePlans = [
      {
        id: "plan-a",
        date: "2026-09-20",
        status: "PUBLISHED",
        student: sourceStudent,
        tasks: [],
      },
      {
        id: "plan-b",
        date: "2026-09-21",
        status: "DRAFT",
        student: sourceStudent,
        tasks: [],
      },
    ];
    const students = repository({
      findOne: jest
        .fn()
        .mockResolvedValueOnce(targetOne)
        .mockResolvedValueOnce(targetTwo),
    });
    const transactionPlans: any = repository({
      findOne: jest
        .fn()
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ id: "existing", tasks: [] })
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null),
      save: jest.fn(async (value) => ({ id: "copy", ...value })),
    });
    const transactionTasks: any = repository();
    const transactionAudits: any = repository();
    const manager = {
      getRepository: jest.fn((entity) => {
        if (entity.name === "Plan") return transactionPlans;
        if (entity === AuditLog) return transactionAudits;
        return transactionTasks;
      }),
    };
    const plans: any = repository({
      findOne: jest
        .fn()
        .mockResolvedValue({ ...sourcePlans[0], tasks: undefined }),
      find: jest.fn().mockResolvedValue(sourcePlans),
    });
    plans.manager = { transaction: jest.fn(async (work) => work(manager)) };
    const authorization = {
      canAccessStudent: jest.fn().mockResolvedValue(true),
    } as never;
    const service = new EducationSharingService(
      students,
      repository(),
      plans,
      repository(),
      repository(),
      repository(),
      repository(),
      authorization,
    );

    await expect(
      service.sharePlanRange(
        { id: "advisor", role: "ADVISOR", roles: ["ADVISOR"] } as never,
        "plan-a",
        {
          targetStudentIds: ["student-b", "student-c"],
          sourceFrom: "2026-09-20",
          sourceTo: "2026-09-21",
          targetStartDate: "2026-09-27",
        },
      ),
    ).resolves.toMatchObject({
      targetCount: 2,
      copied: 3,
      skipped: 1,
      conflictPolicy: "skip",
    });
    expect(transactionPlans.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student: { id: "student-b" }, date: "2026-09-27" },
      }),
    );
    expect(transactionAudits.save).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "education.plan_range_shared",
        entity: "plan_range",
        metadata: expect.objectContaining({ copied: 3, skipped: 1 }),
      }),
    );
    expect(transactionPlans.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { student: { id: "student-c" }, date: "2026-09-28" },
      }),
    );
  });

  it("checks every target before beginning a range copy", async () => {
    const sourceStudent = {
      id: "student-a",
      accountStatus: "active",
      user: { id: "user-a" },
    };
    const students = repository({ findOne: jest.fn().mockResolvedValue(null) });
    const plans: any = repository({
      findOne: jest
        .fn()
        .mockResolvedValue({
          id: "plan-a",
          date: "2026-09-20",
          student: sourceStudent,
        }),
      find: jest
        .fn()
        .mockResolvedValue([
          {
            id: "plan-a",
            date: "2026-09-20",
            student: sourceStudent,
            tasks: [],
          },
        ]),
    });
    plans.manager = { transaction: jest.fn() };
    const service = new EducationSharingService(
      students,
      repository(),
      plans,
      repository(),
      repository(),
      repository(),
      repository(),
      { canAccessStudent: jest.fn().mockResolvedValue(true) } as never,
    );
    await expect(
      service.sharePlanRange(
        { id: "advisor", role: "ADVISOR", roles: ["ADVISOR"] } as never,
        "plan-a",
        {
          targetStudentIds: ["student-b"],
          sourceFrom: "2026-09-20",
          sourceTo: "2026-09-20",
          targetStartDate: "2026-09-20",
        },
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "SHARE_TARGET_NOT_FOUND" } },
    });
    expect(plans.manager.transaction).not.toHaveBeenCalled();
  });

  it("previews destination plans and time conflicts before a range is copied", async () => {
    const sourceStudent = {
      id: "student-a",
      accountStatus: "active",
      user: { id: "user-a" },
    };
    const target = {
      id: "student-b",
      name: "Student B",
      accountStatus: "active",
      user: { id: "user-b" },
    };
    const sourcePlan = {
      id: "plan-a",
      date: "2026-09-20",
      student: sourceStudent,
      tasks: [
        { startTime: "08:00", endTime: "09:00", title: "Math" },
      ],
    };
    const existingPlan = {
      id: "plan-b",
      date: "2026-09-27",
      student: target,
      tasks: [{ startTime: "08:30", endTime: "09:30", title: "Science" }],
    };
    const students = repository({ findOne: jest.fn().mockResolvedValue(target) });
    const plans = repository({
      findOne: jest.fn().mockResolvedValue({ ...sourcePlan, tasks: undefined }),
      find: jest
        .fn()
        .mockResolvedValueOnce([sourcePlan])
        .mockResolvedValueOnce([existingPlan]),
    });
    const service = new EducationSharingService(
      students,
      repository(),
      plans,
      repository(),
      repository(),
      repository(),
      repository(),
      { canAccessStudent: jest.fn().mockResolvedValue(true) } as never,
    );

    await expect(
      service.previewPlanRange(
        { id: "advisor", role: "ADVISOR", roles: ["ADVISOR"] } as never,
        "plan-a",
        {
          targetStudentIds: ["student-b"],
          sourceFrom: "2026-09-20",
          sourceTo: "2026-09-20",
          targetStartDate: "2026-09-27",
        },
      ),
    ).resolves.toMatchObject({
      summary: {
        targetCount: 1,
        existingPlanCount: 1,
        emptyDestinationDayCount: 0,
        timeConflictCount: 1,
        examCollisionCount: 0,
        overCapacityDayCount: 0,
        proposedMinutes: 60,
      },
      recipients: [
        {
          studentId: "student-b",
          days: [{ date: "2026-09-27", existingPlan: true, timeConflicts: 1 }],
        },
      ],
    });
  });
});
