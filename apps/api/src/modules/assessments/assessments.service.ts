import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { DataSource, In, IsNull, Not, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { Exam } from "../../database/entities/exam.entity";
import { ExamAssignment } from "../../database/entities/exam-assignment.entity";
import { ExamClassAssignment } from "../../database/entities/exam-class-assignment.entity";
import { ExamAttempt } from "../../database/entities/exam-attempt.entity";
import { ExamRetryRequest } from "../../database/entities/exam-retry-request.entity";
import { ExamSyllabus } from "../../database/entities/exam-syllabus.entity";
import { Mistake } from "../../database/entities/mistake.entity";
import { Organization } from "../../database/entities/organization.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Quiz } from "../../database/entities/quiz.entity";
import { QuizAttempt } from "../../database/entities/quiz-attempt.entity";
import { QuizAssignment } from "../../database/entities/quiz-assignment.entity";
import { QuizClassAssignment } from "../../database/entities/quiz-class-assignment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { QuizQuestion } from "../../database/entities/quiz-question.entity";
import { Student } from "../../database/entities/student.entity";
import { SyllabusProgress } from "../../database/entities/syllabus-progress.entity";
import { User } from "../../database/entities/user.entity";
import { MembershipStatus } from "../../database/entities/organization-membership.entity";
import { RetryRequestStatus } from "../../database/entities/exam-retry-request.entity";
import { AuthorizationService, UserContext } from "../authorization";
import {
  CreateQuizDto,
  ModerateRetryDto,
  QuizAudienceRulesDto,
  QuizQuestionDto,
  SubmitQuizDto,
  SyllabusDto,
  SyllabusProgressDto,
  UpdateQuizDto,
} from "./dto/assessment.dto";

@Injectable()
export class AssessmentsService {
  constructor(
    @InjectRepository(Exam) private exams: Repository<Exam>,
    @InjectRepository(ExamAssignment)
    private assignments: Repository<ExamAssignment>,
    @InjectRepository(ExamSyllabus) private syllabus: Repository<ExamSyllabus>,
    @InjectRepository(SyllabusProgress)
    private progress: Repository<SyllabusProgress>,
    @InjectRepository(ExamRetryRequest)
    private retries: Repository<ExamRetryRequest>,
    @InjectRepository(Quiz) private quizzes: Repository<Quiz>,
    @InjectRepository(QuizQuestion) private questions: Repository<QuizQuestion>,
    @InjectRepository(QuizAttempt) private attempts: Repository<QuizAttempt>,
    @InjectRepository(QuizAssignment)
    private quizAssignments: Repository<QuizAssignment>,
    @InjectRepository(QuizClassAssignment)
    private quizClassAssignments: Repository<QuizClassAssignment>,
    @InjectRepository(EducationClass)
    private classes: Repository<EducationClass>,
    @InjectRepository(EducationClassEnrollment)
    private classEnrollments: Repository<EducationClassEnrollment>,
    @InjectRepository(Student) private students: Repository<Student>,
    @InjectRepository(ExamAttempt)
    private examAttempts: Repository<ExamAttempt>,
    private authz: AuthorizationService,
    private db: DataSource,
    @InjectRepository(ExamClassAssignment)
    private examClassAssignments?: Repository<ExamClassAssignment>,
  ) {}
  private student(userId: string) {
    return this.students.findOneOrFail({
      where: { user: { id: userId } },
      relations: { user: true },
    });
  }
  async addSyllabus(context: UserContext, examId: string, dto: SyllabusDto) {
    const exam = await this.requireExam(context, examId, "syllabus.manage");
    return this.syllabus.save(
      this.syllabus.create({
        ...dto,
        description: dto.description || "",
        required: !!dto.required,
        track: dto.track || "",
        exam,
      }),
    );
  }
  async removeSyllabus(context: UserContext, id: string) {
    const row = await this.syllabus.findOne({
      where: { id },
      relations: { exam: { organization: true } },
    });
    if (!row)
      throw new ApiException(
        404,
        "SYLLABUS_NOT_FOUND",
        "بودجه آزمون پیدا نشد.",
      );
    this.requireOrganization(
      context,
      row.exam.organization?.id,
      "syllabus.manage",
    );
    await this.syllabus.delete(id);
    return { id, deleted: true };
  }
  async updateProgress(userId: string, id: string, dto: SyllabusProgressDto) {
    const student = await this.student(userId);
    const row = await this.syllabus.findOne({
      where: { id },
      relations: { exam: true },
    });
    if (
      !row ||
      !(await this.assignments.findOne({
        where: { exam: { id: row.exam.id }, student: { id: student.id } },
      }))
    )
      throw new ApiException(
        404,
        "SYLLABUS_NOT_FOUND",
        "بودجه آزمون پیدا نشد.",
      );
    let value = await this.progress.findOne({
      where: { student: { id: student.id }, syllabus: { id } },
    });
    value ||= this.progress.create({ student, syllabus: row });
    Object.assign(value, {
      status: dto.status,
      accuracy: dto.accuracy ?? 0,
      note: dto.note || "",
    });
    return this.progress.save(value);
  }
  async studentSyllabus(userId: string, examId: string) {
    const student = await this.student(userId);
    if (
      !(await this.assignments.findOne({
        where: { exam: { id: examId }, student: { id: student.id } },
      }))
    )
      throw new ApiException(404, "EXAM_NOT_ASSIGNED", "آزمون در دسترس نیست.");
    const [rows, values] = await Promise.all([
      this.syllabus.find({
        where: { exam: { id: examId } },
        order: { subject: "ASC" },
      }),
      this.progress.find({
        where: { student: { id: student.id } },
        relations: { syllabus: true },
      }),
    ]);
    const bySyllabus = new Map(
      values.map((value) => [value.syllabus.id, value]),
    );
    return rows.map((row) => {
      const value = bySyllabus.get(row.id);
      return {
        id: row.id,
        subject: row.subject,
        description: row.description,
        required: row.required,
        track: row.track,
        progress: value
          ? {
              status: value.status,
              accuracy: value.accuracy,
              note: value.note,
              updatedAt: value.updatedAt,
            }
          : null,
      };
    });
  }
  async requestRetry(userId: string, examId: string, message = "") {
    const student = await this.student(userId);
    const exam = await this.exams.findOneByOrFail({ id: examId });
    if (
      !(await this.assignments.findOne({
        where: { exam: { id: examId }, student: { id: student.id } },
      }))
    )
      throw new ApiException(404, "EXAM_NOT_ASSIGNED", "آزمون در دسترس نیست.");
    const pending = await this.retries.findOne({
      where: {
        exam: { id: examId },
        student: { id: student.id },
        status: RetryRequestStatus.PENDING,
      },
    });
    if (pending) return pending;
    const [used, approved] = await Promise.all([
      this.examAttempts.count({
        where: { exam: { id: examId }, student: { id: student.id } },
      }),
      this.retries.count({
        where: {
          exam: { id: examId },
          student: { id: student.id },
          status: RetryRequestStatus.APPROVED,
        },
      }),
    ]);
    if (used < exam.attemptLimit + approved)
      throw new ApiException(
        409,
        "ATTEMPTS_AVAILABLE",
        "هنوز امکان شروع آزمون را دارید و نیازی به درخواست تلاش مجدد نیست.",
      );
    return this.retries.save(this.retries.create({ exam, student, message }));
  }
  async studentRetries(userId: string) {
    const student = await this.student(userId);
    return this.retries
      .find({
        where: { student: { id: student.id } },
        relations: { exam: true },
        order: { createdAt: "DESC" },
        take: 50,
      })
      .then((rows) =>
        rows.map((row) => ({
          id: row.id,
          examId: row.exam.id,
          examTitle: row.exam.title,
          message: row.message,
          status: row.status,
          moderatorNote: row.moderatorNote,
          resolvedAt: row.resolvedAt,
          createdAt: row.createdAt,
        })),
      );
  }
  async listRetries(context: UserContext) {
    const rows = await this.retries.find({
      relations: { exam: true, student: true },
      order: { createdAt: "DESC" },
    });
    const out = [];
    for (const row of rows)
      if (
        await this.authz.canAccessStudent(
          context,
          row.student.id,
          "retry_requests.read",
        )
      )
        out.push(row);
    return out;
  }
  async moderateRetry(
    context: UserContext,
    userId: string,
    id: string,
    dto: ModerateRetryDto,
  ) {
    if (dto.status === RetryRequestStatus.PENDING)
      throw new ApiException(400, "INVALID_STATUS", "وضعیت نهایی لازم است.");
    const row = await this.retries.findOne({
      where: { id },
      relations: { exam: true, student: true },
    });
    if (!row)
      throw new ApiException(404, "RETRY_NOT_FOUND", "درخواست پیدا نشد.");
    if (
      !(await this.authz.canAccessStudent(
        context,
        row.student.id,
        "retry_requests.moderate",
      ))
    )
      throw new ApiException(
        403,
        "STUDENT_FORBIDDEN",
        "به این دانش‌آموز دسترسی ندارید.",
      );
    if (row.status !== RetryRequestStatus.PENDING)
      throw new ApiException(
        409,
        "RETRY_RESOLVED",
        "درخواست قبلا بررسی شده است.",
      );
    row.status = dto.status;
    row.moderatorNote = dto.note || "";
    row.resolvedAt = new Date();
    row.resolvedBy = await this.db.manager.findOneByOrFail(User, {
      id: userId,
    });
    return this.db.transaction(async (m) => m.save(ExamRetryRequest, row));
  }
  async listQuizzes(context: UserContext) {
    return this.quizzes.find({
      where: context.roles.includes("PLATFORM_ADMIN")
        ? {}
        : { organization: { id: In(context.organizationIds) } },
      relations: { questions: true, exam: true, organization: true },
      order: { createdAt: "DESC" },
    });
  }
  async studentQuizzes(userId: string) {
    const student = await this.student(userId);
    const rows = await this.quizzes.find({
      where: { active: true },
      relations: { questions: true, exam: true, organization: true },
      order: { createdAt: "DESC" },
    });
    const visible = [];
    for (const quiz of rows)
      if (
        (await this.canStudentAccessQuiz(student, quiz)) &&
        this.quizIsOpen(quiz)
      ) {
        const latest = await this.attempts.findOne({
          where: { quiz: { id: quiz.id }, student: { id: student.id } },
          order: { startedAt: "DESC" },
        });
        const submittedAttempts = await this.attempts.count({
          where: {
            quiz: { id: quiz.id },
            student: { id: student.id },
            submittedAt: Not(IsNull()),
          },
        });
        visible.push({
          id: quiz.id,
          title: quiz.title,
          subject: quiz.subject,
          durationMinutes: quiz.durationMinutes,
          questionCount: quiz.questions.length,
          examId: quiz.exam?.id ?? null,
          attemptLimit: quiz.attemptLimit,
          attemptsUsed: submittedAttempts,
          openAt: quiz.openAt,
          closeAt: quiz.closeAt,
          resultPolicy: quiz.resultPolicy,
          attempt: latest
            ? {
                id: latest.id,
                submittedAt: latest.submittedAt,
                percent: latest.percent,
              }
            : null,
        });
      }
    return visible;
  }
  async createQuiz(context: UserContext, dto: CreateQuizDto) {
    const organizationId =
      dto.organizationId ??
      (context.organizationIds.length === 1
        ? context.organizationIds[0]
        : undefined);
    this.requireOrganization(context, organizationId, "quizzes.create");
    const [exam, organization] = await Promise.all([
      dto.examId
        ? this.requireExam(context, dto.examId, "quizzes.create")
        : null,
      organizationId
        ? this.db.manager.findOneByOrFail(Organization, { id: organizationId })
        : null,
    ]);
    const delivery = this.deliveryFields(dto);
    return this.quizzes.save(
      this.quizzes.create({
        ...dto,
        ...delivery,
        subject: dto.subject || "",
        durationMinutes: dto.durationMinutes || 20,
        active: dto.active ?? true,
        attemptLimit: dto.attemptLimit ?? 1,
        resultPolicy: dto.resultPolicy ?? "immediate",
        exam,
        organization,
      }),
    );
  }
  async updateQuiz(context: UserContext, id: string, dto: UpdateQuizDto) {
    const quiz = await this.requireQuiz(context, id, "quizzes.update");
    Object.assign(quiz, { ...dto, ...this.deliveryFields(dto) });
    this.assertDeliveryWindow(quiz);
    return this.quizzes.save(quiz);
  }
  async listQuizAssignments(context: UserContext, id: string) {
    await this.requireQuiz(context, id, "quizzes.read");
    return this.quizAssignments
      .find({
        where: { quiz: { id } },
        relations: { student: true },
        order: { createdAt: "DESC" },
      })
      .then((rows) =>
        rows.map((row) => ({
          id: row.id,
          studentId: row.student.id,
          name: row.student.name,
          grade: row.student.grade,
          gradeId: row.student.gradeId,
          educationTypeId: row.student.educationTypeId,
          trackId: row.student.trackId,
        })),
      );
  }
  async assignQuiz(context: UserContext, id: string, studentIds: string[]) {
    const quiz = await this.requireQuiz(context, id, "quizzes.update");
    const unique = [...new Set(studentIds)];
    const students = unique.length
      ? await this.students.find({ where: { id: In(unique) } })
      : [];
    if (
      students.length !== unique.length ||
      !(
        await Promise.all(
          students.map((student) =>
            this.authz.canAccessStudent(context, student.id, "quizzes.update"),
          ),
        )
      ).every(Boolean)
    )
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "دانش‌آموز انتخاب‌شده در دسترس نیست.",
      );
    await this.db.transaction(async (manager) => {
      await manager.delete(QuizAssignment, { quiz: { id: quiz.id } });
      if (students.length)
        await manager.save(
          QuizAssignment,
          students.map((student) =>
            manager.create(QuizAssignment, { quiz, student }),
          ),
        );
    });
    return this.listQuizAssignments(context, id);
  }
  async listQuizClassAssignments(context: UserContext, id: string) {
    await this.requireQuiz(context, id, "quizzes.read");
    return this.quizClassAssignments
      .find({
        where: { quiz: { id } },
        relations: { classroom: { organization: true, enrollments: true } },
        order: { createdAt: "DESC" },
      })
      .then((rows) =>
        rows.map((row) => ({
          id: row.id,
          classId: row.classroom.id,
          name: row.classroom.name,
          code: row.classroom.code,
          schoolYear: row.classroom.schoolYear,
          enrollmentCount: row.classroom.enrollments.length,
        })),
      );
  }
  async assignQuizClasses(
    context: UserContext,
    id: string,
    classIds: string[],
  ) {
    const quiz = await this.requireQuiz(context, id, "quizzes.update");
    const organizationId = quiz.organization?.id ?? quiz.exam?.organization?.id;
    const unique = [...new Set(classIds)];
    const classes = unique.length
      ? await this.classes.find({
          where: { id: In(unique) },
          relations: { organization: true },
        })
      : [];
    if (
      classes.length !== unique.length ||
      classes.some(
        (classroom) =>
          classroom.status !== "ACTIVE" ||
          classroom.organization.id !== organizationId,
      )
    )
      throw new ApiException(
        404,
        "CLASS_NOT_FOUND",
        "کلاس انتخاب‌شده در دسترس نیست.",
      );
    await this.db.transaction(async (manager) => {
      await manager.delete(QuizClassAssignment, { quiz: { id: quiz.id } });
      if (classes.length)
        await manager.save(
          QuizClassAssignment,
          classes.map((classroom) =>
            manager.create(QuizClassAssignment, { quiz, classroom }),
          ),
        );
    });
    return this.listQuizClassAssignments(context, id);
  }
  async setQuizAudienceRules(
    context: UserContext,
    id: string,
    dto: QuizAudienceRulesDto,
  ) {
    const quiz = await this.requireQuiz(context, id, "quizzes.update");
    quiz.audienceRules = {
      gradeIds: [...new Set(dto.gradeIds)].sort((a, b) => a - b),
      educationTypeIds: [
        ...new Set(
          dto.educationTypeIds.map((value) => value.trim()).filter(Boolean),
        ),
      ].sort(),
      trackIds: [
        ...new Set(dto.trackIds.map((value) => value.trim()).filter(Boolean)),
      ].sort(),
      learnerProfiles: [...new Set(dto.learnerProfiles)].sort(),
      independentTypes: [...new Set(dto.independentTypes)].sort(),
    };
    return this.quizzes.save(quiz).then((row) => row.audienceRules);
  }
  async releaseQuizResults(context: UserContext, id: string) {
    const quiz = await this.requireQuiz(context, id, "quizzes.update");
    quiz.resultsReleasedAt = new Date();
    await this.quizzes.save(quiz);
    return { id: quiz.id, resultsReleasedAt: quiz.resultsReleasedAt };
  }
  async removeQuiz(context: UserContext, id: string) {
    const quiz = await this.requireQuiz(context, id, "quizzes.update");
    const attempts = await this.attempts.count({ where: { quiz: { id } } });
    if (attempts) {
      quiz.active = false;
      await this.quizzes.save(quiz);
      return { id, archived: true, reason: "ATTEMPTS_RETAINED" };
    }
    await this.quizzes.delete(id);
    return { id, deleted: true };
  }
  async quizQuestions(context: UserContext, id: string, answers = true) {
    await this.requireQuiz(context, id, "quizzes.read");
    const rows = await this.questions.find({
      where: { quiz: { id } },
      order: { sortOrder: "ASC" },
    });
    return answers
      ? rows
      : rows.map(({ correctAnswer: _c, explanation: _e, ...q }) => q);
  }
  async quizAnalytics(context: UserContext, id: string) {
    const quiz = await this.requireQuiz(context, id, "quizzes.read");
    const attempts = await this.attempts.find({
      where: { quiz: { id } },
      relations: { student: true, quiz: { questions: true } },
      order: { startedAt: "DESC" },
    });
    const submitted = attempts.filter((attempt) => attempt.submittedAt);
    const questions = quiz.questions?.length
      ? quiz.questions
      : await this.questions.find({
          where: { quiz: { id } },
          order: { sortOrder: "ASC" },
        });
    const byQuestion = questions.map((question) => {
      const responses: { [key: string]: number } = {
        a: 0,
        b: 0,
        c: 0,
        d: 0,
        blank: 0,
      };
      let correct = 0;
      for (const attempt of submitted) {
        const selected = this.answerKey(
          question.options,
          attempt.answers.find((answer) => answer.questionId === question.id)
            ?.selectedOption,
        );
        if (!selected) responses.blank++;
        else {
          responses[selected] = (responses[selected] || 0) + 1;
          if (
            selected ===
            this.answerKey(question.options, question.correctAnswer)
          )
            correct++;
        }
      }
      return {
        id: question.id,
        text: question.text,
        sortOrder: question.sortOrder,
        attempts: submitted.length,
        correct,
        accuracy: submitted.length
          ? Math.round((correct / submitted.length) * 100)
          : null,
        responses,
      };
    });
    const grades = new Map<string, { attempts: number; total: number }>();
    for (const attempt of submitted) {
      const key = attempt.student.grade || "نامشخص";
      const row = grades.get(key) || { attempts: 0, total: 0 };
      row.attempts++;
      row.total += attempt.percent;
      grades.set(key, row);
    }
    return {
      quiz: { id: quiz.id, title: quiz.title },
      attempts: submitted.length,
      averagePercent: submitted.length
        ? Math.round(
            submitted.reduce((sum, attempt) => sum + attempt.percent, 0) /
              submitted.length,
          )
        : null,
      questions: byQuestion,
      byGrade: [...grades.entries()]
        .map(([grade, value]) => ({
          grade,
          attempts: value.attempts,
          averagePercent: Math.round(value.total / value.attempts),
        }))
        .sort((a, b) => a.grade.localeCompare(b.grade, "fa")),
    };
  }
  async addQuizQuestion(
    context: UserContext,
    id: string,
    dto: QuizQuestionDto,
  ) {
    const quiz = await this.requireQuiz(context, id, "quiz_questions.manage");
    const correctAnswer = this.correctAnswerValue(
      dto.options,
      dto.correctAnswer,
    );
    return this.questions.save(
      this.questions.create({
        ...dto,
        correctAnswer,
        explanation: dto.explanation || "",
        sortOrder: dto.sortOrder || 0,
        quiz,
      }),
    );
  }
  async updateQuizQuestion(
    context: UserContext,
    id: string,
    dto: QuizQuestionDto,
  ) {
    const row = await this.questions.findOne({
      where: { id },
      relations: { quiz: { organization: true, exam: { organization: true } } },
    });
    if (!row)
      throw new ApiException(404, "QUIZ_QUESTION_NOT_FOUND", "سؤال پیدا نشد.");
    this.requireOrganization(
      context,
      row.quiz.organization?.id ?? row.quiz.exam?.organization?.id,
      "quiz_questions.manage",
    );
    const correctAnswer = this.correctAnswerValue(
      dto.options,
      dto.correctAnswer,
    );
    Object.assign(row, {
      ...dto,
      correctAnswer,
      explanation: dto.explanation || "",
      sortOrder: dto.sortOrder || 0,
    });
    return this.questions.save(row);
  }
  async removeQuizQuestion(context: UserContext, id: string) {
    const row = await this.questions.findOne({
      where: { id },
      relations: { quiz: { organization: true, exam: { organization: true } } },
    });
    if (!row)
      throw new ApiException(404, "QUIZ_QUESTION_NOT_FOUND", "سؤال پیدا نشد.");
    this.requireOrganization(
      context,
      row.quiz.organization?.id ?? row.quiz.exam?.organization?.id,
      "quiz_questions.manage",
    );
    await this.questions.delete(id);
    return { id, deleted: true };
  }
  async studentQuiz(userId: string, id: string) {
    const student = await this.student(userId);
    const quiz = await this.quizzes.findOne({
      where: { id, active: true },
      relations: { exam: true, organization: true },
    });
    if (!quiz)
      throw new ApiException(404, "QUIZ_NOT_FOUND", "آزمونک پیدا نشد.");
    await this.assertQuizAccess(quiz, student);
    this.requireQuizOpen(quiz);
    const rows = await this.questions.find({
      where: { quiz: { id } },
      order: { sortOrder: "ASC" },
    });
    return {
      ...quiz,
      questions: rows.map(({ correctAnswer: _c, explanation: _e, ...q }) => q),
    };
  }
  async startQuiz(userId: string, id: string) {
    const student = await this.student(userId);
    const quiz = await this.quizzes.findOne({
      where: { id, active: true },
      relations: { exam: true, organization: true, questions: true },
    });
    if (!quiz)
      throw new ApiException(404, "QUIZ_NOT_FOUND", "آزمونک پیدا نشد.");
    await this.assertQuizAccess(quiz, student);
    this.requireQuizOpen(quiz);
    let run = await this.attempts.findOne({
      where: {
        quiz: { id },
        student: { id: student.id },
        submittedAt: IsNull(),
      },
      relations: { quiz: { questions: true } },
    });
    if (!run) {
      const submitted = await this.attempts.count({
        where: {
          quiz: { id },
          student: { id: student.id },
          submittedAt: Not(IsNull()),
        },
      });
      if (submitted >= quiz.attemptLimit)
        throw new ApiException(
          409,
          "QUIZ_ATTEMPT_LIMIT_REACHED",
          "تعداد تلاش مجاز این آزمونک تمام شده است.",
        );
      run = await this.attempts.save(
        this.attempts.create({
          quiz,
          student,
          startedAt: new Date(),
          answers: [],
        }),
      );
    }
    return this.runPayload(run);
  }
  async submitQuiz(userId: string, id: string, dto: SubmitQuizDto) {
    const student = await this.student(userId);
    const run = await this.attempts.findOne({
      where: {
        id: dto.runId,
        quiz: { id },
        student: { id: student.id },
        submittedAt: IsNull(),
      },
      relations: { quiz: { questions: true } },
    });
    if (!run)
      throw new ApiException(
        409,
        "NO_ACTIVE_ATTEMPT",
        "تلاش فعالی وجود ندارد.",
      );
    const deadline = run.startedAt.getTime() + run.quiz.durationMinutes * 60000;
    const submittedAt = new Date();
    const answers =
      submittedAt.getTime() > deadline ? run.answers : dto.answers;
    const map = new Map(
      answers.map((a) => [a.questionId, a.selectedOption || ""]),
    );
    const isCorrect = (q: QuizQuestion) => {
      const selected = this.answerKey(q.options, map.get(q.id));
      const expected = this.answerKey(q.options, q.correctAnswer);
      return !!selected && !!expected && selected === expected;
    };
    const correct = run.quiz.questions.filter(isCorrect).length;
    const blank = run.quiz.questions.filter((q) => !map.get(q.id)).length;
    const wrong = run.quiz.questions.length - correct - blank;
    return this.db.transaction(async (m) => {
      Object.assign(run, {
        answers,
        correct,
        wrong,
        blank,
        percent: run.quiz.questions.length
          ? Math.round((correct / run.quiz.questions.length) * 100)
          : 0,
        submittedAt,
      });
      await m.save(QuizAttempt, run);
      for (const q of run.quiz.questions.filter(
        (q) => map.get(q.id) && !isCorrect(q),
      )) {
        const exists = await m.findOne(Mistake, {
          where: { studentId: student.id, questionId: q.id },
        });
        if (!exists)
          await m.save(
            Mistake,
            m.create(Mistake, {
              studentId: student.id,
              questionId: q.id,
              reason: "",
              resolved: false,
            }),
          );
      }
      return this.studentResult(run);
    });
  }
  async history(userId: string, id?: string) {
    const student = await this.student(userId);
    if (id) {
      const row = await this.attempts.findOne({
        where: { id, student: { id: student.id } },
        relations: { quiz: { questions: true } },
      });
      if (!row)
        throw new ApiException(404, "ATTEMPT_NOT_FOUND", "نتیجه پیدا نشد.");
      return this.studentResult(row);
    }
    return this.attempts
      .find({
        where: { student: { id: student.id } },
        relations: { quiz: true },
        order: { startedAt: "DESC" },
      })
      .then((rows) =>
        rows.map((row) =>
          row.quiz.resultPolicy === "manual" && !row.quiz.resultsReleasedAt
            ? {
                id: row.id,
                quizId: row.quiz.id,
                startedAt: row.startedAt,
                submittedAt: row.submittedAt,
                resultPending: true,
              }
            : row,
        ),
      );
  }
  private async canStudentAccessQuiz(student: Student, quiz: Quiz) {
    if (quiz.exam) return this.canStudentAccessExamAudience(student, quiz.exam);
    const [studentAssignmentCount, classAssignmentCount] = await Promise.all([
      this.quizAssignments.count({ where: { quiz: { id: quiz.id } } }),
      this.quizClassAssignments.count({ where: { quiz: { id: quiz.id } } }),
    ]);
    const rules = this.audienceRules(quiz);
    if (
      studentAssignmentCount ||
      classAssignmentCount ||
      this.hasAudienceRules(rules)
    ) {
      if (
        await this.quizAssignments.findOne({
          where: { quiz: { id: quiz.id }, student: { id: student.id } },
        })
      )
        return true;
      const classIds = (
        await this.quizClassAssignments.find({
          where: { quiz: { id: quiz.id } },
          relations: { classroom: true },
        })
      ).map((row) => row.classroom.id);
      if (
        classIds.length &&
        (await this.classEnrollments.findOne({
          where: {
            student: { id: student.id },
            classroom: { status: "ACTIVE", id: In(classIds) },
          },
        }))
      )
        return true;
      return this.matchesAudienceRules(student, rules);
    }
    if (!quiz.organization || !student.user) return false;
    return Boolean(
      await this.db.manager.findOne(OrganizationMembership, {
        where: {
          user: { id: student.user.id },
          organization: { id: quiz.organization.id },
          status: MembershipStatus.ACTIVE,
        },
      }),
    );
  }
  private async assertQuizAccess(quiz: Quiz, student: Student) {
    if (!(await this.canStudentAccessQuiz(student, quiz)))
      throw new ApiException(404, "QUIZ_NOT_ASSIGNED", "آزمونک در دسترس نیست.");
  }
  private async canStudentAccessExamAudience(student: Student, exam: Exam) {
    if (
      await this.assignments.findOne({
        where: { exam: { id: exam.id }, student: { id: student.id } },
      })
    )
      return true;
    const rules = {
      gradeIds: exam.audienceRules?.gradeIds || [],
      educationTypeIds: exam.audienceRules?.educationTypeIds || [],
      trackIds: exam.audienceRules?.trackIds || [],
      learnerProfiles: exam.audienceRules?.learnerProfiles || [],
      independentTypes: exam.audienceRules?.independentTypes || [],
    };
    const hasRules = Object.values(rules).some((values) => values.length > 0);
    if (
      hasRules &&
      (!rules.gradeIds.length ||
        rules.gradeIds.includes(student.gradeId || 0)) &&
      (!rules.educationTypeIds.length ||
        rules.educationTypeIds.includes(student.educationTypeId)) &&
      (!rules.trackIds.length || rules.trackIds.includes(student.trackId)) &&
      (!rules.learnerProfiles.length ||
        rules.learnerProfiles.includes(student.learnerProfile || "school")) &&
      (!rules.independentTypes.length ||
        rules.independentTypes.includes(student.independentType || ""))
    )
      return true;
    if (!this.examClassAssignments) return false;
    const classIds = (
      await this.examClassAssignments.find({
        where: { exam: { id: exam.id } },
        relations: { classroom: true },
      })
    ).map((row) => row.classroom.id);
    return Boolean(
      classIds.length &&
      (await this.classEnrollments.findOne({
        where: {
          student: { id: student.id },
          classroom: { status: "ACTIVE", id: In(classIds) },
        },
      })),
    );
  }
  private deliveryFields(
    dto: Pick<CreateQuizDto | UpdateQuizDto, "openAt" | "closeAt">,
  ) {
    const openAt =
      dto.openAt === undefined
        ? undefined
        : dto.openAt
          ? new Date(dto.openAt)
          : null;
    const closeAt =
      dto.closeAt === undefined
        ? undefined
        : dto.closeAt
          ? new Date(dto.closeAt)
          : null;
    if (openAt && closeAt && openAt >= closeAt)
      throw new ApiException(
        400,
        "INVALID_QUIZ_WINDOW",
        "زمان پایان باید پس از زمان شروع باشد.",
      );
    return { openAt, closeAt };
  }
  private assertDeliveryWindow(quiz: Quiz) {
    if (quiz.openAt && quiz.closeAt && quiz.openAt >= quiz.closeAt)
      throw new ApiException(
        400,
        "INVALID_QUIZ_WINDOW",
        "زمان پایان باید پس از زمان شروع باشد.",
      );
  }
  private quizIsOpen(quiz: Quiz, now = new Date()) {
    return (
      (!quiz.openAt || quiz.openAt <= now) &&
      (!quiz.closeAt || quiz.closeAt >= now)
    );
  }
  private requireQuizOpen(quiz: Quiz) {
    if (!this.quizIsOpen(quiz))
      throw new ApiException(
        409,
        "QUIZ_NOT_OPEN",
        "این آزمونک در بازهٔ دسترسی نیست.",
      );
  }
  private audienceRules(quiz: Quiz) {
    return {
      ...{
        gradeIds: [],
        educationTypeIds: [],
        trackIds: [],
        learnerProfiles: [],
        independentTypes: [],
      },
      ...(quiz.audienceRules || {}),
    };
  }
  private hasAudienceRules(rules: Quiz["audienceRules"]) {
    return Boolean(
      rules.gradeIds?.length ||
      rules.educationTypeIds?.length ||
      rules.trackIds?.length ||
      rules.learnerProfiles?.length ||
      rules.independentTypes?.length,
    );
  }
  private matchesAudienceRules(student: Student, rules: Quiz["audienceRules"]) {
    return (
      (!rules.gradeIds.length ||
        rules.gradeIds.includes(student.gradeId || 0)) &&
      (!rules.educationTypeIds.length ||
        rules.educationTypeIds.includes(student.educationTypeId)) &&
      (!rules.trackIds.length || rules.trackIds.includes(student.trackId)) &&
      (!rules.learnerProfiles.length ||
        rules.learnerProfiles.includes(student.learnerProfile || "school")) &&
      (!rules.independentTypes.length ||
        rules.independentTypes.includes(student.independentType || ""))
    );
  }
  private requireOrganization(
    context: UserContext,
    organizationId: string | undefined,
    capability: string,
  ) {
    if (context.roles.includes("PLATFORM_ADMIN")) return;
    if (
      !organizationId ||
      !this.authz.canAccessOrganization(context, organizationId, capability)
    )
      throw new ApiException(404, "NOT_FOUND", "منبع پیدا نشد.");
  }
  private async requireExam(
    context: UserContext,
    id: string,
    capability: string,
  ) {
    const exam = await this.exams.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!exam) throw new ApiException(404, "EXAM_NOT_FOUND", "آزمون پیدا نشد.");
    this.requireOrganization(context, exam.organization?.id, capability);
    return exam;
  }
  private async requireQuiz(
    context: UserContext,
    id: string,
    capability: string,
  ) {
    const quiz = await this.quizzes.findOne({
      where: { id },
      relations: { organization: true, exam: { organization: true } },
    });
    if (!quiz)
      throw new ApiException(404, "QUIZ_NOT_FOUND", "آزمونک پیدا نشد.");
    this.requireOrganization(
      context,
      quiz.organization?.id ?? quiz.exam?.organization?.id,
      capability,
    );
    return quiz;
  }
  private runPayload(run: QuizAttempt) {
    const deadline = new Date(
      run.startedAt.getTime() + run.quiz.durationMinutes * 60000,
    );
    return {
      runId: run.id,
      startedAt: run.startedAt,
      deadline,
      remainingSeconds: Math.max(
        0,
        Math.ceil((deadline.getTime() - Date.now()) / 1000),
      ),
      savedAnswers: run.answers,
      quiz: {
        id: run.quiz.id,
        title: run.quiz.title,
        durationMinutes: run.quiz.durationMinutes,
        questions: run.quiz.questions.map(
          ({ correctAnswer: _c, explanation: _e, ...q }) => q,
        ),
      },
    };
  }
  private result(run: QuizAttempt) {
    const map = new Map(
      run.answers.map((a) => [a.questionId, a.selectedOption || ""]),
    );
    return {
      id: run.id,
      quizId: run.quiz.id,
      correct: run.correct,
      wrong: run.wrong,
      blank: run.blank,
      percent: run.percent,
      startedAt: run.startedAt,
      submittedAt: run.submittedAt,
      review:
        run.quiz.questions?.map((q) => {
          const selectedOption = this.answerKey(q.options, map.get(q.id));
          const correctOption = this.answerKey(q.options, q.correctAnswer);
          return {
            questionId: q.id,
            selectedOption: selectedOption || null,
            correctOption,
            explanation: q.explanation,
            isCorrect: !!selectedOption && selectedOption === correctOption,
          };
        }) || [],
    };
  }
  private studentResult(run: QuizAttempt): Record<string, unknown> {
    return run.quiz.resultPolicy === "manual" && !run.quiz.resultsReleasedAt
      ? {
          id: run.id,
          quizId: run.quiz.id,
          startedAt: run.startedAt,
          submittedAt: run.submittedAt,
          resultPending: true,
        }
      : this.result(run);
  }
  private answerKey(options: string[], answer?: string | null) {
    const normalized = (answer || "").trim().toLowerCase();
    const keys = ["a", "b", "c", "d"];
    if (keys.includes(normalized) && keys.indexOf(normalized) < options.length)
      return normalized;
    const index = options.indexOf(answer || "");
    return index >= 0 ? keys[index] : "";
  }
  private correctAnswerValue(options: string[], answer: string) {
    const normalized = options.map((option) => option.trim());
    if (
      normalized.length !== 4 ||
      normalized.some((option) => !option) ||
      new Set(normalized.map((option) => option.toLocaleLowerCase("fa")))
        .size !== 4
    )
      throw new ApiException(
        400,
        "INVALID_QUESTION",
        "چهار گزینهٔ غیرتکراری و پاسخ صحیح معتبر لازم است.",
      );
    const key = this.answerKey(normalized, answer);
    if (!key)
      throw new ApiException(
        400,
        "INVALID_QUESTION",
        "چهار گزینه و پاسخ صحیح معتبر لازم است.",
      );
    return normalized[["a", "b", "c", "d"].indexOf(key)];
  }
}
