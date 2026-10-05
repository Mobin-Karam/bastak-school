import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, Repository } from "typeorm";
import { In } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { EducationBook } from "../../database/entities/education-book.entity";
import { Student } from "../../database/entities/student.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { OrganizationMembership, MembershipStatus } from "../../database/entities/organization-membership.entity";
import { Plan, PlanStatus } from "../../database/entities/plan.entity";
import { LearningResourceAssignment } from "../../database/entities/learning-resource-assignment.entity";
import { ExamAttempt } from "../../database/entities/exam-attempt.entity";
import { DailyReport } from "../../database/entities/daily-report.entity";
import { AuthenticatedUser } from "../auth";
import { SaveEducationBookDto, UpdateEducationBookDto } from "./education-catalog.dto";
import taxonomyJson from "./data/iran-school-taxonomy-1405-1406.json";
import textbooksJson from "./data/iran-school-textbooks-1405-1406.json";
import type {
  EducationTaxonomy,
  TextbookDataset,
} from "./education-catalog.types";

const taxonomy = taxonomyJson as EducationTaxonomy;
const textbooks = textbooksJson as TextbookDataset;

@Injectable()
export class EducationCatalogService {
  constructor(
    @InjectRepository(EducationBook)
    private readonly books: Repository<EducationBook>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(AuditLog) private readonly audit: Repository<AuditLog>,
    @InjectRepository(OrganizationMembership) private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(Plan) private readonly plans?: Repository<Plan>,
    @InjectRepository(LearningResourceAssignment) private readonly resources?: Repository<LearningResourceAssignment>,
    @InjectRepository(ExamAttempt) private readonly attempts?: Repository<ExamAttempt>,
    @InjectRepository(DailyReport) private readonly reports?: Repository<DailyReport>,
  ) {}

  signupOptions() {
    return {
      schoolYear: taxonomy.dataset.school_year,
      grades: taxonomy.grades,
      levels: taxonomy.levels,
      educationTypes: taxonomy.education_types,
      theoreticalTracks: taxonomy.theoretical_tracks,
      vocationalGroups: taxonomy.vocational_groups,
      vocationalFields: taxonomy.common_vocational_fields,
      gradeStructure: taxonomy.grade_structure,
    };
  }

  validateSelection(grade: number, educationTypeId: string, trackId?: string) {
    const structure = taxonomy.grade_structure.find((item) =>
      item.grades.includes(grade),
    );
    if (!structure || !structure.education_type_ids.includes(educationTypeId)) {
      throw new ApiException(
        422,
        "INVALID_EDUCATION_SELECTION",
        "پایه و نوع آموزش با یکدیگر سازگار نیستند.",
      );
    }
    const normalizedTrack = structure.track_required
      ? (trackId || "").trim()
      : "general";
    const allowed =
      educationTypeId === "theoretical"
        ? taxonomy.theoretical_tracks
        : ["technical_vocational", "kar_danesh"].includes(educationTypeId)
          ? taxonomy.common_vocational_fields
          : [{ id: "general", fa: "عمومی" }];
    if (!allowed.some((item) => item.id === normalizedTrack)) {
      throw new ApiException(
        422,
        "INVALID_EDUCATION_SELECTION",
        "رشته انتخاب‌شده برای این پایه معتبر نیست.",
      );
    }
    const gradeLabel = taxonomy.grades.find((item) => item.id === grade)?.fa;
    const trackLabel =
      allowed.find((item) => item.id === normalizedTrack)?.fa || "عمومی";
    if (!gradeLabel)
      throw new ApiException(
        422,
        "INVALID_EDUCATION_SELECTION",
        "پایه انتخاب‌شده معتبر نیست.",
      );
    return {
      gradeId: grade,
      gradeLabel,
      educationTypeId,
      trackId: normalizedTrack,
      trackLabel,
    };
  }

  async listBooks(grade?: number, educationTypeId?: string, trackId?: string, organizationIds: string[] = []) {
    const rows = await this.books.find({
      where: { ...(grade ? { grade } : {}), state: "PUBLISHED" },
      order: { grade: "ASC", category: "ASC", titleFa: "ASC" },
    });
    const scopedRows = this.applyOrganizationOverrides(rows, organizationIds);
    const branchFiltered = educationTypeId
      ? scopedRows.filter((book) => {
          if (book.branch === "مشترک") return true;
          if (educationTypeId === "general") return book.branch === "عمومی";
          if (educationTypeId === "theoretical") return book.branch === "نظری";
          if (educationTypeId === "technical_vocational")
            return book.branch.includes("فنی و حرفه‌ای");
          if (educationTypeId === "kar_danesh")
            return book.branch.includes("کاردانش");
          return false;
        })
      : scopedRows;
    if (!trackId || trackId === "general") return branchFiltered;
    const track = [
      ...taxonomy.theoretical_tracks,
      ...taxonomy.common_vocational_fields,
    ].find((item) => item.id === trackId)?.fa;
    if (!track) return [];
    return branchFiltered.filter(
      (book) =>
        book.track === "مشترک" ||
        book.branch === "مشترک" ||
        book.appliesTo.includes(track),
    );
  }

