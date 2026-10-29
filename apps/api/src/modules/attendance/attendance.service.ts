import type { AttendanceSessionDetail } from "@moshaver/api-contract";
import { attendanceTransaction } from "./attendance-transaction";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { createHash, randomUUID } from "node:crypto";
import { AttendanceWriteReceipt } from "../../database/entities/attendance-write-receipt.entity";
import { AttendancePolicy } from "../../database/entities/attendance-policy.entity";
import {
  Notification,
  NotificationType,
} from "../../database/entities/notification.entity";
import { AttendanceCorrection } from "../../database/entities/attendance-correction.entity";
import { TeacherLeaveRequest } from "../../database/entities/teacher-leave-request.entity";
import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import {
  SchoolAcademicYear,
  SchoolAcademicTerm,
} from "../../database/entities/school-academic-year.entity";
import {
  AttendanceSupervisorCheck,
  SupervisorAttendanceEntry,
} from "../../database/entities/attendance-supervisor-check.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import {
  Between,
  EntityManager,
  In,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  AttendanceRecord,
  AttendanceReviewStatus,
  AttendanceStatus,
} from "../../database/entities/attendance-record.entity";
import {
  AttendanceContextType,
  AttendanceSession,
} from "../../database/entities/attendance-session.entity";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationBook } from "../../database/entities/education-book.entity";
import { Student } from "../../database/entities/student.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { User } from "../../database/entities/user.entity";
import {
  MembershipStatus,
  OrganizationMembership,
} from "../../database/entities/organization-membership.entity";
import { AuthenticatedUser } from "../auth";
import { AuthorizationService, UserContext } from "../authorization";
import { SchoolAccessService } from "../school-access";
import { RealtimeService } from "../realtime";
import { RewardsService } from "../rewards";
import {
  BulkMarkAttendanceDto,
  CreateAttendanceSessionDto,
  OpenLegacyScheduleAttendanceDto,
  CreateHistoricalAttendanceSessionDto,
  HistoricalAttendanceCandidatesQueryDto,
  ReviewAttendanceAbsenceDto,
  AwardAttendancePointsDto,
  SubmitAttendanceAbsencesDto,
  FinalizeAttendanceSessionDto,
  CancelAttendanceSessionDto,
  CorrectAttendanceRecordDto,
  ReviewAttendanceCorrectionDto,
  UpdateAttendancePolicyDto,
  AttendanceHistoryQueryDto,
  SaveSupervisorAttendanceCheckDto,
} from "./attendance.dto";

const maximumAttendanceBatchSize = 500;

@Injectable()
export class AttendanceService {
  constructor(
    @InjectRepository(AttendanceSession)
    private readonly sessions: Repository<AttendanceSession>,
    @InjectRepository(AttendanceRecord)
    private readonly records: Repository<AttendanceRecord>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(EducationClass)
    private readonly classes: Repository<EducationClass>,
    @InjectRepository(EducationClassEnrollment)
    private readonly enrollments: Repository<EducationClassEnrollment>,
    @InjectRepository(StudyGroup)
    private readonly groups: Repository<StudyGroup>,
    @InjectRepository(StudyGroupMembership)
    private readonly groupMemberships: Repository<StudyGroupMembership>,
    @InjectRepository(DormRoom) private readonly rooms: Repository<DormRoom>,
    @InjectRepository(DormRoomAssignment)
    private readonly roomAssignments: Repository<DormRoomAssignment>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    private readonly access: SchoolAccessService,
    private readonly authorization: AuthorizationService,
    private readonly realtime: RealtimeService,
    private readonly rewards: RewardsService,
    @InjectRepository(AttendanceSupervisorCheck)
    private readonly supervisorChecks?: Repository<AttendanceSupervisorCheck>,
  ) {}

  async authorizeOrganization(user: AuthenticatedUser, organizationId: string) {
    this.assertWorkOrganization(user, organizationId);
    return this.access.organizationForUser(
      this.effectiveUser(user),
      organizationId,
    );
  }

  async authorizeContext(
    user: AuthenticatedUser,
    type: string,
    id: string,
    organizationId: string,
    manage: boolean,
  ) {
    const organization = await this.authorizeOrganization(user, organizationId);
    await this.assertContextAccess(
      user,
      this.context(type),
      id,
      organization.id,
      manage,
    );
    return organization;
  }

  hasSchoolWideScope(user: AuthenticatedUser) {
    return this.schoolWide(user);
  }

