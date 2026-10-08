import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  AttendanceRecord,
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
import { SchoolAccessService } from "../school-access/school-access.service";
import { RealtimeService } from "../realtime/realtime.service";
import {
  BulkMarkAttendanceDto,
  CreateAttendanceSessionDto,
} from "./attendance.dto";

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

  async listContexts(user: AuthenticatedUser, organizationId?: string) {
    const ids = await this.access.scopedOrganizationIds(user, organizationId);
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
          }))
        : []),
    ];
  }

  async listSessions(user: AuthenticatedUser, organizationId?: string) {
    const ids = await this.access.scopedOrganizationIds(user, organizationId);
    if (!ids.length) return [];
    const rows = await this.sessions.find({
      where: { organization: { id: In(ids) } },
      relations: { organization: true, createdBy: true, records: true },
      order: { sessionDate: "DESC" },
    });
    return rows.map((row) => {
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
        contextLabel: "",
        sessionDate: row.sessionDate.toISOString(),
        total,
        ...counts,
        remaining: 0,
        note: row.note,
        createdById: row.createdBy?.id ?? null,
        createdAt: row.createdAt.toISOString(),
      };
    });
  }

  async createSession(
    user: AuthenticatedUser,
    dto: CreateAttendanceSessionDto,
  ) {
    const organization = await this.access.organizationForUser(
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
    const date = new Date(dto.sessionDate);
    const row = await this.sessions.save(
      this.sessions.create({
        organization,
        contextType: dto.contextType,
        contextId: dto.contextId,
        sessionDate: date,
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
    const organization = await this.access.organizationForUser(
      user,
      dto.organizationId,
    );
    if (!dto.entries.length)
      throw new ApiException(
        422,
        "ATTENDANCE_EMPTY",
        "حداقل یک وضعیت حضور ارسال کنید.",
      );
    let session = dto.sessionId
      ? await this.sessions.findOne({
          where: { id: dto.sessionId, organization: { id: organization.id } },
          relations: { organization: true },
        })
      : null;
    if (!session) {
      if (!dto.contextType || !dto.contextId)
        throw new ApiException(
          422,
          "ATTENDANCE_CONTEXT_REQUIRED",
          "کلاس، گروه یا اتاق لازم است.",
        );
      await this.assertContextAccess(
        user,
        dto.contextType,
        dto.contextId,
        organization.id,
        true,
      );
      session = await this.sessions.save(
        this.sessions.create({
          organization,
          contextType: dto.contextType,
          contextId: dto.contextId,
          sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : new Date(),
          note: "",
          createdBy: { id: user.id } as User,
        }),
      );
    } else {
      await this.assertContextAccess(
        user,
        session.contextType,
        session.contextId,
        organization.id,
        true,
      );
    }
    const participants = await this.participantIds(
      user,
      session.contextType,
      session.contextId,
      organization.id,
    );
    if (dto.entries.some((entry) => !participants.has(entry.studentId)))
      throw new ApiException(
        422,
        "ATTENDANCE_STUDENT_NOT_IN_CONTEXT",
        "یک یا چند طلبه عضو این کلاس، گروه یا اتاق نیستند.",
      );

    const saved = [];
    for (const entry of dto.entries) {
      const student = await this.students.findOneBy({ id: entry.studentId });
      if (!student)
        throw new ApiException(404, "STUDENT_NOT_FOUND", "طلبه پیدا نشد.");
      const status = this.status(entry.status);
      let record = await this.records.findOne({
        where: { session: { id: session.id }, student: { id: student.id } },
        relations: { student: true },
      });
      if (!record)
        record = this.records.create({
          session,
          student,
          status,
          note: entry.note?.trim() || "",
          recordedBy: { id: user.id } as User,
        });
      else {
        record.status = status;
        record.note = entry.note?.trim() || "";
        record.recordedBy = { id: user.id } as User;
      }
      saved.push(await this.records.save(record));
    }
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
    const members = await this.memberships.find({
      where: {
        organization: { id: organization.id },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: true },
    });
    this.realtime.emitToUsers(
      members.map((member) => member.user.id),
      "attendance.updated",
      {
        organizationId: organization.id,
        sessionId: session.id,
        contextType: session.contextType,
        contextId: session.contextId,
        updatedBy: user.id,
      },
    );
    return result;
  }

  async listParticipants(
    user: AuthenticatedUser,
    contextType: string,
    contextId: string,
  ) {
    const context = this.context(contextType);
    const organizationId = await this.contextOrganizationId(context, contextId);
    await this.access.organizationForUser(user, organizationId);
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
      });
      if (!student)
        throw new ApiException(
          404,
          "STUDENT_NOT_FOUND",
          "پرونده طلبه پیدا نشد.",
        );
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
      recent: rows.slice(0, 10).map((row) => ({
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

  async listSelfRecords(user: AuthenticatedUser) {
    const student = await this.students.findOne({
      where: { user: { id: user.id } },
    });
    if (!student)
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "پرونده دانش‌آموز پیدا نشد.",
      );
    const rows = await this.records.find({
      where: { student: { id: student.id } },
      relations: { session: { organization: true } },
      order: { createdAt: "DESC" },
      take: 60,
    });
    return rows.map((row) => ({
      id: row.id,
      status: row.status,
      note: row.note,
      sessionDate: row.session.sessionDate.toISOString(),
      contextType:
        row.session.contextType === "study_group"
          ? "class_group"
          : row.session.contextType,
      contextId: row.session.contextId,
      organizationId: row.session.organization.id,
      recordedAt: row.createdAt.toISOString(),
    }));
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

  private schoolWide(user: AuthenticatedUser) {
    return [
      "PLATFORM_ADMIN",
      "ORGANIZATION_ADMIN",
      "PRINCIPAL",
      "DISCIPLINARIAN",
      "RELIGIOUS_EDUCATION_MANAGER",
      "GOVERNMENT_EDUCATION_MANAGER",
      "SCHOOL_SUPERVISOR",
    ].some((role) => user.roles?.includes(role) || user.role === role);
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
