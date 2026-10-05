import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { QuestionBankItem } from "../../database/entities/question-bank-item.entity";
import { Exam } from "../../database/entities/exam.entity";
import { Question } from "../../database/entities/question.entity";
import { Quiz } from "../../database/entities/quiz.entity";
import { QuizQuestion } from "../../database/entities/quiz-question.entity";
import { AuthorizationService, UserContext } from "../authorization";
import { GenerateExamFromBankDto } from "./question-bank.dto";
@Injectable()
export class QuestionBankService {
  constructor(
    @InjectRepository(QuestionBankItem)
    private readonly items: Repository<QuestionBankItem>,
    @InjectRepository(Exam) private readonly exams: Repository<Exam>,
    @InjectRepository(Question)
    private readonly questions: Repository<Question>,
    @InjectRepository(Quiz) private readonly quizzes: Repository<Quiz>,
    @InjectRepository(QuizQuestion)
    private readonly quizQuestions: Repository<QuizQuestion>,
    private readonly authz: AuthorizationService,
  ) {}
  async list(
    c: UserContext,
    organizationId?: string,
    bankType: "exam" | "quiz" = "exam",
  ) {
    if (bankType !== "exam" && bankType !== "quiz")
      throw new ApiException(
        400,
        "INVALID_QUESTION_BANK",
        "Unknown question-bank type.",
      );
    return (
      await this.items.find({
        where: { archivedAt: IsNull(), bankType },
        relations: { organization: true },
        order: { updatedAt: "DESC" },
      })
    ).filter((x) => this.allowed(c, organizationId ?? x.organization?.id));
  }
  async template(c: UserContext, bankType: "exam" | "quiz" = "exam") {
    this.assertBankType(bankType);
    const organizationId = c.organizationIds[0] || "";
    return {
      schemaVersion: "1.0",
      bankType,
      questions: [this.sampleQuestion(organizationId)],
    };
  }
  async export(
    c: UserContext,
    organizationId?: string,
    bankType: "exam" | "quiz" = "exam",
  ) {
    this.assertBankType(bankType);
    const questions = await this.list(c, organizationId, bankType);
    return {
      schemaVersion: "1.0",
      bankType,
      questions: questions.map((item) => this.transferQuestion(item)),
    };
  }
  async import(
    c: UserContext,
    body: { bankType?: "exam" | "quiz"; questions?: Record<string, unknown>[] },
  ) {
    const bankType = body.bankType || "exam";
    this.assertBankType(bankType);
    if (!Array.isArray(body.questions) || !body.questions.length)
      throw new ApiException(
        400,
        "QUESTION_BANK_IMPORT_EMPTY",
        "At least one question is required.",
      );
    if (body.questions.length > 500)
      throw new ApiException(
        400,
        "QUESTION_BANK_IMPORT_TOO_LARGE",
        "A maximum of 500 questions can be imported at once.",
      );
    const normalized = body.questions.map((question, index) => {
      try {
        return this.normalizeDraft(c, { ...question, bankType }, bankType);
      } catch (error) {
        const response =
          error instanceof ApiException ? error.getResponse() : null;
        const message =
          response &&
          typeof response === "object" &&
          "error" in response &&
          response.error &&
          typeof response.error === "object" &&
          "message" in response.error
            ? String(response.error.message)
            : error instanceof Error
              ? error.message
              : "Invalid question.";
        throw new ApiException(
          400,
          "QUESTION_BANK_IMPORT_INVALID",
          `Row ${index + 1}: ${message}`,
        );
      }
    });
    const created = await this.items.manager.transaction(async (manager) =>
      manager.save(
        QuestionBankItem,
        normalized.map((item) => manager.create(QuestionBankItem, item)),
      ),
    );
    return { created: created.length };
  }
  async save(c: UserContext, body: Record<string, unknown>, id?: string) {
    let item = id
      ? await this.items.findOne({
          where: { id },
          relations: { organization: true },
        })
      : this.items.create();
    if (!item || (id && !this.allowed(c, item.organization?.id)))
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "Question-bank item not found.",
      );
    const requestedBankType = body.bankType === "quiz" ? "quiz" : "exam";
    if (id && item.bankType !== requestedBankType)
      throw new ApiException(
        400,
        "QUESTION_BANK_TYPE_IMMUTABLE",
        "Question-bank type cannot be changed.",
      );
    Object.assign(
      item,
      this.normalizeDraft(
        c,
        body,
        id ? item.bankType : requestedBankType,
        item.organization?.id,
      ),
    );
    return this.items.save(item);
  }
  async archive(c: UserContext, id: string) {
    const item = await this.items.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!item || !this.allowed(c, item.organization?.id))
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "Question-bank item not found.",
      );
    item.archivedAt = new Date();
    await this.items.save(item);
    return { id, archived: true };
  }
  async copyToExam(c: UserContext, id: string, examId: string) {
    const [item, exam] = await Promise.all([
      this.items.findOne({ where: { id }, relations: { organization: true } }),
      this.exams.findOne({
        where: { id: examId },
        relations: { organization: true },
      }),
    ]);
    if (
      !item ||
      !exam ||
      !this.allowed(c, item.organization?.id) ||
      !this.allowed(c, exam.organization?.id) ||
      item.bankType !== "exam"
    )
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "Question-bank item or exam not found.",
      );
    const sortOrder =
      (await this.questions.count({ where: { exam: { id: exam.id } } })) + 1;
    return this.questions.save(
      this.questions.create({
        text: item.text,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        subject: item.subject,
        topic: item.topic,
        book: item.book,
        grade: item.grade,
        chapter: item.chapter,
        lesson: item.lesson,
        difficulty: item.difficulty,
        source: item.source,
        tags: item.tags,
        sectionId: "",
        sortOrder,
        exam,
        questionBankItemId: item.id,
      }),
    );
  }
  async generateExam(c: UserContext, dto: GenerateExamFromBankDto) {
    const exam = await this.exams.findOne({
      where: { id: dto.examId },
      relations: { organization: true },
    });
    if (!exam || !this.allowed(c, exam.organization?.id))
      throw new ApiException(404, "EXAM_NOT_FOUND", "Exam not found.");
    const pool = (
      await this.items.find({
        where: { archivedAt: IsNull(), bankType: "exam" },
        relations: { organization: true },
        order: { updatedAt: "DESC" },
      })
    ).filter(
      (item) =>
        this.allowed(c, item.organization?.id) &&
        item.organization?.id === exam.organization?.id &&
        (!dto.subject || item.subject === dto.subject) &&
        (!dto.topic || item.topic === dto.topic) &&
        (!dto.grade || item.grade === dto.grade) &&
        (!dto.chapter || item.chapter === dto.chapter),
    );
    const requested = dto.itemIds?.length
      ? pool.filter((item) => dto.itemIds!.includes(item.id))
      : this.pickBalanced(pool, dto);
    if (!requested.length)
      throw new ApiException(
        422,
        "QUESTION_BANK_EMPTY",
        "No matching question-bank items found.",
      );
    if (!dto.commit)
      return {
        preview: true,
        requested: this.requestedCounts(dto),
        selected: requested.map((item) => ({
          id: item.id,
          text: item.text,
          difficulty: item.difficulty,
          subject: item.subject,
          topic: item.topic,
        })),
      };
    const existing = await this.questions.find({
      where: { exam: { id: exam.id } },
    });
    const sourceIds = new Set(
      existing.map((question) => question.questionBankItemId).filter(Boolean),
    );
    const items = requested.filter((item) => !sourceIds.has(item.id));
    const start = existing.length + 1;
    const created = await this.questions.save(
      items.map((item, index) =>
        this.questions.create({
          text: item.text,
          options: item.options,
          correctAnswer: item.correctAnswer,
          explanation: item.explanation,
          subject: item.subject,
          topic: item.topic,
          book: item.book,
          grade: item.grade,
          chapter: item.chapter,
          lesson: item.lesson,
          difficulty: item.difficulty,
          source: item.source,
          tags: item.tags,
          sectionId: "",
          sortOrder: start + index,
          exam,
          questionBankItemId: item.id,
        }),
      ),
    );
    return {
      preview: false,
      created: created.length,
      skipped: requested.length - created.length,
      questions: created,
    };
  }
  async copyToQuiz(c: UserContext, id: string, quizId: string) {
    const [item, quiz] = await Promise.all([
      this.items.findOne({ where: { id }, relations: { organization: true } }),
      this.quizzes.findOne({
        where: { id: quizId },
        relations: { organization: true, exam: { organization: true } },
      }),
    ]);
    const organizationId =
      quiz?.organization?.id ?? quiz?.exam?.organization?.id;
    if (
      !item ||
      !quiz ||
      !this.allowed(c, item.organization?.id) ||
      !this.allowed(c, organizationId) ||
      item.bankType !== "quiz"
    )
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "Question-bank item or quiz not found.",
      );
    const sortOrder =
      (await this.quizQuestions.count({ where: { quiz: { id: quiz.id } } })) +
      1;
    return this.quizQuestions.save(
      this.quizQuestions.create({
        text: item.text,
        options: item.options,
        correctAnswer: item.correctAnswer,
        explanation: item.explanation,
        sortOrder,
        quiz,
        questionBankItemId: item.id,
      }),
    );
  }
  async copyExamItemsToQuizBank(c: UserContext, itemIds: string[]) {
    const ids = [...new Set(itemIds)];
    const sources = await this.items.find({
      where: { id: In(ids), archivedAt: IsNull(), bankType: "exam" },
      relations: { organization: true },
    });
    if (
      sources.length !== ids.length ||
      sources.some((item) => !this.allowed(c, item.organization?.id))
    )
      throw new ApiException(
        404,
        "QUESTION_BANK_ITEM_NOT_FOUND",
        "One or more exam-bank items were not found.",
      );
    const existing = await this.items.find({
      where: { sourceQuestionBankItemId: In(ids), bankType: "quiz" },
      relations: { organization: true },
    });
    const existingKeys = new Set(
      existing.map(
        (item) =>
          `${item.organization?.id || ""}:${item.sourceQuestionBankItemId || ""}`,
      ),
    );
    const copies = sources.filter(
      (item) => !existingKeys.has(`${item.organization?.id || ""}:${item.id}`),
    );
    const created = await this.items.save(
      copies.map(
        ({ id, organization, archivedAt, createdAt, updatedAt, ...item }) =>
          this.items.create({
            ...item,
            organization,
            bankType: "quiz",
            sourceQuestionBankItemId: id,
          }),
      ),
    );
    return {
      created: created.length,
      skipped: sources.length - created.length,
      items: created,
    };
  }
  private allowed(c: UserContext, id?: string) {
    return (
      c.roles.includes("PLATFORM_ADMIN") ||
      (!!id && this.authz.canAccessOrganization(c, id, "question_bank.manage"))
    );
  }
  private assertBankType(
    bankType: string,
  ): asserts bankType is "exam" | "quiz" {
    if (bankType !== "exam" && bankType !== "quiz")
      throw new ApiException(
        400,
        "INVALID_QUESTION_BANK",
        "Unknown question-bank type.",
      );
  }
  private normalizeDraft(
    c: UserContext,
    body: Record<string, unknown>,
    bankType: "exam" | "quiz",
    fallbackOrganizationId = "",
  ) {
    const organizationId = String(
      body.organizationId ||
        fallbackOrganizationId ||
        c.organizationIds[0] ||
        "",
    ).trim();
    if (!this.allowed(c, organizationId))
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "Organization access is required.",
      );
    const options = Array.isArray(body.options)
      ? body.options.map(String).map((value) => value.trim())
      : [];
    const correctAnswer = String(body.correctAnswer || "").trim();
    if (
      !String(body.text || "").trim() ||
      options.length !== 4 ||
      options.some((value) => !value) ||
      new Set(options.map((value) => value.toLowerCase())).size !== 4 ||
      !options.includes(correctAnswer)
    )
      throw new ApiException(
        400,
        "INVALID_QUESTION",
        "A question, four unique options, and a valid correct answer are required.",
      );
    return {
      text: String(body.text).trim(),
      options,
      correctAnswer,
      bankType,
      organization: { id: organizationId },
      explanation: String(body.explanation || ""),
      subject: String(body.subject || ""),
      topic: String(body.topic || ""),
      book: String(body.book || ""),
      grade: String(body.grade || ""),
      chapter: String(body.chapter || ""),
      lesson: String(body.lesson || ""),
      difficulty: String(body.difficulty || "medium"),
      source: String(body.source || ""),
      tags: Array.isArray(body.tags)
        ? body.tags
            .map(String)
            .map((tag) => tag.trim())
            .filter(Boolean)
        : [],
    };
  }
  private transferQuestion(item: QuestionBankItem) {
    return {
      organizationId: item.organization?.id || "",
      text: item.text,
      options: item.options,
      correctAnswer: item.correctAnswer,
      explanation: item.explanation,
      subject: item.subject,
      topic: item.topic,
      book: item.book,
      grade: item.grade,
      chapter: item.chapter,
      lesson: item.lesson,
      difficulty: item.difficulty,
      source: item.source,
      tags: item.tags,
    };
  }
  private sampleQuestion(organizationId: string) {
    return {
      organizationId,
      text: "حاصل ۲ + ۲ کدام است؟",
      options: ["۱", "۲", "۳", "۴"],
      correctAnswer: "۴",
      explanation: "جمع دو و دو برابر چهار است.",
      subject: "ریاضی",
      topic: "اعداد",
      book: "",
      grade: "",
      chapter: "",
      lesson: "",
      difficulty: "easy",
      source: "نمونه آموزشی",
      tags: ["نمونه", "ریاضی"],
    };
  }
  private requestedCounts(dto: GenerateExamFromBankDto) {
    return {
      easy: dto.easy || 0,
      medium: dto.medium || 0,
      hard: dto.hard || 0,
    };
  }
  private pickBalanced(pool: QuestionBankItem[], dto: GenerateExamFromBankDto) {
    const counts = this.requestedCounts(dto);
    const chosen: QuestionBankItem[] = [];
    for (const [difficulty, count] of Object.entries(counts)) {
      const options = pool.filter((item) => item.difficulty === difficulty);
      for (let index = 0; index < count && index < options.length; index++)
        chosen.push(options[index]);
    }
    return chosen;
  }
}