  async contextDescriptor(type: string, id: string) {
    const context = this.context(type);
    if (context === "class") {
      const row = await this.classes.findOne({
        where: { id },
        relations: { organization: true },
      });
      if (!row)
        throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
      return {
        organizationId: row.organization.id,
        title: row.name,
        status: row.status,
      };
    }
    if (context === "class_group" || context === "study_group") {
      const row = await this.groups.findOne({
        where: { id },
        relations: { organization: true },
      });
      if (!row)
        throw new ApiException(404, "CLASS_GROUP_NOT_FOUND", "گروه پیدا نشد.");
      return {
        organizationId: row.organization.id,
        title: row.name,
        status: row.status,
      };
    }
    const row = await this.rooms.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!row)
      throw new ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق پیدا نشد.");
    return {
      organizationId: row.organization.id,
      title: row.name,
      status: row.status,
    };
  }

  /** Saved facts are returned without reconstructing historical membership from today's roster. */
  async sessionDetail(
    user: AuthenticatedUser,
    id: string,
  ): Promise<AttendanceSessionDetail> {
    const session = await this.authorizedSavedSession(user, id);
    const records = await this.records.find({
      where: { session: { id } },
      relations: { student: true, recordedBy: true },
      order: { createdAt: "ASC", id: "ASC" },
    });
    const roster = session.rosterSnapshot ?? [];
    const expected = session.rosterSnapshot == null ? null : roster.length;
    // This detail endpoint is read-only until the revision-based writer is installed.
    const canManage = false;
    return {
      id: session.id,
      organizationId: session.organization.id,
      organizationName: session.organization.name,
      contextType:
        session.contextType === "study_group"
          ? "class_group"
          : session.contextType,
      contextId: session.contextId,
      title: session.titleSnapshot || "",
      subjectId: session.subjectIdSnapshot ?? null,
      subjectName: session.subjectNameSnapshot ?? null,
      academicYearId: session.academicYearIdSnapshot ?? null,
      academicYearName: session.academicYearNameSnapshot ?? null,
      termId: session.termIdSnapshot ?? null,
      termName: session.termNameSnapshot ?? null,
      operationalDate: session.operationalDate ?? null,
      sessionDate: session.sessionDate.toISOString(),
      scheduledStartAt: session.scheduledStartAt?.toISOString() ?? null,
      scheduledEndAt: session.scheduledEndAt?.toISOString() ?? null,
      timeZone: session.timeZone,
      sourceKind: session.sourceKind ?? null,
      status: session.status,
      revision: session.revision,
      assignedStaffId: session.assignedStaff?.id ?? null,
      assignedStaffName: session.assignedStaffNameSnapshot || "",
      submittedAt: session.submittedAt?.toISOString() ?? null,
      submittedById: session.submittedBy?.id ?? null,
      roster,
      rosterComplete: expected !== null,
      records: records.map((record) => ({
        id: record.id,
        studentId: record.student.id,
        physicalStatus:
          record.physicalStatus ??
          (record.status === AttendanceStatus.EXCUSED
            ? record.reviewStatus === AttendanceReviewStatus.APPROVED
              ? "absent"
              : "legacy_unknown"
            : record.status),
        legacyStatus: record.status,
        note: record.note,
        revision: record.revision,
        minutesLate: record.minutesLate ?? null,
        arrivalAt: record.arrivalAt?.toISOString() ?? null,
        recordedById: record.recordedBy?.id ?? null,
        recordedByName:
          [record.recordedBy?.firstName, record.recordedBy?.lastName]
            .filter(Boolean)
            .join(" ") ||
          record.recordedBy?.username ||
          "",
        recordedAt: record.updatedAt.toISOString(),
        reviewStatus: record.reviewStatus ?? null,
        reviewNote: record.reviewNote,
        reviewedAt: record.reviewedAt?.toISOString() ?? null,
      })),
      expected,
      marked: records.length,
      unmarked:
        expected === null
          ? null
          : roster.filter(
              (student) =>
                !records.some((record) => record.student.id === student.id),
            ).length,
      canManage,
      canCorrect: false,
    };
  }

  async sessionHistory(user: AuthenticatedUser, id: string) {
    const session = await this.authorizedSavedSession(user, id);
    return this.sessions.manager
      .getRepository(AuditLog)
      .createQueryBuilder("audit")
      .where("audit.organizationId = :organizationId", {
        organizationId: session.organization.id,
      })
      .andWhere("audit.entity = :entity", { entity: "attendance" })
      .andWhere("json_extract(audit.metadata, '$.sessionId') = :id", { id })
      .orderBy("audit.createdAt", "DESC")
      .addOrderBy("audit.id", "DESC")
      .take(100)
      .getMany();
  }

  private async authorizedSavedSession(user: AuthenticatedUser, id: string) {
    if (!user.capabilities?.includes("attendance.read"))
      throw new ApiException(403, "FORBIDDEN", "دسترسی به حضور و غیاب ندارید.");
    const session = await this.sessions.findOne({
      where: { id },
      relations: { organization: true, assignedStaff: true, submittedBy: true },
    });
    if (!session)
      throw new ApiException(
        404,
        "ATTENDANCE_SESSION_NOT_FOUND",
        "جلسه حضور و غیاب پیدا نشد.",
      );
    await this.authorizeOrganization(user, session.organization.id);
    // A stored assignment permits historical retrieval after a timetable change,
    // but does not grant new writes. Verify actual context ownership before this exemption.
    if (session.contextType === "pool") {
      this.assertReviewAccess(user);
      if (!user.capabilities?.includes("attendance.review"))
        throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
      return session;
    }
    const descriptor = await this.contextDescriptor(
      session.contextType,
      session.contextId,
    );
    if (descriptor.organizationId !== session.organization.id)
      throw new ApiException(
        403,
        "ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH",
        "سازمان جلسه با محل حضور و غیاب تطابق ندارد.",
      );
    if (session.assignedStaff?.id !== user.id)
      await this.authorizeContext(
        user,
        session.contextType,
        session.contextId,
        session.organization.id,
        false,
      );
    return session;
  }

  async listContexts(user: AuthenticatedUser, organizationId?: string) {
    const ids = await this.access.scopedOrganizationIds(
      this.effectiveUser(user),
      organizationId || user.activeOrganizationId || undefined,
    );
    if (!ids.length) return [];
    const [classes, groups, rooms] = await Promise.all([
      this.classes.find({
        where: { organization: { id: In(ids) }, status: "ACTIVE" },
        relations: {
          organization: true,
          advisor: true,
          books: { teacher: true },
          enrollments: true,
        },
      }),
      this.groups.find({
        where: { organization: { id: In(ids) }, status: "ACTIVE" },
        relations: {
          organization: true,
          classroom: { advisor: true, books: { teacher: true } },
          memberships: true,
        },
      }),
      this.rooms.find({
        where: { organization: { id: In(ids) }, status: "ACTIVE" },
        relations: { organization: true, assignments: true },
      }),
    ]);
    const schoolWide = this.schoolWide(user);
    const canDorm = this.dormWide(user);
    return [
      ...classes
        .filter(
          (item) =>
            schoolWide ||
            item.advisor?.id === user.id ||
            item.books?.some((book) => book.teacher?.id === user.id),
        )
        .map((item) => ({
          id: item.id,
          contextType: "class" as const,
          code: item.code,
          name: item.name,
          label: `${item.name} (${item.code})`,
          total: item.enrollments?.length ?? 0,
          activeOrganizationId: item.organization.id,
        })),
      ...groups
        .filter(
          (item) =>
            schoolWide ||
            item.classroom?.advisor?.id === user.id ||
            item.classroom?.books?.some((book) => book.teacher?.id === user.id),
        )
        .map((item) => ({
          id: item.id,
          contextType: "class_group" as const,
          classId: item.classroom?.id,
          code: item.code,
          name: item.name,
          label: `${item.name} (${item.code})`,
          total: item.memberships?.length ?? 0,
          activeOrganizationId: item.organization.id,
        })),
      ...(canDorm
        ? rooms.map((item) => ({
            id: item.id,
            contextType: "dorm" as const,
            code: item.code,
            name: item.name,
            label: `${item.name} (${item.code})`,
            total: item.assignments?.length ?? 0,
            activeOrganizationId: item.organization.id,
            building: item.building || "ساختمان اصلی",
            floor: item.floor ?? 1,
          }))
        : []),
    ];
  }

  async listSessions(user: AuthenticatedUser, organizationId?: string) {
    const ids = await this.access.scopedOrganizationIds(
      this.effectiveUser(user),
      organizationId || user.activeOrganizationId || undefined,
    );
    if (!ids.length) return [];
    const allowed = await this.listContexts(
      user,
      organizationId || user.activeOrganizationId || undefined,
    );
    const rows = await this.sessions.find({
      where: { organization: { id: In(ids) } },
      relations: { organization: true, createdBy: true, records: true },
      order: { sessionDate: "DESC" },
    });
    return rows
      .filter(
        (row) =>
          this.schoolWide(user) ||
          allowed.some(
            (context) =>
              context.id === row.contextId &&
              context.contextType ===
                (row.contextType === "study_group"
                  ? "class_group"
                  : row.contextType),
          ),
      )
      .map((row) => {
        const counts = { present: 0, absent: 0, late: 0, excused: 0 };
        for (const record of row.records ?? [])
          counts[record.status as keyof typeof counts] += 1;
        const total = row.records?.length ?? 0;
        return {
          id: row.id,
          organizationId: row.organization.id,
          organizationName: row.organization.name,
          contextType:
            row.contextType === "study_group" ? "class_group" : row.contextType,
          contextId: row.contextId,
          contextLabel: row.titleSnapshot || "",
          sessionDate: row.sessionDate.toISOString(),
          total,
          ...counts,
          remaining:
            row.rosterSnapshot == null
              ? null
              : Math.max(0, row.rosterSnapshot.length - total),
          note: row.note,
          createdById: row.createdBy?.id ?? null,
          createdAt: row.createdAt.toISOString(),
        };
      });
  }

  /** The supervisor queue contains saved class occurrences, never the teacher's live context list. */
  async listSupervisorSessions(user: AuthenticatedUser) {
    this.assertSupervisor(user);
    const ids = await this.access.scopedOrganizationIds(
      this.effectiveUser(user),
      user.activeOrganizationId || undefined,
    );
    if (!ids.length) return [];
    const rows = await this.sessions.find({
      where: {
        organization: { id: In(ids) },
        sourceKind: In(["class_schedule", "legacy_schedule", "legacy_import"]),
      },
      relations: { organization: true, assignedStaff: true, records: true },
      order: { sessionDate: "DESC", id: "DESC" },
      take: 250,
    });
    const checks = await this.checkRepository().find({
      where: { supervisor: { id: user.id } },
      relations: { session: true },
    });
    const ownCheckBySession = new Map(
      checks.map((check) => [check.session.id, check]),
    );
    return rows.map((session) => ({
      id: session.id,
      organizationId: session.organization.id,
      organizationName: session.organization.name,
      classId: session.contextId,
      className: session.titleSnapshot,
      bookName: session.subjectNameSnapshot ?? "",
      teacherName: session.assignedStaffNameSnapshot || "—",
      sessionDate: session.sessionDate.toISOString(),
      status: session.status,
      teacherSubmittedAt: session.submittedAt?.toISOString() ?? null,
      roster: session.rosterSnapshot ?? [],
      ownCheck: ownCheckBySession.has(session.id)
        ? this.supervisorCheckView(ownCheckBySession.get(session.id)!)
        : null,
    }));
  }

  async saveSupervisorCheck(
    user: AuthenticatedUser,
    sessionId: string,
    dto: SaveSupervisorAttendanceCheckDto,
  ) {
    this.assertSupervisor(user);
    const session = await this.sessions.findOne({
      where: {
        id: sessionId,
        sourceKind: In(["class_schedule", "legacy_schedule", "legacy_import"]),
      },
      relations: { organization: true },
    });
    if (!session)
      throw new ApiException(
        404,
        "ATTENDANCE_SESSION_NOT_FOUND",
        "جلسه کلاسی پیدا نشد.",
      );
    await this.authorizeOrganization(user, session.organization.id);
    const roster = new Set(
      (session.rosterSnapshot ?? []).map((student) => student.id),
    );
    if (!roster.size)
      throw new ApiException(
        422,
        "ATTENDANCE_ROSTER_MISSING",
        "فهرست دانش‌آموزان جلسه ثبت نشده است.",
      );
    if (dto.entries.some((entry) => !roster.has(entry.studentId)))
      throw new ApiException(
        422,
        "SUPERVISOR_CHECK_STUDENT_INVALID",
        "فقط دانش‌آموزان همان جلسه قابل ثبت هستند.",
      );
    const repository = this.checkRepository();
    let check = await repository.findOne({
      where: { session: { id: session.id }, supervisor: { id: user.id } },
      relations: { session: true, supervisor: true, organization: true },
    });
    if (
      check &&
      dto.expectedRevision !== undefined &&
      dto.expectedRevision !== check.revision
    )
      throw new ApiException(
        409,
        "SUPERVISOR_CHECK_REVISION_CONFLICT",
        "این بررسی توسط شما تغییر کرده است.",
      );
    const entries: SupervisorAttendanceEntry[] = dto.entries.map((entry) => ({
      studentId: entry.studentId,
      status: entry.status as AttendanceStatus,
      note: entry.note?.trim() ?? "",
    }));
    if (!check) {
      check = repository.create({
        organization: session.organization,
        session,
        supervisor: { id: user.id } as User,
        entries,
        revision: 0,
        submittedAt: new Date(),
      });
    } else {
      check.entries = entries;
      check.revision += 1;
      check.submittedAt = new Date();
    }
    const saved = await repository.save(check);
    return this.supervisorCheckView(saved);
  }

  async listSupervisorComparisons(user: AuthenticatedUser) {
    this.assertReviewAccess(user);
    const roles = user.roles?.length ? user.roles : [user.role];
    if (
      !roles.some((role) =>
        ["PRINCIPAL", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"].includes(role),
      )
    )
      throw new ApiException(
        403,
        "SUPERVISOR_COMPARISONS_PRINCIPAL_ONLY",
        "تطبیق حضور استاد و ناظر فقط برای مدیر مدرسه در دسترس است.",
      );
    const ids = await this.access.scopedOrganizationIds(
      this.effectiveUser(user),
      user.activeOrganizationId || undefined,
    );
    if (!ids.length) return [];
    const sessions = await this.sessions.find({
      where: {
        organization: { id: In(ids) },
        sourceKind: In(["class_schedule", "legacy_schedule", "legacy_import"]),
      },
      relations: {
        organization: true,
        assignedStaff: true,
        records: { student: true },
      },
      order: { sessionDate: "DESC", id: "DESC" },
      take: 250,
    });
    const checks = await this.checkRepository().find({
      where: { organization: { id: In(ids) } },
      relations: { session: true, supervisor: true },
      order: { updatedAt: "DESC" },
    });
    const checksBySession = new Map<string, AttendanceSupervisorCheck[]>();
    for (const check of checks)
      checksBySession.set(check.session.id, [
        ...(checksBySession.get(check.session.id) ?? []),
        check,
      ]);
    return sessions.map((session) => {
      const teacher = new Map(
        session.records.map((record) => [record.student.id, record.status]),
      );
      const sessionChecks = checksBySession.get(session.id) ?? [];
      const comparisons = sessionChecks.map((check) => {
        const observed = new Map(
          check.entries.map((entry) => [entry.studentId, entry.status]),
        );
        const mismatches = [...observed]
          .filter(([studentId, status]) => teacher.get(studentId) !== status)
          .map(([studentId, status]) => ({
            studentId,
            teacherStatus: teacher.get(studentId) ?? null,
            supervisorStatus: status,
          }));
        return {
          ...this.supervisorCheckView(check),
          mismatchCount: mismatches.length,
          mismatches,
        };
      });
      const comparisonStatus = !session.submittedAt
        ? "teacher_missing"
        : !comparisons.length
          ? "supervisor_missing"
          : comparisons.some((check) => check.mismatchCount > 0)
            ? "mismatch"
            : "matched";
      return {
        sessionId: session.id,
        organizationName: session.organization.name,
        className: session.titleSnapshot,
        bookName: session.subjectNameSnapshot ?? "",
        teacherName: session.assignedStaffNameSnapshot || "—",
        sessionDate: session.sessionDate.toISOString(),
        comparisonStatus,
        teacherRecordCount: teacher.size,
        roster: session.rosterSnapshot ?? [],
        supervisorChecks: comparisons,
      };
    });
  }

  async paginatedSessions(
    user: AuthenticatedUser,
    query: AttendanceHistoryQueryDto,
  ) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const ids = await this.access.scopedOrganizationIds(
      this.effectiveUser(user),
      query.organizationId || user.activeOrganizationId || undefined,
    );
    if (!ids.length)
      return { items: [], page, limit, total: 0, hasNext: false };
    const allowed = await this.listContexts(
      user,
      query.organizationId || user.activeOrganizationId || undefined,
    );
    const schoolWide = this.schoolWide(user);
    const filteredAllowed = allowed.filter(
      (context) =>
        (!query.contextType || context.contextType === query.contextType) &&
        (!query.contextId || context.id === query.contextId),
    );
    if (!schoolWide && !filteredAllowed.length)
      return { items: [], page, limit, total: 0, hasNext: false };
    const sessionDate = query.from
      ? query.to
        ? Between(new Date(query.from), new Date(query.to))
        : MoreThanOrEqual(new Date(query.from))
      : query.to
        ? LessThanOrEqual(new Date(query.to))
        : undefined;
    const where = schoolWide
      ? {
          organization: { id: In(ids) },
          ...(query.contextType ? { contextType: query.contextType } : {}),
          ...(query.contextId ? { contextId: query.contextId } : {}),
          ...(query.subjectId ? { subjectIdSnapshot: query.subjectId } : {}),
          ...(query.academicYearId
            ? { academicYearIdSnapshot: query.academicYearId }
            : {}),
          ...(query.termId ? { termIdSnapshot: query.termId } : {}),
          ...(sessionDate ? { sessionDate } : {}),
        }
      : filteredAllowed.flatMap((context) =>
          (context.contextType === "class_group"
            ? (["class_group", "study_group"] as const)
            : [context.contextType]
          ).map((contextType) => ({
            organization: { id: In(ids) },
            contextType,
            contextId: context.id,
            ...(query.subjectId ? { subjectIdSnapshot: query.subjectId } : {}),
            ...(query.academicYearId
              ? { academicYearIdSnapshot: query.academicYearId }
              : {}),
            ...(query.termId ? { termIdSnapshot: query.termId } : {}),
            ...(sessionDate ? { sessionDate } : {}),
          })),
        );
    const [rows, total] = await this.sessions.findAndCount({
      where,
      relations: { organization: true, records: true, assignedStaff: true },
      order: { sessionDate: "DESC", id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    const items = rows.map((row) => ({
      id: row.id,
      organizationId: row.organization.id,
      contextType:
        row.contextType === "study_group" ? "class_group" : row.contextType,
      contextId: row.contextId,
      title: row.titleSnapshot,
      teacherName:
        row.assignedStaffNameSnapshot ||
        [row.assignedStaff?.firstName, row.assignedStaff?.lastName]
          .filter(Boolean)
          .join(" ") ||
        row.assignedStaff?.username ||
        null,
      subjectId: row.subjectIdSnapshot ?? null,
      subjectName: row.subjectNameSnapshot ?? null,
      status: row.status,
      revision: row.revision,
      academicYearId: row.academicYearIdSnapshot ?? null,
      academicYearName: row.academicYearNameSnapshot ?? null,
      termId: row.termIdSnapshot ?? null,
      termName: row.termNameSnapshot ?? null,
      sessionDate: row.sessionDate.toISOString(),
      marked: row.records.length,
      expected: row.rosterSnapshot?.length ?? null,
      present: row.records.filter((record) => record.status === "present")
        .length,
      absent: row.records.filter((record) => record.status === "absent").length,
      late: row.records.filter((record) => record.status === "late").length,
      excused: row.records.filter((record) => record.status === "excused")
        .length,
      unmarked:
        row.rosterSnapshot?.length == null
          ? null
          : Math.max(0, row.rosterSnapshot.length - row.records.length),
    }));
    return {
      items,
      page,
      limit,
      total,
      hasNext: page * limit < total,
    };
  }

  /** Schedule owns occurrence identity; attendance owns roster and historical snapshots. */
  async openLegacyScheduleSession(
    user: AuthenticatedUser,
    dto: OpenLegacyScheduleAttendanceDto,
  ) {
    const entry = await this.sessions.manager
      .getRepository(SchoolScheduleEntry)
      .findOne({
        where: { id: dto.entryId, status: "ACTIVE" },
        relations: {
          organization: true,
          classroom: true,
          teacher: true,
          classBook: { book: true, teacher: true },
        },
      });
    if (
      !entry?.organization ||
      !entry.classroom ||
      !entry.termId ||
      !entry.academicYearId
    )
      throw new ApiException(
        422,
        "ATTENDANCE_LEGACY_SCHEDULE_SCOPE",
        "جلسهٔ برنامه باید کلاس، سال و نیم‌سال فعال داشته باشد.",
      );
    const organizationId = entry.organization.id;
    this.assertWorkOrganization(user, organizationId);
    const teacherId = entry.teacher?.id ?? entry.classBook?.teacher?.id ?? null;
    const isAssignedTeacher =
      teacherId === user.id &&
      user.capabilities?.includes("attendance.class.manage");
    if (!isAssignedTeacher)
      await this.assertContextAccess(
        user,
        "class",
        entry.classroom.id,
        organizationId,
        true,
      );
    const year = await this.sessions.manager
      .getRepository(SchoolAcademicYear)
      .findOneBy({ id: entry.academicYearId, organizationId });
    const term = await this.sessions.manager
      .getRepository(SchoolAcademicTerm)
      .findOneBy({ id: entry.termId, academicYearId: entry.academicYearId });
    if (
      !year ||
      !term ||
      year.state === "ARCHIVED" ||
      term.state === "ARCHIVED" ||
      term.correctionOpen
    )
      throw new ApiException(
        409,
        "ATTENDANCE_TERM_LOCKED",
        "نیم‌سال انتخاب‌شده برای ثبت جلسهٔ جدید باز نیست.",
      );
    if (dto.date < term.startsOn || dto.date > term.endsOn)
      throw new ApiException(
        422,
        "ATTENDANCE_TERM_DATE",
        "تاریخ جلسه خارج از نیم‌سال است.",
      );
    const weekday = (new Date(`${dto.date}T12:00:00Z`).getUTCDay() + 1) % 7;
    if (weekday !== entry.weekday)
      throw new ApiException(
        422,
        "ATTENDANCE_LEGACY_WEEKDAY",
        "تاریخ انتخاب‌شده با روز این جلسه هماهنگ نیست.",
      );
    const occurrenceKey = `legacy-schedule:${entry.id}:${dto.date}`;
    const existing = await this.sessions.findOne({
      where: { organization: { id: organizationId }, occurrenceKey },
    });
    if (existing)
      return { id: existing.id, revision: existing.revision, duplicate: true };
    const roster = await this.listParticipants(
      user,
      "class",
      entry.classroom.id,
    );
    const startsAt = new Date(`${dto.date}T${entry.startTime}:00.000Z`);
    const endsAt = new Date(`${dto.date}T${entry.endTime}:00.000Z`);
    const row = await this.sessions.save(
      this.sessions.create({
        organization: entry.organization,
        contextType: "class",
        contextId: entry.classroom.id,
        sessionDate: startsAt,
        operationalDate: dto.date,
        scheduledStartAt: startsAt,
        scheduledEndAt: endsAt,
        timeZone: "Asia/Tehran",
        occurrenceKey,
        sourceKind: "legacy_schedule",
        sourceScheduleId: entry.id,
        titleSnapshot: entry.title,
        subjectIdSnapshot: entry.classBook?.book?.id ?? null,
        subjectNameSnapshot: entry.classBook?.book?.titleFa ?? null,
        academicYearIdSnapshot: year.id,
        academicYearNameSnapshot: year.name,
        termIdSnapshot: term.id,
        termNameSnapshot: term.name,
        assignedStaff: teacherId ? ({ id: teacherId } as User) : null,
        assignedStaffNameSnapshot:
          [entry.teacher?.firstName, entry.teacher?.lastName]
            .filter(Boolean)
            .join(" ") ||
          entry.teacher?.username ||
          [
            entry.classBook?.teacher?.firstName,
            entry.classBook?.teacher?.lastName,
          ]
            .filter(Boolean)
            .join(" ") ||
          entry.classBook?.teacher?.username ||
          "",
        rosterSnapshot: roster.map((member) => ({
          id: member.id,
          name: member.name,
          nationalCode: member.nationalCode ?? null,
          userId: member.userId,
        })),
        rosterCapturedAt: new Date(),
        createdBy: { id: user.id } as User,
        note: `جلسه برنامه legacy · ${dto.date}`,
      }),
    );
    await this.sessions.manager.getRepository(AuditLog).save({
      user: { id: user.id } as User,
      organizationId,
      action: "attendance.legacy_occurrence.created",
      entity: "attendance",
      metadata: {
        sessionId: row.id,
        entryId: entry.id,
        occurrenceKey,
        academicYearId: year.id,
        termId: term.id,
        date: dto.date,
      },
    });
    return { id: row.id, revision: row.revision, duplicate: false };
  }

  async createHistoricalSession(
    user: AuthenticatedUser,
    dto: CreateHistoricalAttendanceSessionDto,
  ) {
    const roles = user.roles?.length ? user.roles : [user.role];
    if (
      !roles.some((role) =>
        [
          "PRINCIPAL",
          "RELIGIOUS_EDUCATION_MANAGER",
          "ORGANIZATION_ADMIN",
          "PLATFORM_ADMIN",
        ].includes(role),
      )
    )
      throw new ApiException(
        403,
        "ATTENDANCE_HISTORICAL_FORBIDDEN",
        "ورود حضور گذشته فقط برای مدیر و مسئول آموزش دینی مجاز است.",
      );
    this.assertWorkOrganization(user, dto.organizationId);
    const organization = await this.access.organizationForUser(
      this.effectiveUser(user),
      dto.organizationId,
    );
    const year = await this.sessions.manager
      .getRepository(SchoolAcademicYear)
      .findOneBy({ id: dto.academicYearId, organizationId: organization.id });
    const term = await this.sessions.manager
      .getRepository(SchoolAcademicTerm)
      .findOneBy({ id: dto.termId, academicYearId: dto.academicYearId });
    if (!year || !term || dto.date < term.startsOn || dto.date > term.endsOn)
      throw new ApiException(
        422,
        "ATTENDANCE_HISTORICAL_TERM",
        "سال، نیم‌سال و تاریخ جلسه تاریخی باید با هم سازگار باشند.",
      );
    if (term.state === "ARCHIVED" || term.correctionOpen)
      throw new ApiException(
        409,
        "ATTENDANCE_TERM_ARCHIVED",
        "نیم‌سال بایگانی‌شده یا بازگشایی‌شده برای اصلاح، جلسهٔ جدید نمی‌پذیرد.",
      );
    const classroom = await this.classes.findOne({
      where: { id: dto.classroomId, organization: { id: organization.id } },
    });
    if (!classroom)
      throw new ApiException(
        404,
        "ATTENDANCE_CONTEXT_NOT_FOUND",
        "کلاس در مدرسه فعال پیدا نشد.",
      );
    const teacherMembership = await this.memberships.findOne({
      where: {
        organization: { id: organization.id },
        user: { id: dto.teacherId },
        status: MembershipStatus.ACTIVE,
      },
    });
    if (!teacherMembership)
      throw new ApiException(
        422,
        "ATTENDANCE_HISTORICAL_TEACHER",
        "استاد انتخاب‌شده عضو فعال این مدرسه نیست.",
      );
    const book = await this.sessions.manager
      .getRepository(EducationBook)
      .findOneBy({ id: dto.subjectId });
    if (!book)
      throw new ApiException(
        422,
        "ATTENDANCE_HISTORICAL_BOOK",
        "کتاب انتخاب‌شده پیدا نشد.",
      );
    const key = `legacy-import:${dto.classroomId}:${dto.subjectId}:${dto.date}:${dto.title.trim()}`;
    const existing = await this.sessions.findOne({
      where: { organization: { id: organization.id }, occurrenceKey: key },
    });
    if (existing)
      return { id: existing.id, revision: existing.revision, duplicate: true };
    const roster = await this.listParticipants(user, "class", classroom.id);
    const row = await this.sessions.save(
      this.sessions.create({
        organization,
        contextType: "class",
        contextId: classroom.id,
        sessionDate: new Date(`${dto.date}T12:00:00.000Z`),
        operationalDate: dto.date,
        occurrenceKey: key,
        sourceKind: "legacy_import",
        historicalImportReason: dto.reason.trim(),
        titleSnapshot: dto.title.trim(),
        subjectIdSnapshot: book.id,
        subjectNameSnapshot: book.titleFa,
        academicYearIdSnapshot: year.id,
        academicYearNameSnapshot: year.name,
        termIdSnapshot: term.id,
        termNameSnapshot: term.name,
        assignedStaff: { id: dto.teacherId } as User,
        assignedStaffNameSnapshot: "",
        rosterSnapshot: roster.map((member) => ({
          id: member.id,
          name: member.name,
          nationalCode: member.nationalCode ?? null,
          userId: member.userId,
        })),
        rosterCapturedAt: new Date(),
        createdBy: { id: user.id } as User,
        note: dto.reason.trim(),
      }),
    );
    await this.sessions.manager.getRepository(AuditLog).save({
      user: { id: user.id } as User,
      organizationId: organization.id,
      action: "attendance.historical_session.created",
      entity: "attendance",
      metadata: {
        sessionId: row.id,
        sourceKind: row.sourceKind,
        academicYearId: year.id,
        termId: term.id,
        classroomId: classroom.id,
        teacherId: dto.teacherId,
        bookId: book.id,
        reason: dto.reason.trim(),
      },
    });
    return { id: row.id, revision: row.revision, duplicate: false };
  }

  private async assertAcademicSessionWritable(
    manager: EntityManager,
    session: AttendanceSession | null,
  ) {
    if (!session?.academicYearIdSnapshot || !session.termIdSnapshot) return;
    const term = await manager.getRepository(SchoolAcademicTerm).findOneBy({
      id: session.termIdSnapshot,
      academicYearId: session.academicYearIdSnapshot,
    });
    if (!term || (term.state === "ARCHIVED" && !term.correctionOpen))
      throw new ApiException(
        409,
        "ATTENDANCE_TERM_ARCHIVED",
        "نیم‌سال بایگانی‌شده فقط خواندنی است؛ ابتدا آن را برای اصلاح تاریخی بازگشایی کنید.",
      );
  }

  /**
   * Suggests, but never creates, missed legacy schedule occurrences.  A manager
   * must explicitly open each candidate through the normal occurrence endpoint.
   */
  async historicalCandidates(
    user: AuthenticatedUser,
    query: HistoricalAttendanceCandidatesQueryDto,
  ) {
    const roles = user.roles?.length ? user.roles : [user.role];
    if (
      !roles.some((role) =>
        [
          "PRINCIPAL",
          "RELIGIOUS_EDUCATION_MANAGER",
          "ORGANIZATION_ADMIN",
          "PLATFORM_ADMIN",
        ].includes(role),
      )
    )
      throw new ApiException(
        403,
        "ATTENDANCE_HISTORICAL_FORBIDDEN",
        "تطبیق حضور گذشته فقط برای مدیر و مسئول آموزش دینی مجاز است.",
      );
    this.assertWorkOrganization(user, query.organizationId);
    const year = await this.sessions.manager
      .getRepository(SchoolAcademicYear)
      .findOneBy({
        id: query.academicYearId,
        organizationId: query.organizationId,
      });
    const term = await this.sessions.manager
      .getRepository(SchoolAcademicTerm)
      .findOneBy({ id: query.termId, academicYearId: query.academicYearId });
    if (!year || !term)
      throw new ApiException(
        422,
        "ATTENDANCE_HISTORICAL_TERM",
        "سال و نیم‌سال انتخاب‌شده با مدرسه سازگار نیست.",
      );
    const today = new Date().toISOString().slice(0, 10);
    const from = [term.startsOn, query.from].filter(Boolean).sort().at(-1)!;
    const to = [term.endsOn, query.to, today].filter(Boolean).sort()[0]!;
    if (from > to) return [];
    const entries = await this.sessions.manager
      .getRepository(SchoolScheduleEntry)
      .find({
        where: {
          organization: { id: query.organizationId },
          academicYearId: query.academicYearId,
          termId: query.termId,
          status: "ACTIVE",
          ...(query.classroomId
            ? { classroom: { id: query.classroomId } }
            : {}),
        },
        relations: {
          classroom: true,
          teacher: true,
          classBook: { book: true, teacher: true },
        },
      });
    const candidates: Array<{
      entryId: string;
      date: string;
      title: string;
      classroomId: string;
      classroomName: string;
      teacherName: string;
      subjectName: string | null;
      startTime: string;
      endTime: string;
    }> = [];
    for (const entry of entries) {
      if (!entry.classroom) continue;
      const start =
        entry.startsOn && entry.startsOn > from ? entry.startsOn : from;
      const end = entry.endsOn && entry.endsOn < to ? entry.endsOn : to;
      for (
        let cursor = new Date(`${start}T12:00:00Z`);
        cursor <= new Date(`${end}T12:00:00Z`);
        cursor.setUTCDate(cursor.getUTCDate() + 1)
      ) {
        const date = cursor.toISOString().slice(0, 10);
        if ((cursor.getUTCDay() + 1) % 7 !== entry.weekday) continue;
        candidates.push({
          entryId: entry.id,
          date,
          title: entry.title,
          classroomId: entry.classroom.id,
          classroomName: entry.classroom.name,
          teacherName:
            entry.teacherNameSnapshot ||
            [entry.teacher?.firstName, entry.teacher?.lastName]
              .filter(Boolean)
              .join(" ") ||
            entry.teacher?.username ||
            [
              entry.classBook?.teacher?.firstName,
              entry.classBook?.teacher?.lastName,
            ]
              .filter(Boolean)
              .join(" ") ||
            entry.classBook?.teacher?.username ||
            "استاد ثبت نشده",
          subjectName: entry.classBook?.book?.titleFa ?? null,
          startTime: entry.startTime,
          endTime: entry.endTime,
        });
      }
    }
    if (!candidates.length) return [];
    const existing = await this.sessions.find({
      where: {
        organization: { id: query.organizationId },
        occurrenceKey: In(
          candidates.map(
            (candidate) =>
              `legacy-schedule:${candidate.entryId}:${candidate.date}`,
          ),
        ),
      },
      select: { occurrenceKey: true },
    });
    const saved = new Set(existing.map((session) => session.occurrenceKey));
    return candidates
      .filter(
        (candidate) =>
          !saved.has(`legacy-schedule:${candidate.entryId}:${candidate.date}`),
      )
      .sort(
        (left, right) =>
          left.date.localeCompare(right.date) ||
          left.startTime.localeCompare(right.startTime),
      )
      .slice(0, 500);
  }

  async createTimetableSession(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      classroomId: string;
      lessonId: string;
      date: string;
      title: string;
      subjectId?: string | null;
      subjectName?: string | null;
      academicYearId?: string | null;
      academicYearName?: string | null;
      termId?: string | null;
      termName?: string | null;
      startsAt: string;
      endsAt: string;
      timeZone: string;
      teacherId: string | null;
    },
  ) {
    await this.access.organizationForUser(
      this.effectiveUser(user),
      input.organizationId,
    );
    this.assertWorkOrganization(user, input.organizationId);
    const descriptor = await this.contextDescriptor("class", input.classroomId);
    if (descriptor.organizationId !== input.organizationId)
      throw new ApiException(
        403,
        "ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH",
        "کلاس متعلق به این مدرسه نیست.",
      );
    // This internal port receives a published occurrence from the schedule owner, never a client-supplied teacher assignment.
    const assignedTeacher =
      input.teacherId === user.id &&
      user.capabilities?.includes("attendance.class.manage");
    if (!assignedTeacher)
      await this.assertContextAccess(
        user,
        "class",
        input.classroomId,
        input.organizationId,
        true,
      );
    const enrollments = await this.enrollments.find({
      where: {
        classroom: { id: input.classroomId },
        student: {
          organization: { id: input.organizationId },
          accountStatus: "active",
        },
      },
      relations: { student: { user: true } },
    });
    const created = await this.sessions.save(
      this.sessions.create({
        organization: { id: input.organizationId },
        contextType: "class",
        contextId: input.classroomId,
        sessionDate: new Date(),
        note: `${input.title} / ${input.date}`,
        titleSnapshot: input.title,
        subjectIdSnapshot: input.subjectId ?? null,
        subjectNameSnapshot: input.subjectName ?? null,
        academicYearIdSnapshot: input.academicYearId ?? null,
        academicYearNameSnapshot: input.academicYearName ?? null,
        termIdSnapshot: input.termId ?? null,
        termNameSnapshot: input.termName ?? null,
        rosterSnapshot: enrollments.map(({ student }) => ({
          id: student.id,
          name: student.name,
          nationalCode: student.nationalCode ?? null,
          userId: student.user?.id ?? null,
        })),
        rosterCapturedAt: new Date(),
        createdBy: { id: user.id },
      }),
    );
    await this.sessions.update(
      { id: created.id },
      {
        sourceKind: "class_schedule",
        sourceScheduleId: input.lessonId,
        titleSnapshot: input.title,
        subjectIdSnapshot: input.subjectId ?? null,
        subjectNameSnapshot: input.subjectName ?? null,
        academicYearIdSnapshot: input.academicYearId ?? null,
        academicYearNameSnapshot: input.academicYearName ?? null,
        termIdSnapshot: input.termId ?? null,
        termNameSnapshot: input.termName ?? null,
        scheduledStartAt: new Date(input.startsAt),
        scheduledEndAt: new Date(input.endsAt),
        timeZone: input.timeZone,
        operationalDate: input.date,
        assignedStaff: input.teacherId ? { id: input.teacherId } : null,
      },
    );
    return { id: created.id };
  }
  /** Caller transaction owns atomicity; submitted observations require explicit correction. */
  async applyTimetableChange(
    manager: EntityManager,
    sessionId: string,
    lessonId: string,
    input: {
      cancelled: boolean;
      teacherId: string | null;
      startsAt: string;
      endsAt: string;
      reason: string;
    },
    actor: AuthenticatedUser,
  ) {
    const session = await manager.findOne(AttendanceSession, {
      where: {
        id: sessionId,
        sourceKind: "class_schedule",
        sourceScheduleId: lessonId,
      },
      relations: { assignedStaff: true, organization: true },
    });
    if (!session)
      throw new ApiException(
        409,
        "ATTENDANCE_SOURCE_MISMATCH",
        "جلسه با وقوع درس یکسان نیست.",
      );
    const changed =
      session.assignedStaff?.id !== input.teacherId ||
      session.scheduledStartAt?.toISOString() !== input.startsAt ||
      session.scheduledEndAt?.toISOString() !== input.endsAt;
    const observed = await manager.exists(AttendanceRecord, {
      where: { session: { id: sessionId } },
    });
    if (changed && observed)
      throw new ApiException(
        409,
        "ATTENDANCE_CORRECTION_REQUIRED",
        "سوابق ثبت‌شده به اصلاح صریح حضور نیاز دارند.",
      );
    const before = {
      status: session.status,
      teacherId: session.assignedStaff?.id ?? null,
      startsAt: session.scheduledStartAt?.toISOString(),
      endsAt: session.scheduledEndAt?.toISOString(),
    };
    session.assignedStaff = input.teacherId
      ? ({ id: input.teacherId } as User)
      : null;
    session.scheduledStartAt = new Date(input.startsAt);
    session.scheduledEndAt = new Date(input.endsAt);
    session.status = input.cancelled
      ? "cancelled"
      : session.status === "cancelled"
        ? observed
          ? "submitted"
          : "open"
        : session.status;
    session.revision++;
    await manager.save(session);
    await manager.save(
      AuditLog,
      manager.create(AuditLog, {
        user: { id: actor.id },
        organizationId: session.organization.id,
        action: "attendance.timetable.changed",
        entity: "attendance",
        metadata: {
          sessionId,
          lessonId,
          before,
          after: {
            status: session.status,
            teacherId: input.teacherId,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
          },
          reason: input.reason,
        },
      }),
    );
  }
  async reassignTimetableSession(
    sessionId: string,
    lessonId: string,
    teacherId: string,
  ) {
    await this.sessions.update(
      {
        id: sessionId,
        sourceKind: "class_schedule",
        sourceScheduleId: lessonId,
      },
      { assignedStaff: { id: teacherId } },
    );
  }
  async cancelTimetableSession(sessionId: string, lessonId: string) {
    await this.sessions.update(
      {
        id: sessionId,
        sourceKind: "class_schedule",
        sourceScheduleId: lessonId,
      },
      { status: "cancelled" },
    );
  }

  async createSession(
    user: AuthenticatedUser,
    dto: CreateAttendanceSessionDto,
  ) {
    const organization = await this.access.organizationForUser(
      this.effectiveUser(user),
      dto.organizationId,
    );
    await this.assertContextAccess(
      user,
      dto.contextType,
      dto.contextId,
      organization.id,
      true,
    );
    const descriptor = await this.contextDescriptor(
      dto.contextType,
      dto.contextId,
    );
    const roster = await this.listParticipants(
      user,
      dto.contextType,
      dto.contextId,
    );
    const date = new Date(dto.sessionDate);
    const row = await this.sessions.save(
      this.sessions.create({
        organization,
        contextType: dto.contextType,
        contextId: dto.contextId,
        sessionDate: date,
        titleSnapshot: descriptor.title,
        rosterSnapshot: roster.map((member) => ({
          id: member.id,
          name: member.name,
          nationalCode: member.nationalCode ?? null,
          userId: member.userId,
        })),
        rosterCapturedAt: new Date(),
        note: dto.note?.trim() || "",
        createdBy: { id: user.id } as User,
      }),
    );
    return {
      id: row.id,
      organizationId: organization.id,
      contextType: row.contextType,
      contextId: row.contextId,
      sessionDate: row.sessionDate.toISOString(),
      note: row.note,
    };
  }

  async submitAbsences(
    user: AuthenticatedUser,
    sessionId: string,
    dto: SubmitAttendanceAbsencesDto,
  ) {
    const absent = new Set(dto.absentStudentIds);
    const late = new Set(dto.lateStudentIds ?? []);
    if ([...absent].some((studentId) => late.has(studentId)))
      throw new ApiException(
        422,
        "ATTENDANCE_STATUS_CONFLICT",
        "یک طلبه نمی‌تواند هم‌زمان غایب و دیرآمده باشد.",
      );
    const session = await this.sessions.findOne({
      where: { id: sessionId },
      relations: { organization: true, assignedStaff: true },
    });
    if (!session)
      throw new ApiException(
        404,
        "ATTENDANCE_SESSION_NOT_FOUND",
        "جلسه حضور و غیاب پیدا نشد.",
      );
    if (!session.rosterSnapshot)
      throw new ApiException(
        409,
        "ATTENDANCE_ROSTER_SNAPSHOT_REQUIRED",
        "فهرست قطعی جلسه موجود نیست؛ ثبت غایب‌محور ممکن نیست.",
      );
    const assignedTimetableTeacher =
      session.sourceKind === "class_schedule" &&
      session.assignedStaff?.id === user.id &&
      user.capabilities?.includes("attendance.class.manage");
    if (
      session.status === "cancelled" ||
      (session.status === "finalized" && !assignedTimetableTeacher)
    )
      throw new ApiException(
        409,
        "ATTENDANCE_SESSION_LOCKED",
        "این جلسه لغو یا نهایی شده است.",
      );
    const roster = new Set(session.rosterSnapshot.map((member) => member.id));
    if ([...absent, ...late].some((studentId) => !roster.has(studentId)))
      throw new ApiException(
        422,
        "ATTENDANCE_STUDENT_NOT_IN_SESSION",
        "یک یا چند طلبه در فهرست قطعی این جلسه نیستند.",
      );
    return this.bulkMark(
      user,
      {
        organizationId: session.organization.id,
        sessionId,
        requestId: dto.requestId,
        expectedRevision: dto.expectedRevision,
        entries: session.rosterSnapshot.map((member) => ({
          studentId: member.id,
          status: absent.has(member.id)
            ? "absent"
            : late.has(member.id)
              ? "late"
              : "present",
        })),
      },
      { allowOccurrence: true, allowHistoricalOccurrence: true, submit: true },
    );
  }

  async policy(user: AuthenticatedUser, requestedOrganizationId?: string) {
    if (!user.capabilities?.includes("attendance.settings.manage"))
      throw new ApiException(
        403,
        "FORBIDDEN",
        "دسترسی تنظیمات حضور و غیاب ندارید.",
      );
    const organizationId = requestedOrganizationId || user.activeOrganizationId;
    if (!organizationId)
      throw new ApiException(
        422,
        "ATTENDANCE_ORGANIZATION_REQUIRED",
        "مدرسه فعال را انتخاب کنید.",
      );
    await this.authorizeOrganization(user, organizationId);
    const policy = await this.sessions.manager
      .getRepository(AttendancePolicy)
      .findOne({
        where: { organization: { id: organizationId } },
        relations: { organization: true },
      });
    return {
      organizationId,
      timeZone: policy?.timeZone ?? "Asia/Tehran",
      dayStartsAt: policy?.dayStartsAt ?? "04:00",
      allowPartialSubmission: policy?.allowPartialSubmission ?? true,
      lateCountsAsPresent: policy?.lateCountsAsPresent ?? true,
      correctionRequiresReview: policy?.correctionRequiresReview ?? false,
      principalReviewMode:
        policy?.principalReviewMode === "all_sessions"
          ? "all_sessions"
          : "absences_only",
    };
  }

  async updatePolicy(user: AuthenticatedUser, dto: UpdateAttendancePolicyDto) {
    if (!user.capabilities?.includes("attendance.settings.manage"))
      throw new ApiException(
        403,
        "FORBIDDEN",
        "دسترسی تنظیمات حضور و غیاب ندارید.",
      );
    await this.authorizeOrganization(user, dto.organizationId);
    if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(dto.dayStartsAt))
      throw new ApiException(
        422,
        "ATTENDANCE_POLICY_DAY_START",
        "زمان شروع روز معتبر نیست.",
      );
    const result = await this.attendanceTransaction(async (manager) => {
      const repo = manager.getRepository(AttendancePolicy);
      const existing = await repo.findOne({
        where: { organization: { id: dto.organizationId } },
      });
      const saved = await repo.save(
        repo.create({
          id: existing?.id,
          organization: { id: dto.organizationId },
          timeZone: dto.timeZone.trim(),
          dayStartsAt: dto.dayStartsAt,
          allowPartialSubmission: dto.allowPartialSubmission,
          lateCountsAsPresent: dto.lateCountsAsPresent,
          correctionRequiresReview:
            dto.correctionRequiresReview ??
            existing?.correctionRequiresReview ??
            false,
          principalReviewMode:
            dto.principalReviewMode ??
            (existing?.principalReviewMode === "all_sessions"
              ? "all_sessions"
              : "absences_only"),
        }),
      );
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: user.id },
          action: "attendance.policy.updated",
          entity: "attendance",
          organizationId: dto.organizationId,
          metadata: { before: existing ?? null, after: dto },
        }),
      );
      return saved;
    });
    return {
      organizationId: dto.organizationId,
      timeZone: result.timeZone,
      dayStartsAt: result.dayStartsAt,
      allowPartialSubmission: result.allowPartialSubmission,
      lateCountsAsPresent: result.lateCountsAsPresent,
      correctionRequiresReview: result.correctionRequiresReview,
      principalReviewMode: result.principalReviewMode,
    };
  }

  async finalizeSession(
    user: AuthenticatedUser,
    sessionId: string,
    dto: FinalizeAttendanceSessionDto,
  ) {
    this.assertReviewAccess(user);
    return this.attendanceTransaction(async (manager) => {
      const session = await manager.getRepository(AttendanceSession).findOne({
        where: { id: sessionId },
        relations: { organization: true },
      });
      if (!session)
        throw new ApiException(
          404,
          "ATTENDANCE_SESSION_NOT_FOUND",
          "جلسه حضور و غیاب پیدا نشد.",
        );
      await this.authorizeContext(
        user,
        session.contextType,
        session.contextId,
        session.organization.id,
        true,
      );
      if (session.status === "finalized")
        return {
          sessionId: session.id,
          revision: session.revision,
          status: session.status,
        };
      if (session.status !== "submitted")
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_NOT_SUBMITTED",
          "فقط جلسه ثبت‌شده قابل نهایی‌سازی است.",
        );
      if (session.revision !== dto.expectedRevision)
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_STALE",
          "نسخه جلسه تغییر کرده است؛ دوباره بارگذاری کنید.",
        );
      session.status = "finalized";
      session.revision++;
      await manager.save(session);
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: user.id },
          action: "attendance.session.finalized",
          entity: "attendance",
          organizationId: session.organization.id,
          metadata: {
            sessionId,
            requestId: dto.requestId,
            revision: session.revision,
          },
        }),
      );
      return {
        sessionId: session.id,
        revision: session.revision,
        status: session.status,
      };
    });
  }

  async reviewSessionEvery24Hours(user: AuthenticatedUser, sessionId: string) {
    if (!user.capabilities?.includes("attendance.review"))
      throw new ApiException(
        403,
        "FORBIDDEN",
        "برای بازبینی روزانهٔ حضور دسترسی attendance.review لازم است.",
      );
    return this.attendanceTransaction(async (manager) => {
      const session = await manager.getRepository(AttendanceSession).findOne({
        where: { id: sessionId },
        relations: { organization: true },
      });
      if (!session)
        throw new ApiException(
          404,
          "ATTENDANCE_SESSION_NOT_FOUND",
          "جلسه حضور و غیاب پیدا نشد.",
        );
      await this.authorizeContext(
        user,
        session.contextType,
        session.contextId,
        session.organization.id,
        true,
      );
      if (session.status !== "submitted" && session.status !== "finalized")
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_NOT_REVIEWABLE",
          "فقط جلسه ثبت‌شده قابل بازبینی است.",
        );

      const reviewedAt = new Date();
      await manager.query(
        "INSERT INTO attendance_session_reviews(id,sessionId,reviewerId,reviewedRevision,reviewedAt) VALUES(?,?,?,?,?)",
        [
          randomUUID(),
          session.id,
          user.id,
          session.revision,
          reviewedAt.toISOString(),
        ],
      );
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: user.id },
          action: "attendance.session.daily-reviewed",
          entity: "attendance",
          organizationId: session.organization.id,
          metadata: { sessionId: session.id, status: session.status },
        }),
      );
      return { sessionId: session.id, reviewedAt: reviewedAt.toISOString() };
    });
  }

  /**
   * Cancellation is a terminal, revisioned lifecycle transition for sessions
   * without observations.  It deliberately retains the session and audit
   * record; submitted/finalized observations must use the correction flow.
   */
  async cancelSession(
    user: AuthenticatedUser,
    sessionId: string,
    dto: CancelAttendanceSessionDto,
  ) {
    this.assertReviewAccess(user);
    return this.attendanceTransaction(async (manager) => {
      const session = await manager.getRepository(AttendanceSession).findOne({
        where: { id: sessionId },
        relations: { organization: true },
      });
      if (!session)
        throw new ApiException(
          404,
          "ATTENDANCE_SESSION_NOT_FOUND",
          "جلسه حضور و غیاب پیدا نشد.",
        );
      await this.authorizeContext(
        user,
        session.contextType,
        session.contextId,
        session.organization.id,
        true,
      );
      if (session.status === "cancelled")
        return {
          sessionId: session.id,
          revision: session.revision,
          status: session.status,
        };
      if (
        session.status !== "scheduled" &&
        session.status !== "open" &&
        session.status !== "draft"
      )
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_CANCELLATION_REQUIRES_CORRECTION",
          "جلسه ثبت یا نهایی‌شده فقط از مسیر اصلاح قابل پیگیری است.",
        );
      if (session.revision !== dto.expectedRevision)
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_STALE",
          "نسخه جلسه تغییر کرده است؛ دوباره بارگذاری کنید.",
        );
      session.status = "cancelled";
      session.revision++;
      await manager.save(session);
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: user.id },
          action: "attendance.session.cancelled",
          entity: "attendance",
          organizationId: session.organization.id,
          metadata: {
            sessionId,
            requestId: dto.requestId,
            reason: dto.reason.trim(),
            revision: session.revision,
          },
        }),
      );
      return {
        sessionId: session.id,
        revision: session.revision,
        status: session.status,
      };
    });
  }

  async correctRecord(
    user: AuthenticatedUser,
    recordId: string,
    dto: CorrectAttendanceRecordDto,
  ) {
    if (!user.capabilities?.includes("attendance.correct"))
      throw new ApiException(
        403,
        "FORBIDDEN",
        "دسترسی اصلاح حضور و غیاب ندارید.",
      );
    const outcome = await this.attendanceTransaction(async (manager) => {
      const record = await manager.getRepository(AttendanceRecord).findOne({
        where: { id: recordId },
        relations: { session: { organization: true }, student: true },
      });
      if (!record)
        throw new ApiException(
          404,
          "ATTENDANCE_RECORD_NOT_FOUND",
          "رکورد حضور پیدا نشد.",
        );
      const session = record.session;
      await this.authorizeContext(
        user,
        session.contextType,
        session.contextId,
        session.organization.id,
        true,
      );
      if (session.status !== "submitted" && session.status !== "finalized")
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_NOT_CORRECTABLE",
          "جلسه ثبت‌شده یا نهایی لازم است.",
        );
      const prior = await manager.getRepository(AttendanceCorrection).findOne({
        where: {
          record: { id: recordId },
          actor: { id: user.id },
          requestId: dto.requestId,
        },
      });
      if (prior)
        return {
          result: {
            recordId: record.id,
            revision: record.revision,
            sessionRevision: session.revision,
            correctionId: prior.id,
            pendingReview: prior.status === "pending",
          },
          notificationEvents: [],
        };
      if (record.revision !== dto.expectedRevision)
        throw new ApiException(
          409,
          "ATTENDANCE_RECORD_STALE",
          "رکورد تغییر کرده است؛ دوباره بارگذاری کنید.",
        );
      const before = {
        status: record.status,
        physicalStatus: record.physicalStatus ?? null,
        minutesLate: record.minutesLate ?? null,
        revision: record.revision,
      };
      const after = {
        status: dto.status,
        physicalStatus: dto.status,
        minutesLate: dto.status === "late" ? (dto.minutesLate ?? null) : null,
        revision: record.revision + 1,
      };
      const policy = await manager.getRepository(AttendancePolicy).findOne({
        where: { organization: { id: session.organization.id } },
      });
      if (policy?.correctionRequiresReview) {
        const correction = await manager.save(
          AttendanceCorrection,
          manager.create(AttendanceCorrection, {
            session,
            record,
            actor: { id: user.id },
            requestId: dto.requestId,
            reason: dto.reason.trim(),
            before,
            after,
            status: "pending",
          }),
        );
        await manager.save(
          AuditLog,
          manager.create(AuditLog, {
            user: { id: user.id },
            action: "attendance.correction.requested",
            entity: "attendance",
            organizationId: session.organization.id,
            metadata: {
              sessionId: session.id,
              recordId,
              correctionId: correction.id,
              before,
              after,
            },
          }),
        );
        const reviewers = await manager
          .getRepository(OrganizationMembership)
          .find({
            where: {
              organization: { id: session.organization.id },
              status: MembershipStatus.ACTIVE,
            },
            relations: { user: true, roleAssignments: { role: true } },
          });
        const notificationEvents = [] as Array<{
          userId: string;
          id: string;
          title: string;
          body: string;
          category: string;
          url: string;
          organizationId: string;
        }>;
        for (const reviewer of reviewers) {
          if (
            !reviewer.roleAssignments.some((assignment) =>
              ["PRINCIPAL", "SCHOOL_SUPERVISOR"].includes(assignment.role.code),
            )
          )
            continue;
          const item = await manager.getRepository(Notification).save(
            manager.create(Notification, {
              user: reviewer.user,
              organization: session.organization,
              type: NotificationType.WARNING,
              category: "attendance_correction",
              title: "درخواست اصلاح حضور جدید",
              body: `اصلاح حضور ${record.student.name} منتظر بررسی شماست.`,
              url: `/admin/attendance?section=sessions&correctionId=${encodeURIComponent(correction.id)}`,
              priority: "high",
              dedupeKey: `attendance-correction-review:${correction.id}:${reviewer.user.id}`,
            }),
          );
          notificationEvents.push({
            userId: reviewer.user.id,
            id: item.id,
            title: item.title,
            body: item.body,
            category: item.category,
            url: item.url ?? "/admin/attendance?section=sessions",
            organizationId: session.organization.id,
          });
        }
        return {
          result: {
            recordId: record.id,
            revision: record.revision,
            sessionRevision: session.revision,
            correctionId: correction.id,
            pendingReview: true,
          },
          notificationEvents,
        };
      }
      record.status = dto.status as AttendanceStatus;
      record.physicalStatus = dto.status;
      record.minutesLate =
        dto.status === "late" ? (dto.minutesLate ?? null) : null;
      record.reviewStatus =
        dto.status === "absent" ? AttendanceReviewStatus.PENDING : null;
      record.reviewNote = "";
      record.reviewedBy = null;
      record.reviewedAt = null;
      record.recordedBy = { id: user.id } as User;
      record.revision++;
      await manager.save(record);
      session.revision++;
      await manager.save(session);
      const correction = await manager.save(
        AttendanceCorrection,
        manager.create(AttendanceCorrection, {
          session,
          record,
          actor: { id: user.id },
          requestId: dto.requestId,
          reason: dto.reason.trim(),
          before,
          after: { ...after, revision: record.revision },
          status: "approved",
          reviewedBy: { id: user.id },
          reviewedAt: new Date(),
          reviewNote: "اصلاح مستقیم طبق سیاست مدرسه",
        }),
      );
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: user.id },
          action: "attendance.record.corrected",
          entity: "attendance",
          organizationId: session.organization.id,
          metadata: {
            sessionId: session.id,
            recordId,
            studentId: record.student.id,
            requestId: dto.requestId,
            reason: dto.reason.trim(),
            before,
            after,
          },
        }),
      );
      return {
        result: {
          recordId: record.id,
          revision: record.revision,
          sessionRevision: session.revision,
          correctionId: correction.id,
          pendingReview: false,
        },
        notificationEvents: [],
      };
    });
    for (const event of outcome.notificationEvents)
      this.realtime.emitToUsers([event.userId], "notification.created", event);
    return outcome.result;
  }

  async reviewCorrection(
    user: AuthenticatedUser,
    correctionId: string,
    dto: ReviewAttendanceCorrectionDto,
  ) {
    this.assertReviewAccess(user);
    return this.attendanceTransaction(async (manager) => {
      const correction = await manager
        .getRepository(AttendanceCorrection)
        .findOne({
          where: { id: correctionId },
          relations: {
            session: { organization: true },
            record: { student: true },
            actor: true,
          },
        });
      if (!correction)
        throw new ApiException(
          404,
          "ATTENDANCE_CORRECTION_NOT_FOUND",
          "درخواست اصلاح پیدا نشد.",
        );
      await this.authorizeContext(
        user,
        correction.session.contextType,
        correction.session.contextId,
        correction.session.organization.id,
        true,
      );
      if (correction.status !== "pending") {
        if (correction.reviewRequestId === dto.requestId)
          return {
            correctionId,
            status: correction.status,
            recordId: correction.record.id,
          };
        throw new ApiException(
          409,
          "ATTENDANCE_CORRECTION_REVIEWED",
          "این درخواست پیش‌تر بررسی شده است.",
        );
      }
      const expectedRevision = Number(correction.before.revision);
      if (
        !Number.isInteger(expectedRevision) ||
        correction.record.revision !== expectedRevision
      )
        throw new ApiException(
          409,
          "ATTENDANCE_RECORD_STALE",
          "رکورد از زمان درخواست اصلاح تغییر کرده است.",
        );
      correction.status = dto.decision;
      correction.reviewedBy = { id: user.id } as User;
      correction.reviewRequestId = dto.requestId;
      correction.reviewNote = dto.note?.trim() ?? "";
      correction.reviewedAt = new Date();
      if (dto.decision === "approved") {
        const after = correction.after as {
          status?: "present" | "absent" | "late";
          physicalStatus?: "present" | "absent" | "late";
          minutesLate?: number | null;
        };
        if (
          !after.status ||
          !["present", "absent", "late"].includes(after.status)
        )
          throw new ApiException(
            422,
            "ATTENDANCE_CORRECTION_INVALID",
            "مقدار اصلاح معتبر نیست.",
          );
        const record = correction.record;
        record.status = after.status as AttendanceStatus;
        record.physicalStatus = after.physicalStatus ?? after.status;
        record.minutesLate =
          after.status === "late" ? (after.minutesLate ?? null) : null;
        record.reviewStatus =
          after.status === "absent" ? AttendanceReviewStatus.PENDING : null;
        record.reviewNote = "";
        record.reviewedBy = null;
        record.reviewedAt = null;
        record.recordedBy = { id: correction.actor.id } as User;
        record.revision++;
        await manager.save(record);
        correction.session.revision++;
        await manager.save(correction.session);
      }
      await manager.save(correction);
      await manager.save(
        AuditLog,
        manager.create(AuditLog, {
          user: { id: user.id },
          action: `attendance.correction.${dto.decision}`,
          entity: "attendance",
          organizationId: correction.session.organization.id,
          metadata: {
            correctionId,
            recordId: correction.record.id,
            sessionId: correction.session.id,
            requestId: dto.requestId,
            note: correction.reviewNote,
          },
        }),
      );
      return {
        correctionId,
        status: correction.status,
        recordId: correction.record.id,
        revision: correction.record.revision,
        sessionRevision: correction.session.revision,
      };
    });
  }

  async bulkMark(
    user: AuthenticatedUser,
    dto: BulkMarkAttendanceDto,
    options: {
      allowOccurrence?: boolean;
      allowHistoricalOccurrence?: boolean;
      submit?: boolean;
    } = {},
  ) {
    if (!dto.entries.length) {
      throw new ApiException(
        422,
        "ATTENDANCE_EMPTY",
        "حداقل یک وضعیت حضور ارسال کنید.",
      );
    }
    if (dto.entries.length > maximumAttendanceBatchSize) {
      throw new ApiException(
        422,
        "ATTENDANCE_BATCH_SIZE",
        "بین ۱ تا ۵۰۰ وضعیت حضور ارسال کنید.",
      );
    }
    if (
      new Set(dto.entries.map((entry) => entry.studentId)).size !==
      dto.entries.length
    ) {
      throw new ApiException(
        422,
        "ATTENDANCE_DUPLICATE_STUDENT",
        "هر طلبه فقط یک بار در درخواست حضور درج شود.",
      );
    }
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          organizationId: dto.organizationId,
          sessionId: dto.sessionId,
          expectedRevision: dto.expectedRevision,
          contextType: dto.contextType,
          contextId: dto.contextId,
          sessionDate: dto.sessionDate,
          entries: [...dto.entries]
            .sort((a, b) => a.studentId.localeCompare(b.studentId))
            .map((entry) => ({
              studentId: entry.studentId,
              status: entry.status,
              note: entry.note?.trim() || "",
            })),
        }),
      )
      .digest("hex");
    const entries = dto.entries.map((entry) => ({
      ...entry,
      status: this.status(entry.status),
    }));
    const sessionDate = dto.sessionDate
      ? new Date(dto.sessionDate)
      : new Date();
    if (Number.isNaN(sessionDate.getTime())) {
      throw new ApiException(
        422,
        "ATTENDANCE_DATE_INVALID",
        "تاریخ جلسه معتبر نیست.",
      );
    }

    const {
      result,
      recipients,
      organizationId,
      contextType,
      contextId,
      notificationEvents,
    } = await this.attendanceTransaction(async (manager) => {
      const sessions = manager.getRepository(AttendanceSession);
      const records = manager.getRepository(AttendanceRecord);
      const students = manager.getRepository(Student);
      this.assertWorkOrganization(user, dto.organizationId);
      const organization = await this.access.organizationForUser(
        this.effectiveUser(user),
        dto.organizationId,
      );
      const receipts = manager.getRepository(AttendanceWriteReceipt);
      if (dto.requestId) {
        const receipt = await receipts.findOne({
          where: {
            organization: { id: organization.id },
            actor: { id: user.id },
            requestId: dto.requestId,
          },
          relations: { session: true },
        });
        if (receipt) {
          const receiptSession = await sessions.findOne({
            where: { id: receipt.session.id },
            relations: { assignedStaff: true },
          });
          const assigned =
            !!receiptSession &&
            ["class_schedule", "legacy_schedule", "legacy_import"].includes(
              receiptSession?.sourceKind ?? "",
            ) &&
            receiptSession.assignedStaff?.id === user.id &&
            user.capabilities?.includes("attendance.class.manage");
          if (!assigned)
            await this.assertContextAccess(
              user,
              receipt.session.contextType,
              receipt.session.contextId,
              organization.id,
              true,
            );
          if (receipt.fingerprint !== fingerprint)
            throw new ApiException(
              409,
              "ATTENDANCE_REQUEST_REUSED",
              "شناسه درخواست قبلاً برای اطلاعات دیگری استفاده شده است.",
            );
          return {
            result: receipt.result,
            recipients: [] as string[],
            organizationId: organization.id,
            contextType: receipt.session.contextType,
            contextId: receipt.session.contextId,
            notificationEvents: [],
          };
        }
      }
      // A teacher's own attendance must be frozen for every approved leave day.
      // School-wide staff retain their operational ability to correct history.
      if (!this.schoolWide(user)) {
        const day = sessionDate.toISOString().slice(0, 10);
        const leave = await manager.getRepository(TeacherLeaveRequest).findOne({
          where: {
            organizationId: organization.id,
            teacherId: user.id,
            status: "approved",
            startDate: LessThanOrEqual(day),
            endDate: MoreThanOrEqual(day),
          },
        });
        if (
          leave &&
          !(
            leave.returnStatus === "approved" &&
            leave.returnDate &&
            leave.returnDate <= day
          )
        )
          throw new ApiException(
            409,
            "TEACHER_LEAVE_ATTENDANCE_FROZEN",
            "حضور و غیاب در بازه مرخصی تأییدشده غیرفعال است.",
          );
      }
      let session = dto.sessionId
        ? await sessions.findOne({
            where: {
              id: dto.sessionId,
              organization: { id: organization.id },
            },
            relations: { organization: true, assignedStaff: true },
          })
        : null;
      if (dto.sessionId && !session)
        throw new ApiException(
          404,
          "ATTENDANCE_SESSION_NOT_FOUND",
          "جلسه حضور و غیاب پیدا نشد.",
        );
      await this.assertAcademicSessionWritable(manager, session);
      if (
        session &&
        (["class_schedule", "legacy_schedule", "legacy_import"].includes(
          session.sourceKind ?? "",
        ) ||
          dto.expectedRevision !== undefined) &&
        session.revision !== dto.expectedRevision
      )
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_STALE",
          "نسخه جلسه تغییر کرده است؛ دوباره بارگذاری کنید.",
        );
      if (session?.status === "cancelled")
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_CANCELLED",
          "این درس لغو شده است؛ حضور تاریخی فقط قابل مشاهده است.",
        );
      // A timetable occurrence remains the same historical lesson after its
      // scheduled window closes. Its assigned teacher may correct that saved
      // roster until a reviewer finalizes or cancels it; generic live attendance
      // sessions keep the normal time-window rule.
      if (!(
        options.allowHistoricalOccurrence &&
        ["class_schedule", "legacy_schedule", "legacy_import"].includes(
          session?.sourceKind ?? "",
        )
      ))
        this.assertSessionIsActiveForMarking(session);
      const contextType = session?.contextType ?? dto.contextType;
      const contextId = session?.contextId ?? dto.contextId;
      if (!contextType || !contextId)
        throw new ApiException(
          422,
          "ATTENDANCE_CONTEXT_REQUIRED",
          "کلاس، گروه یا اتاق لازم است.",
        );
      const assignedTeacher =
        !!session &&
        ["class_schedule", "legacy_schedule"].includes(
          session?.sourceKind ?? "",
        ) &&
        session.assignedStaff?.id === user.id &&
        user.capabilities?.includes("attendance.class.manage");
      if (
        session?.occurrenceKey &&
        !options.allowOccurrence &&
        !assignedTeacher
      )
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_WORKFLOW_REQUIRED",
          "برای این جلسه از گردش‌کار حضور برنامه استفاده کنید.",
        );
      if (session?.status === "finalized" && !assignedTeacher)
        throw new ApiException(
          409,
          "ATTENDANCE_SESSION_LOCKED",
          "جلسه نهایی‌شده فقط توسط استاد همان درس قابل اصلاح است.",
        );
      if (!assignedTeacher)
        await this.assertContextAccess(
          user,
          contextType,
          contextId,
          organization.id,
          true,
        );
      const participantIds = assignedTeacher
        ? new Set((session!.rosterSnapshot ?? []).map((row) => row.id))
        : await this.participantIds(
            user,
            contextType,
            contextId,
            organization.id,
          );
      if (entries.some((entry) => !participantIds.has(entry.studentId))) {
        throw new ApiException(
          422,
          "ATTENDANCE_STUDENT_NOT_IN_CONTEXT",
          "یک یا چند طلبه عضو این کلاس، گروه یا اتاق نیستند.",
        );
      }
      const policy = await manager.getRepository(AttendancePolicy).findOne({
        where: { organization: { id: organization.id } },
      });
      if (
        policy?.allowPartialSubmission === false &&
        entries.length !== participantIds.size
      )
        throw new ApiException(
          422,
          "ATTENDANCE_PARTIAL_SUBMISSION_DISABLED",
          "قانون مدرسه ثبت ناقص حضور و غیاب را مجاز نمی‌داند.",
        );
      const roster = await students.findBy({
        id: In(entries.map((entry) => entry.studentId)),
      });
      if (roster.length !== entries.length) {
        throw new ApiException(404, "STUDENT_NOT_FOUND", "طلبه پیدا نشد.");
      }
      const byId = new Map(roster.map((student) => [student.id, student]));
      // Complete validation precedes the first write. Session and marks then
      // commit together; a failed row also rolls back any earlier row updates.
      if (!session) {
        const fullRoster = await students.find({
          where: { id: In([...participantIds]) },
          relations: { user: true },
        });
        const descriptor = await this.contextDescriptor(contextType, contextId);
        session = await sessions.save(
          sessions.create({
            organization,
            contextType,
            contextId,
            sessionDate,
            titleSnapshot: descriptor.title,
            rosterSnapshot: fullRoster.map((student) => ({
              id: student.id,
              name: student.name,
              nationalCode: student.nationalCode ?? null,
              userId: student.user?.id ?? null,
            })),
            rosterCapturedAt: new Date(),
            status: "submitted",
            note: "",
            createdBy: { id: user.id } as User,
          }),
        );
      }
      const saved: AttendanceRecord[] = [];
      const changes: Array<Record<string, unknown>> = [];
      for (const entry of entries) {
        const student = byId.get(entry.studentId)!;
        let record = await records.findOne({
          where: { session: { id: session.id }, student: { id: student.id } },
          relations: { student: true },
        });
        const before = record
          ? {
              status: record.status,
              note: record.note,
              reviewStatus: record.reviewStatus ?? null,
            }
          : null;
        if (!record) record = records.create({ session, student });
        record.status = entry.status;
        record.physicalStatus =
          entry.status === AttendanceStatus.EXCUSED
            ? "legacy_unknown"
            : entry.status;
        record.revision = (record.revision ?? 0) + 1;
        record.note = entry.note?.trim() || "";
        record.recordedBy = { id: user.id } as User;
        record.reviewStatus =
          entry.status === AttendanceStatus.ABSENT
            ? AttendanceReviewStatus.PENDING
            : null;
        record.reviewNote = "";
        record.reviewedBy = null;
        record.reviewedAt = null;
        const marked = await records.save(record);
        saved.push(marked);
        changes.push({
          recordId: marked.id,
          studentId: student.id,
          before,
          after: {
            status: marked.status,
            note: marked.note,
            reviewStatus: marked.reviewStatus,
          },
        });
      }
      for (const record of saved) {
        const points =
          record.physicalStatus === "present"
            ? 1
            : record.physicalStatus === "absent"
              ? -1
              : 0;
        const reason =
          points > 0
            ? "یک امتیاز برای حضور در کلاس"
            : points < 0
              ? "کسر یک امتیاز برای غیبت در کلاس"
              : "وضعیت حضور بدون تغییر امتیاز";
        await this.rewards.recordAttendanceOutcome(
          {
            recordId: record.id,
            revision: record.revision,
            student: record.student,
            organization,
            points,
            reason,
            contextType: session.contextType,
            contextId: session.contextId,
            contextName: session.titleSnapshot || null,
          },
          manager,
        );
      }
      if (options.submit) {
        const revisingTimetableOccurrence =
          ["class_schedule", "legacy_schedule", "legacy_import"].includes(
            session.sourceKind ?? "",
          ) &&
          (session.status === "submitted" || session.status === "finalized") &&
          session.assignedStaff?.id === user.id &&
          user.capabilities?.includes("attendance.class.manage");
        if (
          !revisingTimetableOccurrence &&
          session.status !== "open" &&
          session.status !== "scheduled"
        )
          throw new ApiException(
            409,
            "ATTENDANCE_SESSION_ALREADY_SUBMITTED",
            "ثبت اولیه این جلسه قبلاً انجام شده است.",
          );
        if (!revisingTimetableOccurrence) {
          session.status = "submitted";
          session.submittedAt = new Date();
          session.submittedBy = { id: user.id } as User;
        }
      }
      session.revision++;
      await sessions.save(session);
      await manager.getRepository(AuditLog).save({
        user: { id: user.id },
        action: "attendance.records.marked",
        entity: "attendance",
        organizationId: organization.id,
        metadata: {
          actorId: user.id,
          sessionId: session.id,
          requestId: dto.requestId ?? null,
          operation: options.submit
            ? "absence_first_submission"
            : "progressive_marking",
          changes,
        },
      });
      const members = await manager.getRepository(OrganizationMembership).find({
        where: {
          organization: { id: organization.id },
          status: MembershipStatus.ACTIVE,
        },
        relations: { user: true, roleAssignments: { role: true } },
      });
      const result = {
        sessionId: session.id,
        revision: session.revision,
        status: session.status,
        count: saved.length,
        records: saved.map((item) => ({
          id: item.id,
          studentId: item.student.id,
          status: item.status,
          note: item.note,
        })),
      };
      if (dto.requestId)
        await receipts.save(
          receipts.create({
            organization,
            actor: { id: user.id },
            session,
            requestId: dto.requestId,
            fingerprint,
            result,
          }),
        );
      const notifications = manager.getRepository(Notification);
      const reviewRecipients = members
        .filter((member) =>
          member.roleAssignments.some((assignment) =>
            ["PRINCIPAL", "SCHOOL_SUPERVISOR"].includes(assignment.role.code),
          ),
        )
        .map((member) => member.user.id);
      const notificationEvents: Array<{
        userId: string;
        id: string;
        title: string;
        body: string;
        category: string;
        url: string;
        organizationId: string;
      }> = [];
      for (const record of saved.filter(
        (row) => row.physicalStatus === "absent",
      )) {
        const studentUser = await students.findOne({
          where: { id: record.student.id },
          relations: { user: true },
        });
        if (studentUser?.user) {
          const item = await notifications.save(
            notifications.create({
              user: studentUser.user,
              organization,
              type: NotificationType.WARNING,
              category: "attendance_absence",
              title: "غیبت شما در کلاس ثبت شد",
              body: "شما در کلاس غایب ثبت شده‌اید. برای دریافت اجازه حضور، به مدیر یا ناظر مدرسه مراجعه کنید.",
              url: "/admin/my-attendance",
              priority: "high",
              dedupeKey: `attendance-absence-student:${record.id}`,
            }),
          );
          notificationEvents.push({
            userId: studentUser.user.id,
            id: item.id,
            title: item.title,
            body: item.body,
            category: item.category,
            url: item.url ?? "/admin/my-attendance",
            organizationId: organization.id,
          });
        }
        for (const reviewerId of reviewRecipients) {
          const item = await notifications.save(
            notifications.create({
              user: { id: reviewerId } as User,
              organization,
              type: NotificationType.WARNING,
              category: "attendance_review",
              title: "درخواست بررسی غیبت جدید",
              body: `غیبت ${record.student.name} توسط معلم ثبت شده و منتظر بررسی است.`,
              // Reviewers land in the exact workspace and queue item that generated the alert.
              url: `/admin/attendance?section=sessions&reviewRecordId=${encodeURIComponent(record.id)}`,
              priority: "high",
              dedupeKey: `attendance-absence-review:${record.id}:${reviewerId}`,
            }),
          );
          notificationEvents.push({
            userId: reviewerId,
            id: item.id,
            title: item.title,
            body: item.body,
            category: item.category,
            url: item.url ?? "/admin/attendance?section=sessions",
            organizationId: organization.id,
          });
        }
      }
      return {
        result,
        recipients: members.map((member) => member.user.id),
        organizationId: organization.id,
        contextType,
        contextId,
        notificationEvents,
      };
    });
    // Never publish an attendance update for a rolled-back transaction.
    if (recipients.length)
      this.realtime.emitToUsers(recipients, "attendance.updated", {
        organizationId,
        sessionId: result.sessionId,
        contextType,
        contextId,
        updatedBy: user.id,
      });
    for (const event of notificationEvents ?? [])
      this.realtime.emitToUsers([event.userId], "notification.created", event);
    return result;
  }

  async awardPoints(user: AuthenticatedUser, dto: AwardAttendancePointsDto) {
    if (!dto.points)
      throw new ApiException(
        422,
        "ATTENDANCE_POINTS_ZERO",
        "امتیاز باید مثبت یا منفی باشد.",
      );
    const organization = await this.authorizeOrganization(
      user,
      dto.organizationId,
    );
    await this.assertContextAccess(
      user,
      dto.contextType,
      dto.contextId,
      organization.id,
      true,
    );
    const studentIds = await this.participantIds(
      user,
      dto.contextType,
      dto.contextId,
      organization.id,
    );
    if (!studentIds.has(dto.studentId))
      throw new ApiException(
        422,
        "ATTENDANCE_STUDENT_NOT_IN_CONTEXT",
        "دانش‌آموز عضو این کلاس نیست.",
      );
    return this.attendanceTransaction(async (manager) => {
      const student = await manager.getRepository(Student).findOne({
        where: { id: dto.studentId, organization: { id: organization.id } },
      });
      if (!student)
        throw new ApiException(404, "STUDENT_NOT_FOUND", "دانش‌آموز پیدا نشد.");
      const context = await this.contextDescriptor(
        dto.contextType,
        dto.contextId,
      );
      const row = await this.rewards.recordTrustedSource(
        {
          student,
          organization,
          awardedById: user.id,
          points: dto.points,
          reason: dto.reason,
          sourceType: "attendance_manual",
          contextType: dto.contextType,
          contextId: dto.contextId,
          contextName: context.title,
          requestId: dto.requestId,
        },
        manager,
      );
      await manager.getRepository(AuditLog).save({
        user: { id: user.id },
        organizationId: organization.id,
        entity: "student_reward_ledger",
        action: "attendance.points.adjusted",
        metadata: {
          studentId: student.id,
          contextType: dto.contextType,
          contextId: dto.contextId,
          points: row.points,
          reason: row.reason,
        },
      });
      return {
        id: row.id,
        studentId: student.id,
        points: row.points,
        reason: row.reason,
      };
    });
  }

  private attendanceTransaction<T>(
    work: (manager: EntityManager) => Promise<T>,
  ): Promise<T> {
    return attendanceTransaction(this.sessions.manager, work);
  }

  async listAbsenceReviews(user: AuthenticatedUser, organizationId?: string) {
    this.assertReviewAccess(user);
    const ids = await this.access.scopedOrganizationIds(
      this.effectiveUser(user),
      organizationId,
    );
    if (!ids.length) return [];
    const rows = await this.records.find({
      where: {
        session: { organization: { id: In(ids) } },
        status: AttendanceStatus.ABSENT,
      },
      relations: {
        session: { organization: true },
        student: true,
        recordedBy: true,
        reviewedBy: true,
      },
      order: { updatedAt: "DESC" },
      take: 100,
    });
    const scoped = this.schoolWide(user)
      ? rows
      : (
          await Promise.all(
            rows.map(async (row) => {
              try {
                await this.assertContextAccess(
                  user,
                  row.session.contextType,
                  row.session.contextId,
                  row.session.organization.id,
                  true,
                );
                return row;
              } catch (error) {
                if (error instanceof ApiException && error.getStatus() === 403)
                  return null;
                throw error;
              }
            }),
          )
        ).filter((row): row is AttendanceRecord => row !== null);
    return scoped.map((row) => this.reviewView(row));
  }

  async listPendingCorrections(
    user: AuthenticatedUser,
    organizationId?: string,
  ) {
    this.assertReviewAccess(user);
    const ids = await this.access.scopedOrganizationIds(
      this.effectiveUser(user),
      organizationId,
    );
    if (!ids.length) return [];
    const rows = await this.sessions.manager
      .getRepository(AttendanceCorrection)
      .find({
        where: {
          status: "pending",
          session: { organization: { id: In(ids) } },
        },
        relations: {
          session: { organization: true },
          record: { student: true },
          actor: true,
        },
        order: { createdAt: "ASC", id: "ASC" },
        take: 100,
      });
    const scoped = this.schoolWide(user)
      ? rows
      : (
          await Promise.all(
            rows.map(async (row) => {
              try {
                await this.assertContextAccess(
                  user,
                  row.session.contextType,
                  row.session.contextId,
                  row.session.organization.id,
                  true,
                );
                return row;
              } catch (error) {
                if (error instanceof ApiException && error.getStatus() === 403)
                  return null;
                throw error;
              }
            }),
          )
        ).filter((row): row is AttendanceCorrection => row !== null);
    return scoped.map((row) => ({
      id: row.id,
      recordId: row.record.id,
      sessionId: row.session.id,
      organizationId: row.session.organization.id,
      contextType: row.session.contextType,
      contextId: row.session.contextId,
      title: row.session.titleSnapshot,
      studentId: row.record.student.id,
      studentName: row.record.student.name,
      requestedBy:
        [row.actor.firstName, row.actor.lastName].filter(Boolean).join(" ") ||
        row.actor.username,
      reason: row.reason,
      before: row.before,
      after: row.after,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async listLiveRecords(user: AuthenticatedUser, organizationId?: string) {
    const ids = await this.access.scopedOrganizationIds(
      this.effectiveUser(user),
      organizationId,
    );
    if (!ids.length) return [];
    const rows = await this.records.find({
      where: { session: { organization: { id: In(ids) } } },
      relations: {
        session: { organization: true },
        student: true,
        recordedBy: true,
        reviewedBy: true,
      },
      order: { updatedAt: "DESC" },
      take: 120,
    });
    const scoped = this.schoolWide(user)
      ? rows
      : (
          await Promise.all(
            rows.map(async (row) => {
              try {
                await this.assertContextAccess(
                  user,
                  row.session.contextType,
                  row.session.contextId,
                  row.session.organization.id,
                  false,
                );
                return row;
              } catch (error) {
                if (error instanceof ApiException && error.getStatus() === 403)
                  return null;
                throw error;
              }
            }),
          )
        ).filter((row): row is AttendanceRecord => row !== null);
    return scoped.map((row) => this.reviewView(row));
  }

  async reviewAbsence(
    user: AuthenticatedUser,
    recordId: string,
    dto: ReviewAttendanceAbsenceDto,
  ) {
    this.assertReviewAccess(user);
    const { saved, recipients } = await this.attendanceTransaction(
      async (manager) => {
        const records = manager.getRepository(AttendanceRecord);
        const relations = {
          session: { organization: true },
          student: { user: true },
          recordedBy: true,
          reviewedBy: true,
        } as const;
        const record = await records.findOne({
          where: { id: recordId },
          relations,
        });
        if (!record)
          throw new ApiException(
            404,
            "ATTENDANCE_RECORD_NOT_FOUND",
            "رکورد حضور پیدا نشد.",
          );
        this.assertWorkOrganization(user, record.session.organization.id);
        await this.access.organizationForUser(
          this.effectiveUser(user),
          record.session.organization.id,
        );
        await this.assertContextAccess(
          user,
          record.session.contextType,
          record.session.contextId,
          record.session.organization.id,
          true,
        );
        const decision =
          dto.decision === "approved"
            ? AttendanceReviewStatus.APPROVED
            : AttendanceReviewStatus.REJECTED;
        const note = dto.note?.trim() || "";
        const reviewedAt = new Date();
        // Conditional SQL protects the pending transition across processes too.
        const transition = await records
          .createQueryBuilder()
          .update()
          .set({
            reviewStatus: decision,
            physicalStatus: record.physicalStatus ?? "absent",
            revision: () => "revision + 1",
            reviewNote: note,
            reviewedBy: { id: user.id },
            reviewedAt,
            status:
              dto.decision === "approved"
                ? AttendanceStatus.EXCUSED
                : AttendanceStatus.ABSENT,
          })
          .where("id = :id", { id: record.id })
          .andWhere("status = :status AND reviewStatus = :pending", {
            status: AttendanceStatus.ABSENT,
            pending: AttendanceReviewStatus.PENDING,
          })
          .execute();
        if (transition.affected !== 1)
          throw new ApiException(
            409,
            "ATTENDANCE_REVIEW_CLOSED",
            "این غیبت دیگر در انتظار بررسی نیست.",
          );
        const saved = await records.findOneOrFail({
          where: { id: record.id },
          relations,
        });
        await manager.getRepository(AuditLog).save({
          user: { id: user.id },
          action: "attendance.absence.reviewed",
          entity: "attendance",
          organizationId: record.session.organization.id,
          metadata: {
            actorId: user.id,
            sessionId: record.session.id,
            recordId: record.id,
            before: {
              status: record.status,
              reviewStatus: record.reviewStatus,
            },
            after: { status: saved.status, reviewStatus: decision },
            note,
          },
        });
        const members = await manager
          .getRepository(OrganizationMembership)
          .find({
            where: {
              organization: { id: record.session.organization.id },
              status: MembershipStatus.ACTIVE,
            },
            relations: {
              user: true,
              roleAssignments: { role: { permissions: { permission: true } } },
            },
          });
        const recipients = new Set([user.id]);
        for (const member of members) {
          const reviewer = member.roleAssignments.some((assignment) =>
            assignment.role.permissions.some(
              (permission) =>
                permission.permission.code === "attendance.review",
            ),
          );
          if (
            reviewer ||
            member.user.id === record.recordedBy?.id ||
            member.user.id === record.student.user?.id
          )
            recipients.add(member.user.id);
        }
        return { saved, recipients: [...recipients] };
      },
    );
    this.realtime.emitToUsers(recipients, "attendance.reviewed", {
      organizationId: saved.session.organization.id,
      sessionId: saved.session.id,
      contextType: saved.session.contextType,
      contextId: saved.session.contextId,
      recordId: saved.id,
      decision: dto.decision,
    });
    if (saved.student.user?.id) {
      const notification = await this.sessions.manager
        .getRepository(Notification)
        .save({
          user: { id: saved.student.user.id } as User,
          organization: saved.session.organization,
          type: NotificationType.WARNING,
          category: "attendance_review",
          title:
            dto.decision === "approved"
              ? "اجازه مراجعه به کلاس تأیید شد"
              : "درخواست غیبت بررسی شد",
          body:
            dto.decision === "approved"
              ? "درخواست شما تأیید شد. برای ادامه حضور در کلاس به مدیر یا ناظر مراجعه کنید. یک امتیاز غیبت در کارنامه شما حفظ شده است."
              : "درخواست غیبت شما رد شد. برای پیگیری با مدیر یا ناظر مدرسه صحبت کنید.",
          url: "/admin/my-attendance",
          priority: "high",
          dedupeKey: `attendance-review-student:${saved.id}`,
        });
      this.realtime.emitToUsers(
        [saved.student.user.id],
        "notification.created",
        {
          id: notification.id,
          title: notification.title,
          body: notification.body,
          category: notification.category,
          url: notification.url,
          type: notification.type,
          organizationId: saved.session.organization.id,
        },
      );
    }
    return this.reviewView(saved);
  }

  async listMyAbsenceReviews(user: AuthenticatedUser) {
    if (!user.activeOrganizationId) return [];
    await this.access.organizationForUser(
      this.effectiveUser(user),
      user.activeOrganizationId,
    );
    const rows = await this.records.find({
      where: {
        recordedBy: { id: user.id },
        session: { organization: { id: user.activeOrganizationId } },
      },
      relations: {
        session: { organization: true },
        student: true,
        recordedBy: true,
        reviewedBy: true,
      },
      order: { updatedAt: "DESC" },
      take: 100,
    });
    return rows
      .filter((row) => row.reviewStatus)
      .map((row) => this.reviewView(row));
  }

  async listParticipants(
    user: AuthenticatedUser,
    contextType: string,
    contextId: string,
  ) {
    const context = this.context(contextType);
    const organizationId = await this.contextOrganizationId(context, contextId);
    await this.access.organizationForUser(
      this.effectiveUser(user),
      organizationId,
    );
    this.assertWorkOrganization(user, organizationId);
    await this.assertContextAccess(
      user,
      context,
      contextId,
      organizationId,
      false,
    );
    if (context === "class") {
      const rows = await this.enrollments.find({
        where: { classroom: { id: contextId } },
        relations: { student: { user: true } },
        order: { createdAt: "ASC" },
      });
      return rows.map((row) => this.studentView(row.student));
    }
    if (context === "class_group" || context === "study_group") {
      const rows = await this.groupMemberships.find({
        where: { group: { id: contextId } },
        relations: { student: { user: true } },
        order: { createdAt: "ASC" },
      });
      return rows.map((row) => this.studentView(row.student));
    }
    const rows = await this.roomAssignments.find({
      where: { room: { id: contextId } },
      relations: { student: { user: true } },
      order: { createdAt: "ASC" },
    });
    return rows.map((row) => this.studentView(row.student));
  }

  async summary(user: AuthenticatedUser, studentId?: string) {
    let target = studentId;
    if (!target) {
      const student = await this.students.findOne({
        where: { user: { id: user.id } },
        relations: { organization: true },
      });
      if (!student)
        throw new ApiException(
          404,
          "STUDENT_NOT_FOUND",
          "پرونده طلبه پیدا نشد.",
        );
      if (student.organization)
        await this.authorizeOrganization(user, student.organization.id);
      target = student.id;
    } else if (
      !(await this.authorization.canAccessStudent(
        this.userContext(user),
        target,
        "students.read",
      ))
    ) {
      throw new ApiException(404, "STUDENT_NOT_FOUND", "پرونده طلبه پیدا نشد.");
    }
    if (studentId) {
      this.assertReviewAccess(user);
      if (!user.capabilities?.includes("attendance.review"))
        throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
      const student = await this.students.findOne({
        where: { id: target },
        relations: { organization: true, user: true },
      });
      if (!student?.organization || student.user?.id === user.id)
        throw new ApiException(
          403,
          "FORBIDDEN",
          "پرونده فقط برای ناظر و مدیر است.",
        );
      await this.authorizeOrganization(user, student.organization.id);
    }
    const rows = await this.records.find({
      where: { student: { id: target } },
      relations: { session: { organization: true } },
      order: { createdAt: "DESC" },
    });
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const row of rows) counts[row.status as keyof typeof counts] += 1;
    return {
      studentId: target,
      totalSessions: rows.length,
      ...counts,
      recent: (studentId ? rows.slice(0, 10) : []).map((row) => ({
        id: row.id,
        sessionId: row.session.id,
        status: row.status,
        sessionDate: row.session.sessionDate.toISOString(),
        contextType:
          row.session.contextType === "study_group"
            ? "class_group"
            : row.session.contextType,
        contextId: row.session.contextId,
        organizationId: row.session.organization.id,
        recordedAt: row.createdAt.toISOString(),
      })),
    };
  }

  /** A student may read only records tied to their own active school profile. */
  async listSelfRecords(user: AuthenticatedUser) {
    return (await this.listSelfRecordsPage(user, { page: 1, limit: 200 }))
      .items;
  }

  async listSelfRecordsPage(
    user: AuthenticatedUser,
    query: Pick<AttendanceHistoryQueryDto, "page" | "limit" | "from" | "to"> & {
      status?: "present" | "absent" | "late" | "excused";
    },
  ) {
    const student = await this.students.findOne({
      where: {
        user: { id: user.id },
        accountStatus: "active",
      },
      relations: { organization: true },
    });
    if (!student?.organization)
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "پرونده فعال طلبه پیدا نشد.",
      );
    await this.authorizeOrganization(user, student.organization.id);
    const page = query.page ?? 1;
    const limit = Math.min(query.limit ?? 10, 50);
    const sessionDate = query.from
      ? query.to
        ? Between(new Date(query.from), new Date(query.to))
        : MoreThanOrEqual(new Date(query.from))
      : query.to
        ? LessThanOrEqual(new Date(query.to))
        : undefined;
    const [records, total] = await this.records.findAndCount({
      where: {
        student: { id: student.id },
        session: {
          organization: { id: student.organization.id },
          ...(sessionDate ? { sessionDate } : {}),
        },
        ...(query.status ? { status: query.status as AttendanceStatus } : {}),
      },
      relations: { session: { organization: true } },
      order: { createdAt: "DESC", id: "DESC" },
      skip: (page - 1) * limit,
      take: limit,
    });
    const items = records
      .filter((record) => record.session.status !== "cancelled")
      .map((record) => ({
        id: record.id,
        sessionId: record.session.id,
        status: record.status,
        physicalStatus:
          record.physicalStatus ??
          (record.status === AttendanceStatus.EXCUSED
            ? "legacy_unknown"
            : record.status),
        reviewStatus: record.reviewStatus ?? null,
        note: record.note,
        sessionDate: record.session.sessionDate.toISOString(),
        contextType:
          record.session.contextType === "study_group"
            ? "class_group"
            : record.session.contextType,
        contextId: record.session.contextId,
        title: record.session.titleSnapshot || "",
        organizationId: record.session.organization.id,
        recordedAt: record.updatedAt.toISOString(),
      }));
    return { items, page, limit, total, hasNext: page * limit < total };
  }

  private async participantIds(
    user: AuthenticatedUser,
    type: AttendanceContextType,
    id: string,
    organizationId: string,
  ) {
    await this.assertContextAccess(user, type, id, organizationId, true);
    if (type === "class") {
      const rows = await this.enrollments.find({
        where: { classroom: { id } },
        relations: { student: true },
      });
      return new Set(rows.map((row) => row.student.id));
    }
    if (type === "class_group" || type === "study_group") {
      const rows = await this.groupMemberships.find({
        where: { group: { id } },
        relations: { student: true },
      });
      return new Set(rows.map((row) => row.student.id));
    }
    const rows = await this.roomAssignments.find({
      where: { room: { id } },
      relations: { student: true },
    });
    return new Set(rows.map((row) => row.student.id));
  }

  private async assertContextAccess(
    user: AuthenticatedUser,
    type: AttendanceContextType,
    id: string,
    organizationId: string,
    manage: boolean,
  ) {
    if (manage) this.assertWorkOrganization(user, organizationId);
    // A school-wide role changes assignment scope, never tenant ownership.
    // Resolve the context even for principals/platform staff before any write.
    const contextOrganizationId = await this.contextOrganizationId(type, id);
    if (contextOrganizationId !== organizationId) {
      throw new ApiException(
        403,
        "ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH",
        "کلاس، گروه یا اتاق متعلق به سازمان انتخاب‌شده نیست.",
      );
    }
    if (type === "dorm") {
      if (this.dormWide(user)) return;
      throw new ApiException(
        403,
        "FORBIDDEN",
        "دسترسی خوابگاه برای این نقش مجاز نیست.",
      );
    }
    if (this.schoolWide(user)) return;
    const classroom =
      type === "class"
        ? await this.classes.findOne({
            where: { id, organization: { id: organizationId } },
            relations: { advisor: true, books: { teacher: true } },
          })
        : (
            await this.groups.findOne({
              where: { id, organization: { id: organizationId } },
              relations: {
                classroom: { advisor: true, books: { teacher: true } },
              },
            })
          )?.classroom;
    if (
      !classroom ||
      (classroom.advisor?.id !== user.id &&
        !classroom.books?.some((book) => book.teacher?.id === user.id))
    )
      throw new ApiException(
        403,
        "FORBIDDEN",
        "این کلاس یا گروه به شما واگذار نشده است.",
      );
  }

  private effectiveUser(user: AuthenticatedUser): AuthenticatedUser {
    return { ...user, role: user.roles ? (user.roles[0] ?? "") : user.role };
  }

  private checkRepository() {
    if (!this.supervisorChecks)
      throw new ApiException(
        503,
        "SUPERVISOR_CHECKS_UNAVAILABLE",
        "ثبت بررسی ناظر در دسترس نیست.",
      );
    return this.supervisorChecks;
  }

  private assertSupervisor(user: AuthenticatedUser) {
    if ((user.roles ?? [user.role]).includes("SCHOOL_SUPERVISOR")) return;
    throw new ApiException(
      403,
      "SUPERVISOR_ATTENDANCE_FORBIDDEN",
      "ثبت حضور و غیاب نظارتی فقط برای ناظر مدرسه مجاز است.",
    );
  }

  private supervisorCheckView(check: AttendanceSupervisorCheck) {
    return {
      id: check.id,
      supervisorId: check.supervisor?.id ?? null,
      supervisorName: check.supervisor
        ? `${check.supervisor.firstName} ${check.supervisor.lastName}`.trim() ||
          check.supervisor.username
        : "—",
      entries: check.entries,
      revision: check.revision,
      submittedAt: check.submittedAt?.toISOString() ?? null,
      updatedAt: check.updatedAt?.toISOString() ?? null,
    };
  }

  private assertWorkOrganization(
    user: AuthenticatedUser,
    organizationId: string,
  ) {
    if (
      user.activeOrganizationId &&
      user.activeOrganizationId !== organizationId
    ) {
      throw new ApiException(
        403,
        "ATTENDANCE_WORK_CONTEXT_MISMATCH",
        "ابتدا سازمان فعال را تغییر دهید.",
      );
    }
  }

  private schoolWide(user: AuthenticatedUser) {
    return [
      "PLATFORM_ADMIN",
      "ORGANIZATION_ADMIN",
      "PRINCIPAL",
      "DISCIPLINARIAN",
      "RELIGIOUS_EDUCATION_MANAGER",
      "GOVERNMENT_EDUCATION_MANAGER",
      "SCHOOL_SUPERVISOR",
    ].some((role) => (user.roles ?? [user.role]).includes(role));
  }

  /** Academic leaders can be organization-wide for classes, but dorm access is explicit. */
  private dormWide(user: AuthenticatedUser) {
    return [
      "PLATFORM_ADMIN",
      "ORGANIZATION_ADMIN",
      "PRINCIPAL",
      "DISCIPLINARIAN",
      "SCHOOL_SUPERVISOR",
    ].some((role) => (user.roles ?? [user.role]).includes(role));
  }

  private assertReviewAccess(user: AuthenticatedUser) {
    if (user.capabilities?.includes("attendance.review")) return;
    if (
      [
        "PRINCIPAL",
        "SCHOOL_SUPERVISOR",
        "ORGANIZATION_ADMIN",
        "PLATFORM_ADMIN",
      ].some((role) => (user.roles ?? [user.role]).includes(role))
    )
      return;
    throw new ApiException(
      403,
      "FORBIDDEN",
      "بررسی دلیل غیبت فقط برای مدیر و ناظر مدرسه مجاز است.",
    );
  }

  private reviewView(row: AttendanceRecord) {
    return {
      id: row.id,
      studentId: row.student.id,
      studentName: row.student.name,
      status: row.status,
      reason: row.note,
      reviewStatus: row.reviewStatus ?? null,
      reviewNote: row.reviewNote,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
      sessionDate: row.session.sessionDate.toISOString(),
      contextType:
        row.session.contextType === "study_group"
          ? "class_group"
          : row.session.contextType,
      contextId: row.session.contextId,
      organizationId: row.session.organization.id,
      organizationName: row.session.organization.name,
      teacherName:
        [row.recordedBy?.firstName, row.recordedBy?.lastName]
          .filter(Boolean)
          .join(" ") ||
        row.recordedBy?.username ||
        "استاد کلاس",
    };
  }

  private async contextOrganizationId(type: AttendanceContextType, id: string) {
    if (type === "class") {
      const row = await this.classes.findOne({
        where: { id },
        relations: { organization: true },
      });
      if (!row)
        throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
      return row.organization.id;
    }
    if (type === "class_group" || type === "study_group") {
      const row = await this.groups.findOne({
        where: { id },
        relations: { organization: true },
      });
      if (!row)
        throw new ApiException(
          404,
          "CLASS_GROUP_NOT_FOUND",
          "گروه کلاس پیدا نشد.",
        );
      return row.organization.id;
    }
    const row = await this.rooms.findOne({
      where: { id },
      relations: { organization: true },
    });
    if (!row)
      throw new ApiException(
        404,
        "DORM_ROOM_NOT_FOUND",
        "اتاق خوابگاه پیدا نشد.",
      );
    return row.organization.id;
  }

  private context(value: string): AttendanceContextType {
    if (
      value === "class" ||
      value === "dorm" ||
      value === "class_group" ||
      value === "study_group"
    )
      return value;
    throw new ApiException(
      422,
      "ATTENDANCE_CONTEXT_INVALID",
      "نوع حضور و غیاب معتبر نیست.",
    );
  }
  /**
   * A scheduled occurrence can only be marked during its published time.
   * This is server-side because a disabled Admin control is not a security
   * boundary. Legacy/manual sessions have no complete range to enforce yet.
   */
  private assertSessionIsActiveForMarking(session: AttendanceSession | null) {
    if (!session?.scheduledStartAt || !session.scheduledEndAt) return;
    const now = Date.now();
    const startsAt = session.scheduledStartAt.getTime();
    const endsAt = session.scheduledEndAt.getTime();
    if (now >= startsAt && now < endsAt) return;
    throw new ApiException(
      409,
      "ATTENDANCE_SESSION_NOT_ACTIVE",
      "ثبت یا تغییر حضور فقط در بازه زمانی همین جلسه مجاز است.",
    );
  }
  private status(value: string) {
    if (value === "present") return AttendanceStatus.PRESENT;
    if (value === "absent") return AttendanceStatus.ABSENT;
    if (value === "late") return AttendanceStatus.LATE;
    if (value === "excused") return AttendanceStatus.EXCUSED;
    throw new ApiException(
      422,
      "ATTENDANCE_STATUS_INVALID",
      "وضعیت حضور معتبر نیست.",
    );
  }
  private studentView(student: Student) {
    return {
      id: student.id,
      name: student.name,
      userId: student.user?.id ?? null,
      nationalCode: student.nationalCode,
      accountStatus: student.accountStatus,
    };
  }
  private userContext(user: AuthenticatedUser): UserContext {
    return {
      ...user,
      roles: user.roles ?? [user.role],
      capabilities: user.capabilities ?? [],
      membershipIds: user.membershipIds ?? [],
      organizationIds: user.organizationIds ?? [],
    };
  }
}
