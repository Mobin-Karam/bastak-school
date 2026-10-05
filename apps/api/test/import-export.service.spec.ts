import {
  Exam,
  ExamAssignment,
  ExamSyllabus,
  ImportHistory,
  Organization,
  Plan,
  Student,
  Task,
  User,
} from "../src/database/entities";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { ImportExportService } from "../src/modules/import-export/import-export.service";

const context = {
  id: "advisor-1",
  role: "ADVISOR",
  roles: ["ADVISOR"],
  capabilities: ["import.preview", "import.commit", "export.read"],
  membershipIds: [],
  organizationIds: ["org-1"],
} as any;

function authorization() {
  return {
    requireCapability: jest.fn(),
    canAccessStudent: jest.fn(async () => true),
    canAccessOrganization: jest.fn(() => true),
  };
}

describe("ImportExportService", () => {
  it("accepts the committed JSON import sample", async () => {
    const manager = { find: jest.fn(async () => []) };
    const service = new ImportExportService({ manager } as any, authorization() as any);
    const sample = JSON.parse(
      readFileSync(
        resolve(__dirname, "../../../examples/week-plan-and-exam-v2.json"),
        "utf8",
      ),
    );

    const preview = await service.preview(context, { ...sample, studentId: "student-1" });

    expect(preview.valid).toBe(true);
    expect(preview.summary).toEqual(
      expect.objectContaining({ plans: 2, tasks: 3, exams: 1, questions: 1 }),
    );
  });

  it("normalizes rich plan fields and legacy exam references from advisor exports", async () => {
    const manager = { find: jest.fn(async () => []) };
    const service = new ImportExportService({ manager } as any, authorization() as any);
    const preview = await service.preview(context, {
      schemaVersion: "2",
      student: { id: "student-1" },
      plans: [{
        planDate: "2026-09-20", title: "برنامه آزمون", motivationText: "قدم بعدی را انجام بده.", published: true,
        tasks: [{ type: "prayer", title: "نماز", start: "10:00", end: "10:15", pages: "", examId: "math-ref", conflict: true, conflictGroup: "overlap" }],
      }],
      exams: [{
        ref: "math-ref", title: "آزمون ریاضی", durationMinutes: 30, maxAttempts: 1, published: true,
        instructions: "حدس نزن.", syllabus: [{ subject: "ریاضی", description: "فصل یک", required: true, track: "دوازدهم" }],
        questions: [{ question: "۲ + ۲؟", options: ["۱", "۲", "۳", "۴"], correctOption: "d", sortOrder: 2 }],
      }],
    });

    expect(preview.valid).toBe(true);
    expect(preview.schemaVersion).toBe("2.0");
    expect(preview.normalized.plans[0]).toEqual(expect.objectContaining({ motivationText: "قدم بعدی را انجام بده." }));
    expect(preview.normalized.plans[0].tasks[0]).toEqual(expect.objectContaining({ type: "PRAYER", examRef: "math-ref", conflict: true }));
    expect(preview.normalized.exams[0]).toEqual(expect.objectContaining({ externalRef: "math-ref", instructions: ["حدس نزن."] }));
    expect(preview.normalized.exams[0].questions[0].correctAnswer).toBe("۴");
  });

  it("accepts the editable plan and exam example shape", async () => {
    const manager = { find: jest.fn(async () => []) };
    const service = new ImportExportService(
      { manager } as any,
      authorization() as any,
    );

    const preview = await service.preview(context, {
      schemaVersion: "2.0",
      studentId: "student-1",
      scope: "all",
      plans: [
        {
          date: "2026-09-20",
          published: false,
          tasks: [
            {
              type: "STUDY",
              title: "مطالعه فصل اول",
              subject: "ریاضی",
              startTime: "08:00",
              endTime: "09:00",
              duration: 60,
              testCount: 0,
              priority: 0,
            },
          ],
        },
      ],
      exams: [
        {
          title: "آزمون نمونه ریاضی",
          subject: "ریاضی",
          durationMinutes: 60,
          maxAttempts: 1,
          openAt: "2026-09-21T08:00:00.000Z",
          closeAt: "2026-09-21T10:00:00.000Z",
          questions: [
            {
              text: "حاصل ۲ + ۲ کدام است؟",
              options: ["۱", "۲", "۳", "۴"],
              correctAnswer: "۴",
            },
          ],
        },
      ],
    });

    expect(preview.valid).toBe(true);
    expect(preview.summary).toEqual(
      expect.objectContaining({ plans: 1, tasks: 1, exams: 1, questions: 1 }),
    );
  });

  it("rejects plan preview without a destination student", async () => {
    const manager = { find: jest.fn(async () => []) };
    const service = new ImportExportService(
      { manager } as any,
      authorization() as any,
    );

    const preview = await service.preview(context, {
      schemaVersion: "2.0",
      scope: "plans",
      plans: [{ date: "2026-09-20", tasks: [{ type: "STUDY", title: "مطالعه" }] }],
    });

    expect(preview.valid).toBe(false);
    expect(preview.errors).toContain("studentId is required when importing plans");
  });

  it("counts and checks conflicts only inside the selected scope", async () => {
    const manager = { find: jest.fn(async () => []) };
    const service = new ImportExportService(
      { manager } as any,
      authorization() as any,
    );

    const preview = await service.preview(context, {
      schemaVersion: "2.0",
      studentId: "student-1",
      scope: "plans",
      plans: [{ date: "2026-09-20", tasks: [{ type: "STUDY", title: "مطالعه" }] }],
      exams: [
        {
          title: "آزمون نادیده",
          durationMinutes: 60,
          maxAttempts: 1,
          questions: [],
        },
      ],
    });

    expect(preview.summary).toEqual(
      expect.objectContaining({ plans: 1, tasks: 1, exams: 0, questions: 0 }),
    );
    expect(manager.find).toHaveBeenCalledTimes(1);
  });

  it("reports existing rows as preview conflicts without hiding valid counts", async () => {
    const manager = {
      find: jest.fn(async (entity: unknown) =>
        entity === Plan ? [{ date: "2026-09-20" }] : [],
      ),
    };
    const service = new ImportExportService(
      { manager } as any,
      authorization() as any,
    );
    const preview = await service.preview(context, {
      schemaVersion: "2.0",
      studentId: "student-1",
      scope: "plans",
      plans: [
        { date: "2026-09-20", tasks: [{ type: "STUDY", title: "مطالعه" }] },
      ],
    });

    expect(preview.valid).toBe(true);
    expect(preview.summary).toEqual(
      expect.objectContaining({ plans: 1, tasks: 1, conflicts: 1 }),
    );
    expect(preview.conflicts).toEqual(["برنامه 2026-09-20 از قبل وجود دارد."]);
  });

  it("imports an exam as published and assigns it only to the selected student", async () => {
    const actor = { id: "advisor-1" };
    const student = { id: "student-1" };
    const organization = { id: "org-1" };
    const saved: Array<{ entity: unknown; value: any }> = [];
    const manager = {
      find: jest.fn(async () => []),
      findOneByOrFail: jest.fn(async (entity: unknown) =>
        entity === User ? actor : entity === Student ? student : organization,
      ),
      findOne: jest.fn(async () => null),
      findOneBy: jest.fn(async () => organization),
      create: jest.fn((_entity: unknown, value: any) => value),
      delete: jest.fn(),
      save: jest.fn(async (entity: unknown, value: any) => {
        if (Array.isArray(value)) {
          saved.push({ entity, value });
          return value;
        }
        const result = {
          id:
            entity === ImportHistory
              ? "history-1"
              : entity === Exam
                ? "exam-1"
                : "saved-1",
          ...value,
        };
        saved.push({ entity, value: result });
        return result;
      }),
    };
    const db = {
      manager,
      transaction: jest.fn(async (work: any) => work(manager)),
    } as any;
    const service = new ImportExportService(db, authorization() as any);

    const result = await service.commit(context, actor.id, {
      schemaVersion: "2.0",
      studentId: student.id,
      scope: "exams",
      publishImported: true,
      exams: [
        {
          title: "آزمون ریاضی",
          subject: "ریاضی",
          durationMinutes: 45,
          maxAttempts: 1,
          questions: [
            { text: "۲+۲؟", options: ["۱", "۲", "۳", "۴"], correctAnswer: "۴" },
          ],
        },
      ],
    });

    expect(saved.find((item) => item.entity === Exam)?.value).toEqual(
      expect.objectContaining({ published: true, organization }),
    );
    expect(saved.find((item) => item.entity === ExamAssignment)?.value).toEqual(
      expect.objectContaining({
        student,
        assignedBy: actor,
        exam: expect.objectContaining({ id: "exam-1" }),
      }),
    );
    expect(result).toEqual(
      expect.objectContaining({ exams: 1, published: true }),
    );
  });

  it("persists rich fields and resolves imported exam references on plan tasks", async () => {
    const actor = { id: "advisor-1" };
    const student = { id: "student-1" };
    const organization = { id: "org-1" };
    const linkedTask = { id: "task-1", examRef: "math-week-1", examId: "math-week-1" };
    const saved: Array<{ entity: unknown; value: any }> = [];
    const manager = {
      find: jest.fn(async (entity: unknown) => entity === Task ? [linkedTask] : []),
      findOneByOrFail: jest.fn(async (entity: unknown) =>
        entity === User ? actor : entity === Student ? student : organization,
      ),
      findOne: jest.fn(async () => null),
      create: jest.fn((_entity: unknown, value: any) => value),
      delete: jest.fn(),
      save: jest.fn(async (entity: unknown, value: any) => {
        if (Array.isArray(value)) {
          saved.push({ entity, value });
          return value;
        }
        const result = {
          id: entity === Exam ? "exam-uuid-1" : entity === ImportHistory ? "history-1" : "saved-1",
          ...value,
        };
        saved.push({ entity, value: result });
        return result;
      }),
    };
    const service = new ImportExportService(
      { manager, transaction: jest.fn(async (work: any) => work(manager)) } as any,
      authorization() as any,
    );

    await service.commit(context, actor.id, {
      schemaVersion: "2",
      student: { id: student.id },
      scope: "all",
      plans: [{
        planDate: "2026-09-20", title: "شروع هفته", persianDate: "۲۹ شهریور", motivationText: "ادامه بده.",
        tasks: [{ type: "class", title: "کلاس ریاضی", examRef: "math-week-1", pages: "۱۲ تا ۲۰", conflict: true, conflictGroup: "morning" }],
      }],
      exams: [{
        ref: "math-week-1", title: "آزمون ریاضی", durationMinutes: 30, maxAttempts: 1,
        instructions: "زمان را مدیریت کن.",
        syllabus: [{ subject: "ریاضی", description: "فصل اول", required: true, track: "دوازدهم" }],
        questions: [{ question: "۲ + ۲؟", options: ["۱", "۲", "۳", "۴"], correctOption: "d", sortOrder: 3 }],
      }],
    });

    expect(saved.find((item) => item.entity === Plan)?.value).toEqual(
      expect.objectContaining({ title: "شروع هفته", persianDate: "۲۹ شهریور", motivationText: "ادامه بده." }),
    );
    expect(saved.find((item) => item.entity === Exam)?.value).toEqual(
      expect.objectContaining({ externalRef: "math-week-1", instructions: ["زمان را مدیریت کن."] }),
    );
    expect(saved.find((item) => item.entity === ExamSyllabus)?.value).toEqual(
      [expect.objectContaining({ subject: "ریاضی", required: true })],
    );
    expect(linkedTask.examId).toBe("exam-uuid-1");
    expect(saved.find((item) => item.entity === Task)?.value).toEqual([linkedTask]);
  });

  it("does not replace a plan that already contains completed work", async () => {
    const manager = {
      find: jest.fn(async () => []),
      findOneByOrFail: jest.fn(async (entity: unknown) =>
        entity === User ? { id: "advisor-1" } : { id: "student-1" },
      ),
      findOne: jest.fn(async (entity: unknown) =>
        entity === Plan ? { id: "plan-1", tasks: [{ status: "DONE" }] } : null,
      ),
      findOneBy: jest.fn(),
      create: jest.fn((_entity: unknown, value: any) => value),
      delete: jest.fn(),
      save: jest.fn(),
    };
    const db = {
      manager,
      transaction: jest.fn(async (work: any) => work(manager)),
    } as any;
    const service = new ImportExportService(db, authorization() as any);

    await expect(
      service.commit(context, "advisor-1", {
        schemaVersion: "2.0",
        studentId: "student-1",
        scope: "plans",
        replaceExistingPlans: true,
        plans: [
          { date: "2026-09-20", tasks: [{ type: "STUDY", title: "مطالعه" }] },
        ],
      }),
    ).rejects.toMatchObject({ status: 409 });
    expect(manager.delete).not.toHaveBeenCalled();
  });
});