  async booksForStudentUser(userId: string) {
    const student = await this.students.findOne({
      where: { user: { id: userId } },
    });
    if (!student)
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "پرونده دانش‌آموز پیدا نشد.",
      );
    if (!student.gradeId || !student.educationTypeId) {
      throw new ApiException(
        409,
        "EDUCATION_PROFILE_INCOMPLETE",
        "پایه و نوع آموزش پرونده دانش‌آموز کامل نیست.",
      );
    }
    const education = this.validateSelection(
      student.gradeId,
      student.educationTypeId,
      student.trackId,
    );
    const organizationIds = await this.organizationIdsForUser(userId);
    return {
      schoolYear: taxonomy.dataset.school_year,
      education,
      books: await this.listBooks(
        education.gradeId,
        education.educationTypeId,
        education.trackId, organizationIds,
      ),
    };
  }

  datasets() {
    return { taxonomy, textbooks };
  }

  async listManaged(actor: AuthenticatedUser, schoolYear?: string, state?: string) {
    const books = await this.books.find({
      where: { ...(schoolYear ? { schoolYear } : {}), ...(state ? { state: state as EducationBook["state"] } : {}) },
      order: { schoolYear: "DESC", grade: "ASC", titleFa: "ASC" },
    });
    return this.isPlatform(actor) ? books : books.filter((book) => !book.organizationId || (actor.organizationIds || []).includes(book.organizationId));
  }

  async createBook(actor: AuthenticatedUser, input: SaveEducationBookDto) {
    this.requireOrganizationScope(actor, input.organizationId);
    const existing = await this.books.findOneBy({ id: input.id.trim() });
    if (existing) throw new ApiException(409, "EDUCATION_BOOK_EXISTS", "شناسه کتاب تکراری است.");
    const state = input.state || "DRAFT";
    const book = this.books.create({ id: input.id.trim(), ...this.cleanBook(input), state, version: 1, publishedAt: state === "PUBLISHED" ? new Date() : null });
    const saved = await this.books.save(book);
    await this.record(actor, "education.catalog_book_created", saved);
    return saved;
  }

  async previewImport(actor: AuthenticatedUser, inputs: SaveEducationBookDto[]) {
    if (!Array.isArray(inputs) || !inputs.length || inputs.length > 200) throw new ApiException(422, "EDUCATION_IMPORT_INVALID", "فایل ورود باید بین ۱ تا ۲۰۰ کتاب داشته باشد.");
    const seen = new Set<string>();
    const rows = await Promise.all(inputs.map(async (input, index) => {
      const id = input.id?.trim();
      const errors: string[] = [];
      if (!id) errors.push("شناسه لازم است");
      if (id && seen.has(id)) errors.push("شناسه در فایل تکراری است");
      if (id) seen.add(id);
      if (!input.titleFa?.trim()) errors.push("عنوان فارسی لازم است");
      if (!Number.isInteger(input.grade) || input.grade < 1 || input.grade > 12) errors.push("پایه نامعتبر است");
      try { this.requireOrganizationScope(actor, input.organizationId); } catch { errors.push("سازمان خارج از دسترس است"); }
      if (id && await this.books.findOneBy({ id })) errors.push("شناسه در کاتالوگ موجود است");
      return { row: index + 1, id: id || null, valid: !errors.length, errors };
    }));
    return { valid: rows.every((row) => row.valid), accepted: rows.filter((row) => row.valid).length, rejected: rows.filter((row) => !row.valid).length, rows };
  }

  async commitImport(actor: AuthenticatedUser, inputs: SaveEducationBookDto[]) {
    const preview = await this.previewImport(actor, inputs);
    if (!preview.valid) throw new ApiException(422, "EDUCATION_IMPORT_INVALID", "پیش‌نمایش ورود خطا دارد.", preview);
    const saved = [] as EducationBook[];
    for (const input of inputs) saved.push(await this.createBook(actor, { ...input, state: "DRAFT" }));
    await this.audit.save(this.audit.create({ user: { id: actor.id } as any, action: "education.catalog_imported", entity: "education_book", metadata: { count: saved.length, ids: saved.map((book) => book.id) } }));
    return { imported: saved.length, state: "DRAFT", books: saved };
  }

  async updateBook(actor: AuthenticatedUser, id: string, input: UpdateEducationBookDto) {
    const book = await this.books.findOneBy({ id });
    if (!book) throw new ApiException(404, "EDUCATION_BOOK_NOT_FOUND", "کتاب پیدا نشد.");
    this.requireOrganizationScope(actor, input.organizationId ?? book.organizationId);
    const state = input.state;
    Object.assign(book, this.cleanBook(input), state === "PUBLISHED" && book.state !== "PUBLISHED" ? { publishedAt: new Date() } : {}, { version: book.version + 1 });
    const saved = await this.books.save(book);
    await this.record(actor, "education.catalog_book_updated", saved);
    return saved;
  }

  async publishBook(actor: AuthenticatedUser, id: string) {
    const book = await this.books.findOneBy({ id });
    if (!book) throw new ApiException(404, "EDUCATION_BOOK_NOT_FOUND", "کتاب پیدا نشد.");
    this.requireOrganizationScope(actor, book.organizationId);
    book.state = "PUBLISHED";
    book.publishedAt = new Date();
    book.version += 1;
    const saved = await this.books.save(book);
    await this.record(actor, "education.catalog_book_published", saved);
    return saved;
  }

  async bookImpact(actor: AuthenticatedUser, id: string) {
    const book = await this.books.findOneBy({ id });
    if (!book) throw new ApiException(404, "EDUCATION_BOOK_NOT_FOUND", "کتاب پیدا نشد.");
    this.requireOrganizationScope(actor, book.organizationId);
    const students = await this.scopedStudents(actor);
    const organizationUserIds = book.organizationId
      ? new Set((await this.memberships.find({ where: { organization: { id: book.organizationId }, status: MembershipStatus.ACTIVE }, relations: { user: true } })).map((membership) => membership.user.id))
      : null;
    const affected = [] as Array<{ id: string; name: string; grade: number }>;
    for (const student of students) {
      if (!student.gradeId || !student.educationTypeId || student.gradeId !== book.grade) continue;
      if (organizationUserIds && !organizationUserIds.has(student.user?.id || "")) continue;
      let selection: ReturnType<EducationCatalogService["validateSelection"]>;
      try {
        selection = this.validateSelection(student.gradeId, student.educationTypeId, student.trackId || undefined);
      } catch {
        continue;
      }
      if (!this.bookMatchesSelection(book, selection.educationTypeId, selection.trackId)) continue;
      affected.push({ id: student.id, name: student.name, grade: student.gradeId });
    }
    return { bookId: book.id, affectedStudents: affected.length, sample: affected.slice(0, 10) };
  }

  async operationsOverview(actor: AuthenticatedUser, from?: string, to?: string, grade?: number) {
    const period = this.normalizePeriod(from, to);
    if (grade !== undefined && (!Number.isInteger(grade) || grade < 1 || grade > 12)) throw new ApiException(422, "EDUCATION_COHORT_INVALID", "پایه گروه آموزشی معتبر نیست.");
    const students = (await this.scopedStudents(actor)).filter((student) => grade === undefined || student.gradeId === grade);
    const books = await this.books.find({ where: { state: "PUBLISHED" } });
    const complete = students.filter((student) => Boolean(student.gradeId && student.educationTypeId));
    const ids = students.map((student) => student.id);
    const [plans, resources, attempts, reports] = ids.length && this.plans && this.resources && this.attempts && this.reports ? await Promise.all([
      this.plans.find({ where: { student: { id: In(ids) }, status: PlanStatus.PUBLISHED }, relations: { student: true } }),
      this.resources.find({ where: { student: { id: In(ids) } }, relations: { student: true } }),
      this.attempts.find({ where: { student: { id: In(ids) } }, relations: { student: true } }),
      this.reports.find({ where: { student: { id: In(ids) } }, relations: { student: true } }),
    ]) : [[], [], [], []];
    const covered = (rows: Array<{ student: { id: string } }>) => new Set(rows.map((row) => row.student.id));
    const planned = covered(plans), resourced = covered(resources), examined = covered(attempts), reported = covered(reports);
    const remediationItem = (student: Student, reason: string) => ({
      id: student.id,
      name: student.name,
      grade: student.gradeId ?? null,
      reason,
    });
    const withoutPlan = students.filter((student) => !planned.has(student.id));
    const withoutResources = students.filter((student) => !resourced.has(student.id));
    const withoutExam = students.filter((student) => !examined.has(student.id));
    const withoutReport = students.filter((student) => !reported.has(student.id));
    const withinPeriod = (value?: Date | string | null) => !period || (Boolean(value) && String(value).slice(0, 10) >= period.from && String(value).slice(0, 10) <= period.to);
    const submittedAttempts = attempts.filter((attempt) => attempt.status === "submitted" && Number.isFinite(attempt.percentage ?? attempt.score) && withinPeriod(attempt.submittedAt || attempt.finishedAt || attempt.startedAt));
    const averageExamPercentage = submittedAttempts.length
      ? Math.round((submittedAttempts.reduce((sum, attempt) => sum + (attempt.percentage ?? attempt.score), 0) / submittedAttempts.length) * 10) / 10
      : null;
    const periodReports = reports.filter((report) => withinPeriod(report.planDate));
    const totalStudyHours = Math.round(periodReports.reduce((sum, report) => sum + (Number(report.studyHours) || 0), 0) * 10) / 10;
    const distribution = new Map<string, number>();
    let missingMappings = 0;
    for (const student of complete) {
      const selection = this.validateSelection(student.gradeId!, student.educationTypeId!, student.trackId || undefined);
      const key = `${selection.gradeLabel} · ${selection.trackLabel}`;
      distribution.set(key, (distribution.get(key) || 0) + 1);
      const visible = await this.listBooks(selection.gradeId, selection.educationTypeId, selection.trackId, await this.organizationIdsForUser(student.user?.id || ""));
      if (!visible.length) missingMappings += 1;
    }
    return {
      scope: actor.roles?.includes("PLATFORM_ADMIN") || actor.role === "PLATFORM_ADMIN" ? "platform" : "organization",
      period,
      cohort: grade === undefined ? null : { grade },
      students: { total: students.length, complete: complete.length, incomplete: students.length - complete.length, missingMappings },
      coverage: { planned: planned.size, withoutPlan: withoutPlan.length, resourced: resourced.size, withoutResources: withoutResources.length, examined: examined.size, reported: reported.size },
      trends: {
        submittedAttempts: submittedAttempts.length,
        averageExamPercentage,
        totalStudyHours,
        averageStudyHours: periodReports.length ? Math.round((totalStudyHours / periodReports.length) * 10) / 10 : null,
      },
      remediation: {
        incompleteProfiles: students.filter((student) => !student.gradeId || !student.educationTypeId).slice(0, 10).map((student) => remediationItem(student, "پرونده آموزشی ناقص")),
        withoutPlan: withoutPlan.slice(0, 10).map((student) => remediationItem(student, "بدون برنامه منتشرشده")),
        withoutResources: withoutResources.slice(0, 10).map((student) => remediationItem(student, "بدون منبع یادگیری")),
        withoutExam: withoutExam.slice(0, 10).map((student) => remediationItem(student, "بدون تلاش آزمون")),
        withoutReport: withoutReport.slice(0, 10).map((student) => remediationItem(student, "بدون گزارش روزانه")),
      },
      catalog: { published: books.length, draft: await this.books.countBy({ state: "DRAFT" }), archived: await this.books.countBy({ state: "ARCHIVED" }) },
      distribution: [...distribution.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "fa")),
    };
  }

  private async scopedStudents(actor: AuthenticatedUser) {
    if (actor.roles?.includes("PLATFORM_ADMIN") || actor.role === "PLATFORM_ADMIN") return this.students.find({ relations: { user: true } });
    const organizationIds = actor.organizationIds || [];
    if (!organizationIds.length) return [];
    const memberships = await this.memberships.find({ where: { organization: { id: In(organizationIds) }, status: MembershipStatus.ACTIVE }, relations: { user: true } });
    const userIds = memberships.map((item) => item.user.id);
    return userIds.length ? this.students.find({ where: { user: { id: In(userIds) } }, relations: { user: true } }) : [];
  }

  private cleanBook(input: Partial<SaveEducationBookDto | UpdateEducationBookDto>) {
    const trim = (value: string | undefined) => value === undefined ? undefined : value.trim();
    return {
      ...(input.country !== undefined ? { country: trim(input.country)! } : {}), ...(input.schoolYear !== undefined ? { schoolYear: trim(input.schoolYear)! } : {}), ...(input.grade !== undefined ? { grade: input.grade } : {}), ...(input.level !== undefined ? { level: trim(input.level)! } : {}), ...(input.branch !== undefined ? { branch: trim(input.branch)! } : {}), ...(input.track !== undefined ? { track: trim(input.track)! } : {}), ...(input.category !== undefined ? { category: trim(input.category)! } : {}), ...(input.titleFa !== undefined ? { titleFa: trim(input.titleFa)! } : {}), ...(input.titleEn !== undefined ? { titleEn: trim(input.titleEn)! } : {}), ...(input.textbookCode !== undefined ? { textbookCode: trim(input.textbookCode) || null } : {}), ...(input.appliesTo !== undefined ? { appliesTo: input.appliesTo.map((value) => value.trim()).filter(Boolean) } : {}), ...(input.notes !== undefined ? { notes: trim(input.notes) || null } : {}), ...(input.state !== undefined ? { state: input.state } : {}), ...(input.organizationId !== undefined ? { organizationId: input.organizationId || null } : {}),
    };
  }
  private normalizePeriod(from?: string, to?: string) {
    if (!from && !to) return null;
    const datePattern = /^\d{4}-\d{2}-\d{2}$/;
    if (!from || !to || !datePattern.test(from) || !datePattern.test(to) || from > to) throw new ApiException(422, "EDUCATION_PERIOD_INVALID", "بازه زمانی آموزش معتبر نیست.");
    return { from, to };
  }

  private async record(actor: AuthenticatedUser, action: string, book: EducationBook) {
    await this.audit.save(this.audit.create({ user: { id: actor.id } as any, action, entity: "education_book", organizationId: book.organizationId || null, metadata: { id: book.id, version: book.version, state: book.state, schoolYear: book.schoolYear } }));
  }
  private applyOrganizationOverrides(rows: EducationBook[], organizationIds: string[]) {
    const visible = rows.filter((book) => !book.organizationId || organizationIds.includes(book.organizationId));
    const resolved = new Map<string, EducationBook>();
    for (const book of visible.sort((left, right) => Number(Boolean(left.organizationId)) - Number(Boolean(right.organizationId)))) {
      const identity = `${book.schoolYear}:${book.grade}:${book.textbookCode || book.titleFa}:${book.track}`;
      resolved.set(identity, book);
    }
    return [...resolved.values()];
  }
  private bookMatchesSelection(book: EducationBook, educationTypeId: string, trackId: string) {
    const branchMatches = book.branch === "مشترک" || (educationTypeId === "general" ? book.branch === "عمومی" : educationTypeId === "theoretical" ? book.branch === "نظری" : educationTypeId === "technical_vocational" ? book.branch.includes("فنی و حرفه‌ای") : educationTypeId === "kar_danesh" ? book.branch.includes("کاردانش") : false);
    if (!branchMatches) return false;
    if (!trackId || trackId === "general") return true;
    const track = [...taxonomy.theoretical_tracks, ...taxonomy.common_vocational_fields].find((item) => item.id === trackId)?.fa;
    return Boolean(track && (book.track === "مشترک" || book.branch === "مشترک" || book.appliesTo.includes(track)));
  }
  private isPlatform(actor: AuthenticatedUser) { return actor.role === "PLATFORM_ADMIN" || actor.roles?.includes("PLATFORM_ADMIN"); }
  private requireOrganizationScope(actor: AuthenticatedUser, organizationId?: string | null) { if (organizationId && !this.isPlatform(actor) && !(actor.organizationIds || []).includes(organizationId)) throw new ApiException(403, "ORGANIZATION_FORBIDDEN", "به این کاتالوگ سازمانی دسترسی ندارید."); }
  private async organizationIdsForUser(userId: string) { if (!userId || !this.memberships?.find) return []; return (await this.memberships.find({ where: { user: { id: userId }, status: MembershipStatus.ACTIVE }, relations: { organization: true } })).map((membership) => membership.organization.id); }

  async seed() {
    return seedEducationCatalog(this.books.manager);
  }
}

export async function seedEducationCatalog(manager: EntityManager) {
  const repository = manager.getRepository(EducationBook);
  const records = textbooks.books.map((book) =>
    repository.create({
      id: book.id,
      country: book.country,
      schoolYear: book.school_year,
      grade: book.grade,
      level: book.level,
      branch: book.branch,
      track: book.track,
      category: book.category,
      titleFa: book.title_fa,
      titleEn: book.title_en,
      textbookCode: book.textbook_code,
      appliesTo: book.applies_to,
      notes: book.notes,
    }),
  );
  await repository.save(records, { chunk: 100 });
  return records.length;
}
