import type { AttendanceSessionDetail } from "@moshaver/api-contract";
import { attendanceTransaction } from "./attendance-transaction";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { createHash } from "node:crypto";
import { AttendanceWriteReceipt } from "../../database/entities/attendance-write-receipt.entity";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository } from "typeorm";
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
import {
  BulkMarkAttendanceDto,
  CreateAttendanceSessionDto,
  ReviewAttendanceAbsenceDto,
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
      operationalDate: session.operationalDate ?? null,
      sessionDate: session.sessionDate.toISOString(),
      scheduledStartAt: session.scheduledStartAt?.toISOString() ?? null,
      scheduledEndAt: session.scheduledEndAt?.toISOString() ?? null,
      timeZone: session.timeZone,
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
    const canDorm = schoolWide || user.roles?.includes("DISCIPLINARIAN");
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

  /** Schedule owns occurrence identity; attendance owns roster and historical snapshots. */
  async createTimetableSession(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      classroomId: string;
      lessonId: string;
      date: string;
      title: string;
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
        scheduledStartAt: new Date(input.startsAt),
        scheduledEndAt: new Date(input.endsAt),
        timeZone: input.timeZone,
        operationalDate: input.date,
        assignedStaff: input.teacherId ? { id: input.teacherId } : null,
      },
    );
    return { id: created.id };
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

  async bulkMark(user: AuthenticatedUser, dto: BulkMarkAttendanceDto) {
    if (
      dto.entries.some((entry) => entry.status === AttendanceStatus.EXCUSED)
    ) {
      throw new ApiException(
        422,
        "ATTENDANCE_EXCUSE_REQUIRES_REVIEW",
        "ابتدا غیبت را ثبت کنید؛ موجه‌بودن دلیل در مرحله بررسی مشخص می‌شود.",
      );
    }
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

    const { result, recipients, organizationId, contextType, contextId } =
      await this.attendanceTransaction(async (manager) => {
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
              receiptSession?.sourceKind === "class_schedule" &&
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
            };
          }
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
        if (
          session &&
          (session.sourceKind === "class_schedule" ||
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
        if (session?.occurrenceKey)
          throw new ApiException(
            409,
            "ATTENDANCE_SESSION_WORKFLOW_REQUIRED",
            "برای این جلسه از ثبت حضور جلسه با شماره نسخه استفاده کنید.",
          );
        const contextType = session?.contextType ?? dto.contextType;
        const contextId = session?.contextId ?? dto.contextId;
        if (!contextType || !contextId)
          throw new ApiException(
            422,
            "ATTENDANCE_CONTEXT_REQUIRED",
            "کلاس، گروه یا اتاق لازم است.",
          );
        const assignedTeacher =
          session?.sourceKind === "class_schedule" &&
          session.assignedStaff?.id === user.id &&
          user.capabilities?.includes("attendance.class.manage");
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
          const descriptor = await this.contextDescriptor(
            contextType,
            contextId,
          );
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
            changes,
          },
        });
        const members = await manager
          .getRepository(OrganizationMembership)
          .find({
            where: {
              organization: { id: organization.id },
              status: MembershipStatus.ACTIVE,
            },
            relations: { user: true },
          });
        const result = {
          sessionId: session.id,
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
        return {
          result,
          recipients: members.map((member) => member.user.id),
          organizationId: organization.id,
          contextType,
          contextId,
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
    return result;
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
    return rows.map((row) => this.reviewView(row));
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
    return rows.map((row) => this.reviewView(row));
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
    return this.reviewView(saved);
  }

  async listMyAbsenceReviews(user: AuthenticatedUser) {
    const rows = await this.records.find({
      where: { recordedBy: { id: user.id } },
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

  /** Detailed personal attendance profiles are staff-only. Kept as an empty legacy projection. */
  async listSelfRecords(_user: AuthenticatedUser) {
    return [];
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
    if (this.schoolWide(user)) return;
    if (type === "dorm")
      throw new ApiException(
        403,
        "FORBIDDEN",
        "دسترسی خوابگاه برای این نقش مجاز نیست.",
      );
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

  private assertReviewAccess(user: AuthenticatedUser) {
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
