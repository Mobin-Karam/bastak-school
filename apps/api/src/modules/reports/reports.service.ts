import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { DailyReport } from "../../database/entities/daily-report.entity";
import {
  RecoveryRequest,
  RecoveryRequestStatus,
} from "../../database/entities/recovery-request.entity";
import { Student } from "../../database/entities/student.entity";
import { CreateDailyReportDto } from "./dto/create-daily-report.dto";
import { CreateRecoveryRequestDto } from "./dto/create-recovery-request.dto";
import { AuthorizationService, UserContext } from "../authorization";
import { User } from "../../database/entities/user.entity";
import { TeacherStudentReport } from "../../database/entities/teacher-student-report.entity";
import { AttendanceSession } from "../../database/entities/attendance-session.entity";
import { CreateTeacherStudentReportDto } from "./dto/create-teacher-student-report.dto";

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(DailyReport)
    private readonly reports: Repository<DailyReport>,
    @InjectRepository(RecoveryRequest)
    private readonly recoveries: Repository<RecoveryRequest>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    private readonly authorization: AuthorizationService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(TeacherStudentReport)
    private readonly teacherReports: Repository<TeacherStudentReport>,
    @InjectRepository(AttendanceSession)
    private readonly sessions: Repository<AttendanceSession>,
  ) {}

  private assertPrincipalOperator(context: UserContext) {
    if (
      !context.roles.some((role) =>
        ["PRINCIPAL", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"].includes(role),
      )
    )
      throw new ApiException(
        403,
        "TEACHER_REPORTS_PRINCIPAL_ONLY",
        "گزارش‌های خصوصی استاد فقط برای مدیر مدرسه در دسترس است.",
      );
  }

  async saveReport(userId: string, dto: CreateDailyReportDto) {
    const student = await this.studentForUser(userId);
    let report = await this.reports.findOne({
      where: { student: { id: student.id }, planDate: dto.planDate },
    });
    report = this.reports.create({
      ...(report || {}),
      student,
      planDate: dto.planDate,
      focus: dto.focus,
      fatigue: dto.fatigue,
      motivation: dto.motivation,
      problem: dto.problem || "",
      tomorrow: dto.tomorrow || "",
    });
    return this.reports.save(report);
  }

  async listReports(userId: string, limit?: string) {
    const student = await this.studentForUser(userId);
    return this.reports.find({
      where: { student: { id: student.id } },
      order: { planDate: "DESC" },
      take: Math.min(Math.max(Number(limit) || 30, 1), 100),
    });
  }

  async createRecovery(userId: string, dto: CreateRecoveryRequestDto) {
    const student = await this.studentForUser(userId);
    return this.recoveries.save(
      this.recoveries.create({
        student,
        planDate: dto.planDate || new Date().toISOString().slice(0, 10),
        reason: dto.reason || "",
        note: dto.note || "",
        status: RecoveryRequestStatus.PENDING,
      }),
    );
  }

  async listRecovery(userId: string) {
    const student = await this.studentForUser(userId);
    return this.recoveries.find({
      where: { student: { id: student.id } },
      order: { createdAt: "DESC" },
      take: 50,
    });
  }

  async reportsForStudent(context: UserContext, studentId: string) {
    if (
      !(await this.authorization.canAccessStudent(
        context,
        studentId,
        "reports.read",
      ))
    )
      throw new ApiException(
        403,
        "STUDENT_FORBIDDEN",
        "به این دانش‌آموز دسترسی ندارید.",
      );
    return this.reports.find({
      where: { student: { id: studentId } },
      order: { planDate: "DESC" },
      take: 100,
    });
  }

  async createTeacherReport(
    context: UserContext,
    sessionId: string,
    studentId: string,
    dto: CreateTeacherStudentReportDto,
  ) {
    this.authorization.requireCapability(context, "attendance.class.manage");
    const session = await this.sessions.findOne({
      where: { id: sessionId },
      relations: { organization: true, assignedStaff: true, createdBy: true },
    });
    if (
      !session ||
      (["class_schedule", "legacy_schedule", "legacy_import"].includes(session.sourceKind ?? "")
        ? session.assignedStaff?.id !== context.id
        : session.createdBy?.id !== context.id)
    )
      throw new ApiException(
        403,
        "ATTENDANCE_SESSION_FORBIDDEN",
        "این جلسه در اختیار شما نیست.",
      );
    const roster = new Set(
      (session.rosterSnapshot ?? []).map((member) => member.id),
    );
    if (!roster.has(studentId))
      throw new ApiException(
        422,
        "STUDENT_NOT_IN_SESSION",
        "دانش‌آموز در این جلسه نیست.",
      );
    const student = await this.students.findOne({
      where: { id: studentId, organization: { id: session.organization.id } },
    });
    if (!student)
      throw new ApiException(404, "STUDENT_NOT_FOUND", "دانش‌آموز پیدا نشد.");
    return this.teacherReports.save(
      this.teacherReports.create({
        organization: session.organization,
        session,
        student,
        teacher: { id: context.id } as User,
        academicYearIdSnapshot: session.academicYearIdSnapshot ?? null,
        academicYearNameSnapshot: session.academicYearNameSnapshot ?? null,
        termIdSnapshot: session.termIdSnapshot ?? null,
        termNameSnapshot: session.termNameSnapshot ?? null,
        message: dto.message.trim(),
        seenAt: null,
        seenBy: null,
      }),
    );
  }

  async teacherReportsForPrincipal(
    context: UserContext,
    filters: { academicYearId?: string; termId?: string } = {},
  ) {
    this.authorization.requireCapability(context, "attendance.review");
    this.assertPrincipalOperator(context);
    const rows = await this.teacherReports.find({
      where: {
        ...(filters.academicYearId ? { academicYearIdSnapshot: filters.academicYearId } : {}),
        ...(filters.termId ? { termIdSnapshot: filters.termId } : {}),
      },
      relations: {
        organization: true,
        student: true,
        teacher: true,
        session: true,
        seenBy: true,
      },
      order: { createdAt: "DESC" },
      take: 200,
    });
    return rows
      .filter((row) => context.organizationIds.includes(row.organization.id))
      .map((row) => ({
        id: row.id,
        message: row.message,
        createdAt: row.createdAt,
        seenAt: row.seenAt,
        studentId: row.student.id,
        studentName: row.student.name,
        teacherName:
          [row.teacher.firstName, row.teacher.lastName]
            .filter(Boolean)
            .join(" ") || row.teacher.username,
        sessionId: row.session.id,
        sessionTitle: row.session.titleSnapshot,
        academicYearId: row.academicYearIdSnapshot ?? null,
        academicYearName: row.academicYearNameSnapshot ?? null,
        termId: row.termIdSnapshot ?? null,
        termName: row.termNameSnapshot ?? null,
        seenByName: row.seenBy
          ? [row.seenBy.firstName, row.seenBy.lastName]
              .filter(Boolean)
              .join(" ") || row.seenBy.username
          : null,
      }));
  }

  async markTeacherReportSeen(context: UserContext, id: string) {
    this.authorization.requireCapability(context, "attendance.review");
    this.assertPrincipalOperator(context);
    const row = await this.teacherReports.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!row || !context.organizationIds.includes(row.organization.id))
      throw new ApiException(
        404,
        "TEACHER_REPORT_NOT_FOUND",
        "گزارش پیدا نشد.",
      );
    if (!row.seenAt) {
      row.seenAt = new Date();
      row.seenBy = { id: context.id } as User;
      await this.teacherReports.save(row);
    }
    return { id: row.id, seenAt: row.seenAt };
  }

  async teacherReportsForTeacher(context: UserContext) {
    this.authorization.requireCapability(context, "attendance.class.manage");
    const rows = await this.teacherReports.find({
      where: { teacher: { id: context.id } },
      relations: { student: true, session: true },
      order: { createdAt: "DESC" },
      take: 100,
    });
    return rows.map((row) => ({
      id: row.id,
      studentId: row.student.id,
      sessionId: row.session.id,
      message: row.message,
      seenAt: row.seenAt,
    }));
  }

  async recoveryForActor(context: UserContext) {
    if (context.roles.includes("STUDENT")) return this.listRecovery(context.id);
    this.authorization.requireCapability(context, "recovery_requests.read");
    const rows = await this.recoveries.find({
      relations: { student: true },
      order: { createdAt: "DESC" },
      take: 100,
    });
    const allowed = [];
    for (const row of rows)
      if (
        await this.authorization.canAccessStudent(
          context,
          row.student.id,
          "recovery_requests.read",
        )
      )
        allowed.push(row);
    return allowed;
  }

  async moderateRecovery(
    context: UserContext,
    id: string,
    status: RecoveryRequestStatus,
  ) {
    this.authorization.requireCapability(context, "recovery_requests.manage");
    if (
      ![
        RecoveryRequestStatus.RESOLVED,
        RecoveryRequestStatus.DISMISSED,
      ].includes(status)
    )
      throw new ApiException(400, "STATUS_INVALID", "وضعیت معتبر نیست.");
    const row = await this.recoveries.findOne({
      where: { id },
      relations: { student: true },
    });
    if (!row)
      throw new ApiException(404, "RECOVERY_NOT_FOUND", "درخواست پیدا نشد.");
    if (
      !(await this.authorization.canAccessStudent(
        context,
        row.student.id,
        "recovery_requests.manage",
      ))
    )
      throw new ApiException(403, "STUDENT_FORBIDDEN", "دسترسی ندارید.");
    row.status = status;
    return this.recoveries.save(row);
  }

  private async studentForUser(userId: string) {
    const student = await this.students.findOne({
      where: { user: { id: userId } },
    });
    if (!student)
      throw new ApiException(404, "STUDENT_NOT_FOUND", "دانش‌آموز پیدا نشد.");
    return student;
  }
}
