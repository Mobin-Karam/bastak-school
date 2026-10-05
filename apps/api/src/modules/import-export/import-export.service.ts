import {
  containsForbiddenFields,
  nonNegativeNumber,
  positiveNumber,
} from "@moshaver/cmb-data-transfer";
import { Injectable } from "@nestjs/common";
import { DataSource, In } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { Exam } from "../../database/entities/exam.entity";
import { ExamAssignment } from "../../database/entities/exam-assignment.entity";
import { ExamSyllabus } from "../../database/entities/exam-syllabus.entity";
import { ImportHistory } from "../../database/entities/import-history.entity";
import { Organization } from "../../database/entities/organization.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Plan } from "../../database/entities/plan.entity";
import { Question } from "../../database/entities/question.entity";
import { Student } from "../../database/entities/student.entity";
import { Task } from "../../database/entities/task.entity";
import { User } from "../../database/entities/user.entity";
import { PlanStatus } from "../../database/entities/plan.entity";
import { TaskType } from "../../database/entities/task.entity";
import { AuthorizationService, UserContext } from "../authorization";
type Payload = {
  schemaVersion?: string;
  organizationId?: string;
  studentId?: string;
  scope?: string;
  publishImported?: unknown;
  replaceExistingPlans?: unknown;
  replaceExistingExams?: unknown;
  skipExistingPlans?: unknown;
  skipExistingExams?: unknown;
  sourceName?: string;
  student?: { id?: string };
  plans?: Array<Record<string, unknown>>;
  exams?: Array<Record<string, unknown>>;
};

function normalizeTaskType(value: unknown) {
  const type = String(value || "STUDY").trim().toUpperCase();
  const aliases: Record<string, TaskType> = {
    CLASS: TaskType.CLASS,
    PRAYER: TaskType.PRAYER,
    MEAL: TaskType.MEAL,
    BREAK: TaskType.BREAK,
  };
  return aliases[type] || type;
}

function normalizeCorrectAnswer(question: Record<string, unknown>, options: string[]) {
  const raw = String(question.correctAnswer ?? question.correctOption ?? "").trim();
  const index = ["a", "b", "c", "d"].indexOf(raw.toLowerCase());
  return index >= 0 ? options[index] || "" : raw;
}
@Injectable()
export class ImportExportService {
  constructor(
    private db: DataSource,
    private authorization: AuthorizationService,
  ) {}
  template() {
    return {
      schemaVersion: "2.0",
      organizationId: null,
      studentId: null,
      plans: [
        {
          date: "2026-09-05",
          published: false,
          tasks: [
            {
              type: "STUDY",
              title: "مطالعه",
              subject: "ریاضی",
              startTime: "08:00",
              endTime: "09:00",
              duration: 60,
            },
          ],
        },
      ],
      exams: [
        {
          title: "آزمون",
          subject: "ریاضی",
          durationMinutes: 60,
          maxAttempts: 1,
          questions: [
            {
              text: "...",
              options: ["A", "B", "C", "D"],
              correctAnswer: "A",
              explanation: "",
            },
          ],
        },
      ],
    };
  }
  async preview(context: UserContext, payload: Payload) {
    this.authorization.requireCapability(context, "import.preview");
    const result = await this.validate(context, payload);
    return {
      valid: !result.errors.length,
      errors: result.errors,
      warnings: result.warnings,
      conflicts: result.conflicts,
      summary: { ...result.counts, conflicts: result.conflicts.length },
      schemaVersion: result.schemaVersion,
      normalized: result.normalized,
    };
  }
  async commit(context: UserContext, actorId: string, payload: Payload) {
    this.authorization.requireCapability(context, "import.commit");
    const checked = await this.validate(context, payload);
    if (checked.errors.length)
      throw new ApiException(
        400,
        "IMPORT_INVALID",
        "فایل واردسازی معتبر نیست.",
        checked.errors,
      );
    const actor = await this.db.manager.findOneByOrFail(User, { id: actorId });
    try {
      return await this.db.transaction(async (manager) => {
        const student = checked.normalized.studentId
          ? await manager.findOneByOrFail(Student, {
              id: checked.normalized.studentId,
            })
          : null;
        let importedPlans = 0;
        let importedExams = 0;
        let skippedPlans = 0;
        let skippedExams = 0;
        const importedExamIds = new Map<string, string>();
        for (const p of checked.normalized.plans) {
          let plan = student
            ? await manager.findOne(Plan, {
                where: { student: { id: student.id }, date: p.date },
                relations: { tasks: true },
              })
            : null;
          if (!student)
            throw new ApiException(
              400,
              "STUDENT_REQUIRED",
              "دانش‌آموز برای برنامه لازم است.",
            );
          if (plan) {
            if (checked.normalized.skipExistingPlans) {
              skippedPlans += 1;
              continue;
            }
            if (!checked.normalized.replaceExistingPlans)
              throw new ApiException(
                409,
                "PLAN_CONFLICT",
                `برنامه ${p.date} از قبل وجود دارد.`,
              );
            if (
              plan.tasks.some(
                (task) => Boolean(task.completedAt) || task.status === "DONE",
              )
            )
              throw new ApiException(
                409,
                "PLAN_HAS_PROGRESS",
                `برنامه ${p.date} سابقه انجام‌شده دارد و جایگزین نمی‌شود.`,
              );
            await manager.delete(Task, { plan: { id: plan.id } });
          } else plan = manager.create(Plan, { student, date: p.date });
          plan.status =
            checked.normalized.publishImported || p.published
              ? PlanStatus.PUBLISHED
              : PlanStatus.DRAFT;
          Object.assign(plan, {
            title: p.title,
            dayLabel: p.dayLabel,
            persianDate: p.persianDate,
            jalaliId: p.jalaliId,
            motivationText: p.motivationText,
          });
          plan.tasks = p.tasks.map((t) =>
            manager.create(Task, { ...t, type: t.type as TaskType }),
          );
          await manager.save(Plan, plan);
          importedPlans += 1;
        }
        const organization = checked.normalized.organizationId
          ? await manager.findOneByOrFail(Organization, {
              id: checked.normalized.organizationId,
            })
          : null;
        for (const e of checked.normalized.exams) {
          const existing = await manager.findOne(Exam, {
            where: {
              title: e.title,
              ...(organization
                ? { organization: { id: organization.id } }
                : {}),
            },
            relations: { attempts: true },
          });
          if (existing) {
            if (checked.normalized.skipExistingExams) {
              skippedExams += 1;
              continue;
            }
            if (!checked.normalized.replaceExistingExams)
              throw new ApiException(
                409,
                "EXAM_CONFLICT",
                `آزمون ${e.title} از قبل وجود دارد.`,
              );
            if (existing.attempts?.length)
              throw new ApiException(
                409,
                "EXAM_HAS_ATTEMPTS",
                `آزمون ${e.title} سابقه شرکت دارد و جایگزین نمی‌شود.`,
              );
            await manager.delete(Exam, { id: existing.id });
          }
          const exam = manager.create(Exam, {
            title: e.title,
            subject: e.subject,
            duration: e.durationMinutes,
            attemptLimit: e.maxAttempts,
            externalRef: e.externalRef,
            instructions: e.instructions,
            startTime: e.openAt ? new Date(e.openAt) : null,
            endTime: e.closeAt ? new Date(e.closeAt) : null,
            published: checked.normalized.publishImported || e.published,
            organization,
            createdBy: actor,
            questions: e.questions.map((q) => manager.create(Question, q)),
          });
          const savedExam = await manager.save(Exam, exam);
          if (e.externalRef) importedExamIds.set(e.externalRef, savedExam.id);
          if (e.syllabus.length)
            await manager.save(
              ExamSyllabus,
              e.syllabus.map((item) =>
                manager.create(ExamSyllabus, { ...item, exam: savedExam }),
              ),
            );
          if (student)
            await manager.save(
              ExamAssignment,
              manager.create(ExamAssignment, {
                exam: savedExam,
                student,
                assignedBy: actor,
              }),
            );
          importedExams += 1;
        }
        if (student && importedExamIds.size) {
          const linkedTasks = await manager.find(Task, {
            where: {
              plan: { student: { id: student.id } },
              examRef: In([...importedExamIds.keys()]),
            },
          });
          for (const task of linkedTasks)
            task.examId = importedExamIds.get(task.examRef) || task.examId;
          if (linkedTasks.length) await manager.save(Task, linkedTasks);
        }
        const history = await manager.save(
          ImportHistory,
          manager.create(ImportHistory, {
            actor,
            organization,
            schemaVersion: checked.schemaVersion,
            counts: checked.counts,
            result: "SUCCESS",
            errors: null,
          }),
        );
        return {
          historyId: history.id,
          importId: history.id,
          plans: importedPlans,
          tasks: checked.counts.tasks,
          exams: importedExams,
          questions: checked.counts.questions,
          skippedPlans,
          skippedExams,
          published: checked.normalized.publishImported,
          imported: {
            ...checked.counts,
            plans: importedPlans,
            exams: importedExams,
          },
        };
      });
    } catch (error) {
      await this.db.manager.save(
        ImportHistory,
        this.db.manager.create(ImportHistory, {
          actor,
          organization: checked.normalized.organizationId
            ? await this.db.manager.findOneBy(Organization, {
                id: checked.normalized.organizationId,
              })
            : null,
          schemaVersion: checked.schemaVersion,
          counts: checked.counts,
          result: "FAILED",
          errors: [error instanceof Error ? error.message : "Import failed"],
        }),
      );
      throw error;
    }
  }
  async export(
    context: UserContext,
    studentId?: string,
    organizationId?: string,
    scope = "all",
    from?: string,
    to?: string,
  ) {
    this.authorization.requireCapability(context, "export.read");
    if (!["all", "plans", "exams"].includes(scope))
      throw new ApiException(400, "SCOPE_INVALID", "محدوده خروجی معتبر نیست.");
    let students: Student[] = [];
    if (studentId) {
      if (
        !(await this.authorization.canAccessStudent(
          context,
          studentId,
          "export.read",
        ))
      )
        throw new ApiException(403, "STUDENT_FORBIDDEN", "دسترسی ندارید.");
      students = [
        await this.db.manager.findOneByOrFail(Student, { id: studentId }),
      ];
    } else if (organizationId) {
      if (
        !this.authorization.canAccessOrganization(
          context,
          organizationId,
          "export.read",
        )
      )
        throw new ApiException(403, "ORGANIZATION_FORBIDDEN", "دسترسی ندارید.");
      const members = await this.db.manager.find(OrganizationMembership, {
        where: { organization: { id: organizationId } },
        relations: { user: { student: true } },
      });
      students = members.flatMap((m) =>
        m.user.student ? [m.user.student] : [],
      );
    } else if (context.roles.includes("PLATFORM_ADMIN"))
      students = await this.db.manager.find(Student);
    else
      throw new ApiException(400, "SCOPE_REQUIRED", "محدوده خروجی لازم است.");
    const ids = students.map((s) => s.id);
    const plans =
      scope !== "exams" && ids.length
        ? await this.db.manager.find(Plan, {
            where: {
              student: { id: In(ids) },
              ...(from && to
                ? { date: In(await this.dateRange(from, to)) }
                : {}),
            },
            relations: { student: true, tasks: true },
          })
        : [];
    const assignedExamIds = studentId
      ? (
          await this.db.manager.find(ExamAssignment, {
            where: { student: { id: studentId } },
            relations: { exam: true },
          })
        ).map((item) => item.exam.id)
      : [];
    const exams =
      scope !== "plans" && (organizationId || assignedExamIds.length)
        ? await this.db.manager.find(Exam, {
            where: organizationId
              ? { organization: { id: organizationId } }
              : { id: In(assignedExamIds) },
            relations: { questions: true, syllabus: true },
          })
        : [];
    return {
      schemaVersion: "2.0",
      exportedAt: new Date().toISOString(),
      organizationId: organizationId || null,
      students: students.map((s) => ({
        id: s.id,
        name: s.name,
        grade: s.grade,
        major: s.major,
      })),
      plans: plans.map((p) => ({
        studentId: p.student.id,
        date: p.date,
        published: p.status === PlanStatus.PUBLISHED,
        title: p.title,
        dayLabel: p.dayLabel,
        persianDate: p.persianDate,
        jalaliId: p.jalaliId,
        motivationText: p.motivationText,
        tasks: p.tasks.map((t) => ({
          type: t.type,
          title: t.title,
          subject: t.subject,
          startTime: t.startTime,
          endTime: t.endTime,
          duration: t.duration,
          testCount: t.testCount,
          note: t.note,
          priority: t.priority,
          pages: t.pages,
          examRef: t.examRef,
          examId: t.examId,
          conflict: t.conflict,
          conflictGroup: t.conflictGroup,
        })),
      })),
      exams: exams.map((e) => ({
        title: e.title,
        subject: e.subject,
        ref: e.externalRef,
        durationMinutes: e.duration,
        maxAttempts: e.attemptLimit,
        openAt: e.startTime,
        closeAt: e.endTime,
        published: e.published,
        instructions: e.instructions,
        syllabus: e.syllabus.map((item) => ({
          subject: item.subject,
          description: item.description,
          required: item.required,
          track: item.track,
        })),
        questions: e.questions.map((q) => ({
          text: q.text,
          options: q.options,
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          subject: q.subject,
          topic: q.topic,
          book: q.book,
          grade: q.grade,
          chapter: q.chapter,
          lesson: q.lesson,
          subtopic: q.subtopic,
          questionType: q.questionType,
          weight: q.weight,
          sectionId: q.sectionId,
          mediaUrl: q.mediaUrl,
          difficulty: q.difficulty,
          source: q.source,
          sortOrder: q.sortOrder,
          tags: q.tags,
        })),
      })),
    };
  }
  async history(context: UserContext) {
    this.authorization.requireCapability(context, "import.preview");
    const where = context.roles.includes("PLATFORM_ADMIN")
      ? {}
      : { actor: { id: context.id } };
    return this.db.manager
      .find(ImportHistory, {
        where,
        relations: { actor: true, organization: true },
        order: { createdAt: "DESC" },
        take: 100,
      })
      .then((rows) =>
        rows.map((r) => ({
          id: r.id,
          actorUserId: r.actor.id,
          organizationId: r.organization?.id || null,
          schemaVersion: r.schemaVersion,
          counts: r.counts,
          timestamp: r.createdAt,
          result: r.result,
          errors: r.errors || [],
        })),
      );
  }
  private async validate(context: UserContext, payload: Payload) {
    const errors: string[] = [],
      warnings: string[] = [],
      conflicts: string[] = [];
    const schemaVersion = String(payload.schemaVersion || "") === "2" ? "2.0" : String(payload.schemaVersion || "");
    if (schemaVersion !== "2.0") errors.push("schemaVersion must be 2.0");
    const scope = String(payload.scope || "all");
    if (!["all", "plans", "exams"].includes(scope))
      errors.push("scope must be all, plans, or exams");
    if (containsForbiddenFields(payload))
      errors.push(
        "Identity, role, permission, and authentication fields are forbidden.",
      );
    if (
      payload.organizationId &&
      !this.authorization.canAccessOrganization(
        context,
        payload.organizationId,
        "import.preview",
      )
    )
      errors.push("Organization is outside the authorized scope.");
    const selectedStudentId = payload.studentId || payload.student?.id;
    if (
      selectedStudentId &&
      !(await this.authorization.canAccessStudent(
        context,
        selectedStudentId,
        "import.preview",
      ))
    )
      errors.push("Student is outside the authorized scope.");
    const plans = (payload.plans || []).map((p, i) => {
      const date = String(p.date || p.planDate || "");
      if (!this.validDate(date)) errors.push(`plans[${i}].date is invalid`);
      const tasks = Array.isArray(p.tasks)
        ? p.tasks.map((raw, j) => {
            const t = raw as Record<string, unknown>,
              type = normalizeTaskType(t.type);
            if (!Object.values(TaskType).includes(type as TaskType))
              errors.push(`plans[${i}].tasks[${j}].type is invalid`);
            const title = String(t.title || "").trim();
            if (!title)
              errors.push(`plans[${i}].tasks[${j}].title is required`);
            const startTime = String(t.startTime || t.start || "");
            const endTime = String(t.endTime || t.end || "");
            if (startTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(startTime))
              errors.push(`plans[${i}].tasks[${j}].startTime is invalid`);
            if (endTime && !/^([01]\d|2[0-3]):[0-5]\d$/.test(endTime))
              errors.push(`plans[${i}].tasks[${j}].endTime is invalid`);
            return {
              type,
              title: title.slice(0, 220),
              subject: String(t.subject || ""),
              description: String(t.description || ""),
              startTime,
              endTime,
              duration: nonNegativeNumber(t.duration),
              testCount: nonNegativeNumber(t.testCount),
              note: String(t.note || ""),
              priority: Number(t.priority ?? j),
              pages: String(t.pages || ""),
              examRef: String(t.examRef || t.examId || ""),
              examId: String(t.examId || ""),
              conflict: t.conflict === true,
              conflictGroup: String(t.conflictGroup || ""),
            };
          })
        : [];
      return {
        date,
        published: !!(p.published || p.publish),
        title: String(p.title || "برنامه روزانه"),
        dayLabel: String(p.dayLabel || ""),
        persianDate: String(p.persianDate || ""),
        jalaliId: String(p.jalaliId || ""),
        motivationText: String(p.motivationText || ""),
        tasks,
      };
    });
    const exams = (payload.exams || []).map((e, i) => {
      const questions = Array.isArray(e.questions)
        ? e.questions.map((raw, j) => {
            const q = raw as Record<string, unknown>,
              options = Array.isArray(q.options) ? q.options.map(String) : [];
            if (
              options.length !== 4 ||
              options.some((option) => !option.trim()) ||
              new Set(options).size !== 4 ||
              !String(q.text || q.question || "").trim() ||
              !options.includes(normalizeCorrectAnswer(q, options))
            )
              errors.push(`exams[${i}].questions[${j}] is invalid`);
            return {
              text: String(q.text || q.question || ""),
              options,
              correctAnswer: normalizeCorrectAnswer(q, options),
              explanation: String(q.explanation || ""),
              sortOrder: Number(q.sortOrder ?? j),
              subject: String(q.subject || ""),
              topic: String(q.topic || ""),
              book: String(q.book || ""),
              grade: String(q.grade || ""),
              chapter: String(q.chapter || ""),
              lesson: String(q.lesson || ""),
              subtopic: String(q.subtopic || ""),
              questionType: String(q.questionType || "multiple_choice"),
              weight: positiveNumber(Number(q.weight ?? 1)),
              sectionId: String(q.sectionId || ""),
              mediaUrl: String(q.mediaUrl || ""),
              difficulty: String(q.difficulty || "medium"),
              source: String(q.source || ""),
              tags: Array.isArray(q.tags) ? q.tags.map(String) : [],
            };
          })
        : [];
      const title = String(e.title || "");
      if (!title) errors.push(`exams[${i}].title is required`);
      const durationMinutes = Number(e.durationMinutes || e.duration);
      const maxAttempts = Number(e.maxAttempts);
      if (
        !Number.isInteger(durationMinutes) ||
        durationMinutes < 1 ||
        durationMinutes > 600
      )
        errors.push(`exams[${i}].durationMinutes is invalid`);
      if (!Number.isInteger(maxAttempts) || maxAttempts < 1 || maxAttempts > 20)
        errors.push(`exams[${i}].maxAttempts is invalid`);
      const openAt = e.openAt ? String(e.openAt) : null;
      const closeAt = e.closeAt ? String(e.closeAt) : null;
      if (openAt && Number.isNaN(Date.parse(openAt)))
        errors.push(`exams[${i}].openAt is invalid`);
      if (closeAt && Number.isNaN(Date.parse(closeAt)))
        errors.push(`exams[${i}].closeAt is invalid`);
      if (openAt && closeAt && Date.parse(closeAt) <= Date.parse(openAt))
        errors.push(`exams[${i}].closeAt must be after openAt`);
      return {
        title,
        subject: String(e.subject || ""),
        durationMinutes: positiveNumber(durationMinutes),
        maxAttempts: positiveNumber(maxAttempts),
        openAt,
        closeAt,
        questions,
        externalRef: String(e.ref || e.externalRef || ""),
        instructions: Array.isArray(e.instructions)
          ? e.instructions.map(String)
          : e.instructions
            ? [String(e.instructions)]
            : [],
        syllabus: Array.isArray(e.syllabus)
          ? e.syllabus.map((item) => {
              const row = item as Record<string, unknown>;
              return {
                subject: String(row.subject || ""),
                description: String(row.description || ""),
                required: row.required === true,
                track: String(row.track || ""),
              };
            }).filter((item) => item.subject)
          : [],
        published: e.published === true,
      };
    });
    const scopedPlans = scope === "exams" ? [] : plans;
    const scopedExams = scope === "plans" ? [] : exams;
    if (!scopedPlans.length && !scopedExams.length)
      warnings.push("No plans or exams found.");
    if (scopedPlans.length && !selectedStudentId)
      errors.push("studentId is required when importing plans");
    if (
      plans.length > 366 ||
      plans.reduce((sum, plan) => sum + plan.tasks.length, 0) > 5000
    )
      errors.push("Plan import exceeds the supported size.");
    if (
      exams.length > 100 ||
      exams.reduce((sum, exam) => sum + exam.questions.length, 0) > 10000
    )
      errors.push("Exam import exceeds the supported size.");
    if (selectedStudentId && scopedPlans.length) {
      const existing = await this.db.manager.find(Plan, {
        where: {
          student: { id: selectedStudentId },
          date: In(scopedPlans.map((plan) => plan.date)),
        },
      });
      conflicts.push(
        ...existing.map((plan) => `برنامه ${plan.date} از قبل وجود دارد.`),
      );
    }
    const organizationId =
      payload.organizationId ||
      (context.organizationIds.length === 1
        ? context.organizationIds[0]
        : null);
    if (scopedExams.length) {
      const existing = await this.db.manager.find(Exam, {
        where: {
          title: In(scopedExams.map((exam) => exam.title)),
          ...(organizationId ? { organization: { id: organizationId } } : {}),
        },
      });
      conflicts.push(
        ...existing.map((exam) => `آزمون ${exam.title} از قبل وجود دارد.`),
      );
    }
    return {
      errors,
      warnings,
      conflicts,
      schemaVersion,
      counts: {
        students: selectedStudentId ? 1 : 0,
        plans: scopedPlans.length,
        tasks: scopedPlans.reduce((n, p) => n + p.tasks.length, 0),
        exams: scopedExams.length,
        questions: scopedExams.reduce((n, e) => n + e.questions.length, 0),
      },
      normalized: {
        schemaVersion,
        organizationId,
        studentId: selectedStudentId || null,
        plans: scopedPlans,
        exams: scopedExams,
        publishImported: payload.publishImported === true,
        replaceExistingPlans: payload.replaceExistingPlans === true,
        replaceExistingExams: payload.replaceExistingExams === true,
        skipExistingPlans: payload.skipExistingPlans === true,
        skipExistingExams: payload.skipExistingExams === true,
      },
    };
  }

  private validDate(value: string) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    return (
      new Date(`${value}T00:00:00.000Z`).toISOString().slice(0, 10) === value
    );
  }

  private async dateRange(from: string, to: string) {
    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(from) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(to) ||
      from > to
    )
      throw new ApiException(
        400,
        "DATE_RANGE_INVALID",
        "بازه تاریخ خروجی معتبر نیست.",
      );
    const values: string[] = [];
    const cursor = new Date(`${from}T00:00:00.000Z`);
    const end = new Date(`${to}T00:00:00.000Z`);
    if ((end.getTime() - cursor.getTime()) / 86_400_000 > 366)
      throw new ApiException(
        400,
        "DATE_RANGE_TOO_LARGE",
        "بازه خروجی حداکثر ۳۶۶ روز است.",
      );
    while (cursor <= end) {
      values.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
    return values;
  }
}
