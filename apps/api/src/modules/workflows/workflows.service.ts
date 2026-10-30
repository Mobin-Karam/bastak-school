import { SchoolAccessService } from "../school-access";
import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  AttendanceRecord,
  AttendanceStatus,
} from "../../database/entities/attendance-record.entity";
import {
  AttendanceSession,
  AttendanceContextType,
} from "../../database/entities/attendance-session.entity";
import {
  ExitPermission,
  ExitPermissionStatus,
} from "../../database/entities/exit-permission.entity";
import {
  LeaveRequest,
  LeaveRequestReviewerRole,
  LeaveRequestStatus,
  LeaveRequestType,
} from "../../database/entities/leave-request.entity";
import {
  OrganizationMembership,
  MembershipStatus,
} from "../../database/entities/organization-membership.entity";
import {
  RequestLetter,
  RequestLetterStatus,
} from "../../database/entities/request-letter.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { AuthenticatedUser } from "../auth";
import { RealtimeService } from "../realtime";
import { NotificationsService } from "../notifications";
import {
  isIranianMobile,
  normalizeIranianMobile,
} from "../../common/utils/phone-number";

@Injectable()
export class WorkflowsService {
  constructor(
    @InjectRepository(AttendanceSession)
    private readonly sessions: Repository<AttendanceSession>,
    @InjectRepository(AttendanceRecord)
    private readonly attendanceRecords: Repository<AttendanceRecord>,
    @InjectRepository(LeaveRequest)
    private readonly leaveRequests: Repository<LeaveRequest>,
    @InjectRepository(ExitPermission)
    private readonly exitPermissions: Repository<ExitPermission>,
    @InjectRepository(RequestLetter)
    private readonly letters: Repository<RequestLetter>,
    @InjectRepository(Student) private readonly students: Repository<Student>,
    @InjectRepository(EducationClass)
    private readonly classes: Repository<EducationClass>,
    @InjectRepository(EducationClassEnrollment)
    private readonly classEnrollments: Repository<EducationClassEnrollment>,
    @InjectRepository(StudyGroup)
    private readonly studyGroups: Repository<StudyGroup>,
    @InjectRepository(StudyGroupMembership)
    private readonly studyGroupMemberships: Repository<StudyGroupMembership>,
    @InjectRepository(DormRoom)
    private readonly dormRooms: Repository<DormRoom>,
    @InjectRepository(DormRoomAssignment)
    private readonly dormAssignments: Repository<DormRoomAssignment>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(User) private readonly users: Repository<User>,
    private readonly realtime: RealtimeService,
    private readonly notifications: NotificationsService,
    private readonly access: SchoolAccessService,
  ) {}

  async listAttendanceContexts(
    user: AuthenticatedUser,
    organizationId?: string,
  ) {
    const memberships = await this.activeMemberships(user, organizationId);
    const organizationIds = memberships.map(
      (membership) => membership.organization.id,
    );
    if (!organizationIds.length) {
      return [];
    }
    const effectiveOrgId =
      organizationId && organizationIds.includes(organizationId)
        ? organizationId
        : undefined;
    const orgFilter = effectiveOrgId
      ? { id: effectiveOrgId }
      : { id: In(organizationIds) };

    const [classes, rooms, groups] = await Promise.all([
      this.classes.find({
        where: { organization: orgFilter },
        relations: { organization: true, enrollments: true },
      }),
      this.dormRooms.find({
        where: { organization: orgFilter },
        relations: { organization: true, assignments: true },
      }),
      this.studyGroups.find({
        where: { organization: orgFilter },
        relations: { organization: true, memberships: true },
      }),
    ]);

    return [
      ...classes.map((item) => ({
        id: item.id,
        contextType: "class" as const,
        code: item.code,
        name: item.name,
        label: `${item.name} (${item.code})`,
        total: item.enrollments?.length ?? 0,
        activeOrganizationId: item.organization.id,
      })),
      ...rooms.map((item) => ({
        id: item.id,
        contextType: "dorm" as const,
        code: item.code,
        name: item.name,
        label: `${item.name} (${item.code})`,
        total: item.assignments?.length ?? 0,
        activeOrganizationId: item.organization.id,
      })),
      ...groups.map((item) => ({
        id: item.id,
        contextType: "study_group" as const,
        code: item.code,
        name: item.name,
        label: `${item.name} (${item.code})`,
        total: item.memberships?.length ?? 0,
        activeOrganizationId: item.organization.id,
      })),
    ];
  }

  async listDormRooms(user: AuthenticatedUser, organizationId?: string) {
    const memberships = await this.activeMemberships(user, organizationId);
    const organizationIds = memberships.map(
      (membership) => membership.organization.id,
    );
    if (!organizationIds.length) {
      return [];
    }
    const effectiveOrgId =
      organizationId && organizationIds.includes(organizationId)
        ? organizationId
        : undefined;
    const rooms = await this.dormRooms.find({
      where: effectiveOrgId
        ? { organization: { id: effectiveOrgId } }
        : { organization: { id: In(organizationIds) } },
      relations: { organization: true, assignments: { student: true } },
      order: { name: "ASC" },
    });

    return rooms.map((room) => ({
      id: room.id,
      organizationId: room.organization.id,
      organizationName: room.organization.name,
      code: room.code,
      name: room.name,
      capacity: room.capacity,
      status: room.status,
      studentCount: room.assignments?.length ?? 0,
    }));
  }

  async createDormRoom(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      code: string;
      name: string;
      capacity?: number;
    },
  ) {
    const organization = await this.organizationForUser(
      user,
      input.organizationId,
    );
    const code = (input.code || "").trim();
    const name = (input.name || "").trim();
    if (!code || !name) {
      throw new ApiException(
        400,
        "DORM_ROOM_INVALID",
        "کد و نام اتاق خوابگاه الزامی است.",
      );
    }
    const existing = await this.dormRooms.findOne({
      where: { organization: { id: organization.id }, code },
    });
    if (existing) {
      throw new ApiException(
        409,
        "DORM_ROOM_EXISTS",
        "این کد اتاق در سازمان تکراری است.",
      );
    }
    const room = await this.dormRooms.save(
      this.dormRooms.create({
        organization,
        code,
        name,
        capacity: Math.max(1, Number(input.capacity ?? 1) || 1),
        status: "ACTIVE",
      }),
    );
    return {
      id: room.id,
      organizationId: room.organization.id,
      code: room.code,
      name: room.name,
      capacity: room.capacity,
      status: room.status,
      studentCount: 0,
    };
  }

  async listDormAssignments(user: AuthenticatedUser, roomId: string) {
    const room = await this.requireDormRoom(user, roomId);
    const rows = await this.dormAssignments.find({
      where: { room: { id: room.id } },
      relations: { student: { user: true } },
      order: { createdAt: "DESC" },
    });
    return rows.map((row) => ({
      id: row.id,
      studentId: row.student.id,
      name: row.student.name,
      nationalCode: row.student.nationalCode,
      userId: row.student.user?.id || null,
    }));
  }

  async setDormAssignments(
    user: AuthenticatedUser,
    roomId: string,
    studentIds: string[],
  ) {
    const room = await this.requireDormRoom(user, roomId);
    const uniqueStudentIds = [...new Set((studentIds || []).filter(Boolean))];
    if (!uniqueStudentIds.length) {
      await this.dormAssignments.delete({ room: { id: room.id } });
      return { roomId: room.id, count: 0 };
    }
    const students = await this.students.find({
      where: { id: In(uniqueStudentIds) },
      relations: { user: true },
    });
    if (students.length !== uniqueStudentIds.length) {
      throw new ApiException(
        400,
        "DORM_STUDENT_NOT_FOUND",
        "یکی از دانش‌آموزان پیدا نشد.",
      );
    }
    const validStudentIds = new Set<string>();
    for (const student of students) {
      if (!student.user?.id) continue;
      const membership = await this.memberships.findOne({
        where: {
          user: { id: student.user.id },
          organization: { id: room.organization.id },
          status: MembershipStatus.ACTIVE,
        },
        relations: { user: true, organization: true },
      });
      if (membership) validStudentIds.add(student.id);
    }
    if (validStudentIds.size !== uniqueStudentIds.length) {
      throw new ApiException(
        403,
        "DORM_STUDENT_FORBIDDEN",
        "بعضی از دانش‌آموزان به این سازمان تعلق ندارند.",
      );
    }
    if (uniqueStudentIds.length > room.capacity) {
      throw new ApiException(
        400,
        "DORM_ROOM_CAPACITY",
        "تعداد دانش‌آموزان بیشتر از ظرفیت اتاق است.",
      );
    }

    await this.dormAssignments.delete({ room: { id: room.id } });
    const saved = await Promise.all(
      uniqueStudentIds.map(async (studentId) =>
        this.dormAssignments.save(
          this.dormAssignments.create({
            room,
            student: { id: studentId } as Student,
          }),
        ),
      ),
    );
    return { roomId: room.id, count: saved.length };
  }

  async listAttendanceSessions(
    user: AuthenticatedUser,
    organizationId?: string,
  ) {
    const memberships = await this.activeMemberships(user, organizationId);
    const organizationIds = memberships.map(
      (membership) => membership.organization.id,
    );
    if (!organizationIds.length) {
      return [];
    }
    const effectiveOrgId =
      organizationId && organizationIds.includes(organizationId)
        ? organizationId
        : undefined;
    const rows = await this.sessions.find({
      where: effectiveOrgId
        ? { organization: { id: effectiveOrgId } }
        : { organization: { id: In(organizationIds) } },
      relations: { organization: true, createdBy: true },
      order: { sessionDate: "DESC" },
    });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organization.id,
      organizationName: row.organization.name,
      contextType: row.contextType,
      contextId: row.contextId,
      sessionDate: row.sessionDate.toISOString(),
      note: row.note,
      createdById: row.createdBy?.id || null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createAttendanceSession(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      contextType: string;
      contextId: string;
      sessionDate: string;
      note?: string;
    },
  ) {
    const organization = await this.organizationForUser(
      user,
      input.organizationId,
    );
    const contextType = this.parseContextType(input.contextType);
    const date = new Date(input.sessionDate);
    if (Number.isNaN(date.getTime())) {
      throw new ApiException(
        400,
        "ATTENDANCE_DATE_INVALID",
        "تاریخ جلسه معتبر نیست.",
      );
    }
    const row = await this.sessions.save(
      this.sessions.create({
        organization,
        contextType,
        contextId: input.contextId.trim(),
        sessionDate: date,
        note: input.note?.trim() || "",
        createdBy: { id: user.id } as User,
      }),
    );
    return {
      id: row.id,
      organizationId: row.organization.id,
      contextType: row.contextType,
      contextId: row.contextId,
      sessionDate: row.sessionDate.toISOString(),
      note: row.note,
    };
  }

  async bulkMarkAttendance(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      sessionId?: string;
      contextType?: string;
      contextId?: string;
      sessionDate?: string;
      entries: Array<{ studentId: string; status?: string; note?: string }>;
    },
  ) {
    const organization = await this.organizationForUser(
      user,
      input.organizationId,
    );
    if (!input.entries?.length) {
      throw new ApiException(
        400,
        "ATTENDANCE_EMPTY",
        "هیچ ورودی حضوری ارسال نشده است.",
      );
    }
    let session = input.sessionId
      ? await this.sessions.findOne({
          where: { id: input.sessionId, organization: { id: organization.id } },
          relations: { organization: true },
        })
      : null;
    if (!session) {
      const contextType = input.contextType
        ? this.parseContextType(input.contextType)
        : "class";
      const date = input.sessionDate ? new Date(input.sessionDate) : new Date();
      if (Number.isNaN(date.getTime())) {
        throw new ApiException(
          400,
          "ATTENDANCE_DATE_INVALID",
          "تاریخ جلسه معتبر نیست.",
        );
      }
      session = await this.sessions.save(
        this.sessions.create({
          organization,
          contextType,
          contextId: input.contextId?.trim() || "default",
          sessionDate: date,
          note: "",
          createdBy: { id: user.id } as User,
        }),
      );
    }

    const created = await Promise.all(
      input.entries.map(async (entry) => {
        const student = await this.students.findOne({
          where: { id: entry.studentId },
          relations: { user: true },
        });
        if (!student) {
          throw new ApiException(
            404,
            "STUDENT_NOT_FOUND",
            "دانش‌آموز مورد نظر پیدا نشد.",
          );
        }
        const status = this.parseAttendanceStatus(entry.status || "present");
        const existing = await this.attendanceRecords.findOne({
          where: { session: { id: session!.id }, student: { id: student.id } },
        });
        if (existing) {
          existing.status = status;
          existing.note = entry.note?.trim() || existing.note || "";
          existing.recordedBy = { id: user.id } as User;
          return this.attendanceRecords.save(existing);
        }
        return this.attendanceRecords.save(
          this.attendanceRecords.create({
            session,
            student,
            status,
            note: entry.note?.trim() || "",
            recordedBy: { id: user.id } as User,
          }),
        );
      }),
    );

    return {
      sessionId: session.id,
      count: created.length,
      records: created.map((item) => ({
        id: item.id,
        studentId: item.student.id,
        status: item.status,
        note: item.note,
      })),
    };
  }

  async listContextParticipants(
    user: AuthenticatedUser,
    contextType: string,
    contextId: string,
  ) {
    const context = this.parseContextType(contextType);
    const organizationId = await this.resolveOrganizationIdForContext(
      user,
      context,
      contextId,
    );
    const organization = await this.organizationForUser(user, organizationId);

    if (context === "class") {
      const classroom = await this.classes.findOne({
        where: { id: contextId, organization: { id: organization.id } },
        relations: { organization: true },
      });
      if (!classroom) {
        throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
      }
      const rows = await this.classEnrollments.find({
        where: { classroom: { id: classroom.id } },
        relations: { student: { user: true } },
        order: { createdAt: "DESC" },
      });
      return rows.map((row) => ({
        id: row.student.id,
        name: row.student.name,
        userId: row.student.user?.id || null,
        nationalCode: row.student.nationalCode,
        accountStatus: row.student.accountStatus,
      }));
    }

    if (context === "study_group") {
      const group = await this.studyGroups.findOne({
        where: { id: contextId, organization: { id: organization.id } },
        relations: { organization: true },
      });
      if (!group) {
        throw new ApiException(
          404,
          "STUDY_GROUP_NOT_FOUND",
          "گروه درسی پیدا نشد.",
        );
      }
      const rows = await this.studyGroupMemberships.find({
        where: { group: { id: group.id } },
        relations: { student: { user: true } },
        order: { createdAt: "DESC" },
      });
      return rows.map((row) => ({
        id: row.student.id,
        name: row.student.name,
        userId: row.student.user?.id || null,
        nationalCode: row.student.nationalCode,
        accountStatus: row.student.accountStatus,
      }));
    }

    if (context === "dorm") {
      const room = await this.dormRooms.findOne({
        where: { id: contextId, organization: { id: organization.id } },
        relations: { organization: true },
      });
      if (!room) {
        throw new ApiException(
          404,
          "DORM_ROOM_NOT_FOUND",
          "اتاق خوابگاه پیدا نشد.",
        );
      }
      const rows = await this.dormAssignments.find({
        where: { room: { id: room.id } },
        relations: { student: { user: true } },
        order: { createdAt: "DESC" },
      });
      return rows.map((row) => ({
        id: row.student.id,
        name: row.student.name,
        userId: row.student.user?.id || null,
        nationalCode: row.student.nationalCode,
        accountStatus: row.student.accountStatus,
      }));
    }

    return [];
  }

  async getStudentAttendanceSummary(
    user: AuthenticatedUser,
    studentId?: string,
  ) {
    const targetStudentId =
      studentId || (await this.studentForUser(user.id)).id;
    const records = await this.attendanceRecords.find({
      where: { student: { id: targetStudentId } },
      relations: { session: { organization: true } },
      order: { createdAt: "DESC" },
    });
    const summary = {
      present: 0,
      absent: 0,
      late: 0,
      excused: 0,
      total: records.length,
    };
    for (const record of records) {
      if (record.status === AttendanceStatus.PRESENT) summary.present += 1;
      if (record.status === AttendanceStatus.ABSENT) summary.absent += 1;
      if (record.status === AttendanceStatus.LATE) summary.late += 1;
      if (record.status === AttendanceStatus.EXCUSED) summary.excused += 1;
    }
    return {
      studentId: targetStudentId,
      totalSessions: summary.total,
      present: summary.present,
      absent: summary.absent,
      late: summary.late,
      excused: summary.excused,
      recent: records.slice(0, 10).map((record) => ({
        id: record.id,
        sessionId: record.session.id,
        status: record.status,
        sessionDate: record.session.sessionDate.toISOString(),
        contextType: record.session.contextType,
        contextId: record.session.contextId,
        organizationId: record.session.organization.id,
        recordedAt: record.createdAt.toISOString(),
      })),
    };
  }

  async listLeaveRequests(user: AuthenticatedUser, organizationId?: string) {
    const memberships = await this.activeMemberships(user, organizationId);
    const organizationIds = memberships.map(
      (membership) => membership.organization.id,
    );
    const requestedOrgId =
      organizationId && organizationIds.includes(organizationId)
        ? organizationId
        : undefined;
    const reviewScope = this.leaveReviewScope(user);
    const rows = await this.leaveRequests.find({
      where:
        reviewScope === "all"
          ? requestedOrgId
            ? { organization: { id: requestedOrgId } }
            : { organization: { id: In(organizationIds) } }
          : reviewScope === "supervisor"
            ? requestedOrgId
              ? {
                  organization: { id: requestedOrgId },
                  reviewerRole: LeaveRequestReviewerRole.SCHOOL_SUPERVISOR,
                }
              : {
                  organization: { id: In(organizationIds) },
                  reviewerRole: LeaveRequestReviewerRole.SCHOOL_SUPERVISOR,
                }
            : { student: { user: { id: user.id } } },
      relations: {
        organization: true,
        student: { user: true },
        approver: true,
      },
      order: { createdAt: "DESC" },
    });
    return rows.map((row) => this.serializeLeaveRequest(row));
  }

  async createLeaveRequest(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      leaveType?: string;
      startDate: string;
      endDate: string;
      reason: string;
      note?: string;
      includesLunch?: boolean;
      includesDinner?: boolean;
      attachments?: string[];
    },
  ) {
    const student = await this.studentForUser(user.id);
    const organization = await this.organizationForUser(
      user,
      input.organizationId,
    );
    const startDate = new Date(input.startDate);
    const endDate = new Date(input.endDate);
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      throw new ApiException(
        400,
        "LEAVE_DATE_INVALID",
        "تاریخ شروع یا پایان مرخصی معتبر نیست.",
      );
    }
    if (endDate <= startDate) {
      throw new ApiException(
        400,
        "LEAVE_DATE_RANGE_INVALID",
        "زمان پایان باید بعد از زمان شروع باشد.",
      );
    }
    if (!input.reason?.trim()) {
      throw new ApiException(
        400,
        "LEAVE_REASON_REQUIRED",
        "دلیل مرخصی الزامی است.",
      );
    }
    const leaveType = this.parseLeaveRequestType(input.leaveType);
    const reviewerRole =
      leaveType === LeaveRequestType.SCHOOL_EXIT
        ? LeaveRequestReviewerRole.SCHOOL_SUPERVISOR
        : LeaveRequestReviewerRole.PRINCIPAL;
    const row = await this.leaveRequests.save(
      this.leaveRequests.create({
        organization,
        student,
        leaveType,
        reviewerRole,
        startDate,
        endDate,
        reason: input.reason.trim(),
        note: input.note?.trim() || "",
        includesLunch: input.includesLunch === true,
        includesDinner: input.includesDinner === true,
        attachments: Array.isArray(input.attachments)
          ? input.attachments.filter(Boolean)
          : [],
        status: LeaveRequestStatus.PENDING,
      }),
    );
    await this.notifyRequestReviewers(
      organization.id,
      reviewerRole,
      "درخواست جدید دانش‌آموز",
      `درخواست ${leaveType === LeaveRequestType.SCHOOL_EXIT ? "خروج" : "مرخصی"} برای بررسی ثبت شد.`,
      `/admin/leave-requests?requestId=${row.id}`,
    );
    return this.serializeLeaveRequest(row);
  }

  async reviewLeaveRequest(
    user: AuthenticatedUser,
    leaveRequestId: string,
    input: { status: string; note?: string },
  ) {
    const row = await this.leaveRequests.findOne({
      where: { id: leaveRequestId },
      relations: {
        organization: true,
        student: { user: true },
        approver: true,
      },
    });
    if (!row) {
      throw new ApiException(
        404,
        "LEAVE_REQUEST_NOT_FOUND",
        "درخواست مرخصی پیدا نشد.",
      );
    }
    await this.organizationForUser(user, row.organization.id);
    this.assertLeaveRequestReviewer(user, row);
    const status = this.parseLeaveStatus(input.status);
    row.status = status;
    row.note = input.note?.trim() || row.note || "";
    row.approver = { id: user.id } as User;
    row.reviewedAt = new Date();
    if (
      status === LeaveRequestStatus.APPROVED &&
      row.leaveType === LeaveRequestType.LEAVE &&
      !row.exitPermissionId
    ) {
      const exit = await this.exitPermissions.save(
        this.exitPermissions.create({
          organization: row.organization,
          student: row.student,
          requestedDepartureAt: row.startDate,
          expectedReturnAt: row.endDate,
          destination: "مرخصی تأییدشده دانش‌آموز",
          reason: row.reason,
          note: row.note,
          status: ExitPermissionStatus.APPROVED,
          approver: { id: user.id } as User,
          reviewedAt: row.reviewedAt,
        }),
      );
      row.exitPermissionId = exit.id;
    }
    const saved = await this.leaveRequests.save(row);
    return this.serializeLeaveRequest(saved);
  }

  async listExitPermissions(user: AuthenticatedUser, organizationId?: string) {
    const memberships = await this.activeMemberships(user, organizationId);
    const organizationIds = memberships.map(
      (membership) => membership.organization.id,
    );
    const requestedOrgId =
      organizationId && organizationIds.includes(organizationId)
        ? organizationId
        : undefined;
    const rows = await this.exitPermissions.find({
      where: this.canReviewSchoolWorkflows(user)
        ? requestedOrgId
          ? { organization: { id: requestedOrgId } }
          : { organization: { id: In(organizationIds) } }
        : { student: { user: { id: user.id } } },
      relations: {
        organization: true,
        student: { user: true },
        approver: true,
        returnVerifiedBy: true,
      },
      order: { createdAt: "DESC" },
    });
    return rows.map((row) => this.serializeExitPermission(row));
  }

  async createExitPermission(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      destination: string;
      reason: string;
      requestedDepartureAt: string;
      expectedReturnAt?: string;
      note?: string;
    },
  ) {
    const student = await this.studentForUser(user.id);
    const organization = await this.organizationForUser(
      user,
      input.organizationId,
    );
    const departure = new Date(input.requestedDepartureAt);
    if (Number.isNaN(departure.getTime())) {
      throw new ApiException(
        400,
        "EXIT_DEPARTURE_INVALID",
        "زمان خروج معتبر نیست.",
      );
    }
    const expectedReturn = input.expectedReturnAt
      ? new Date(input.expectedReturnAt)
      : null;
    if (expectedReturn && Number.isNaN(expectedReturn.getTime())) {
      throw new ApiException(
        400,
        "EXIT_RETURN_INVALID",
        "زمان بازگشت معتبر نیست.",
      );
    }
    const row = await this.exitPermissions.save(
      this.exitPermissions.create({
        organization,
        student,
        destination: input.destination.trim(),
        reason: input.reason.trim(),
        requestedDepartureAt: departure,
        expectedReturnAt: expectedReturn,
        note: input.note?.trim() || "",
        status: ExitPermissionStatus.PENDING,
      }),
    );
    await this.notifyRequestReviewers(
      organization.id,
      LeaveRequestReviewerRole.SCHOOL_SUPERVISOR,
      "درخواست خروج جدید",
      "یک درخواست خروج دانش‌آموز برای بررسی ثبت شد.",
      `/admin/exit-permissions?requestId=${row.id}`,
    );
    return this.serializeExitPermission(row);
  }

  async reviewExitPermission(
    user: AuthenticatedUser,
    exitPermissionId: string,
    input: { status: string; note?: string },
  ) {
    const row = await this.exitPermissions.findOne({
      where: { id: exitPermissionId },
      relations: {
        organization: true,
        student: { user: true },
        approver: true,
        returnVerifiedBy: true,
      },
    });
    if (!row) {
      throw new ApiException(
        404,
        "EXIT_PERMISSION_NOT_FOUND",
        "درخواست مجوز خروج پیدا نشد.",
      );
    }
    await this.organizationForUser(user, row.organization.id);
    this.assertWorkflowReviewer(user);
    const status = this.parseExitStatus(input.status);
    row.status = status;
    row.note = input.note?.trim() || row.note || "";
    row.approver = { id: user.id } as User;
    row.reviewedAt = new Date();
    const saved = await this.exitPermissions.save(row);
    return this.serializeExitPermission(saved);
  }

  /**
   * A dorm review never mutates its historical attendance record. Instead, an
   * explicit physical-departure permission becomes the occupancy source of
   * truth, preserving both the original absence and the principal's decision.
   */
  async markDormAbsenceOutsideSchool(
    user: AuthenticatedUser,
    recordId: string,
    note?: string,
  ) {
    const roles = user.roles?.length ? user.roles : [user.role];
    if (
      !roles.some((role) =>
        ["PRINCIPAL", "ORGANIZATION_ADMIN", "PLATFORM_ADMIN"].includes(role),
      )
    )
      throw new ApiException(
        403,
        "DORM_OUTSIDE_SCHOOL_PRINCIPAL_ONLY",
        "این اقدام فقط برای مدیر مدرسه مجاز است.",
      );
    const record = await this.attendanceRecords.findOne({
      where: { id: recordId },
      relations: { session: { organization: true }, student: true },
    });
    if (!record || record.session.contextType !== "dorm")
      throw new ApiException(
        404,
        "DORM_ABSENCE_NOT_FOUND",
        "غیبت خوابگاه پیدا نشد.",
      );
    await this.organizationForUser(user, record.session.organization.id);
    if (record.reviewStatus !== "approved")
      throw new ApiException(
        409,
        "DORM_ABSENCE_REVIEW_REQUIRED",
        "ابتدا غیبت خوابگاه را تأیید کنید.",
      );
    const existing = await this.exitPermissions
      .createQueryBuilder("exit")
      .where("exit.organizationId = :organizationId", {
        organizationId: record.session.organization.id,
      })
      .andWhere("exit.studentId = :studentId", { studentId: record.student.id })
      .andWhere("exit.status = :status", {
        status: ExitPermissionStatus.APPROVED,
      })
      .andWhere("exit.actualDepartureAt IS NOT NULL")
      .andWhere("exit.actualReturnAt IS NULL")
      .getOne();
    if (existing) return this.serializeExitPermission(existing);
    const now = new Date();
    const saved = await this.exitPermissions.save(
      this.exitPermissions.create({
        organization: record.session.organization,
        student: record.student,
        destination: "خارج از مدرسه — بررسی غیبت خوابگاه",
        reason: "ثبت خارج از مدرسه از بررسی تأییدشده غیبت خوابگاه",
        requestedDepartureAt: record.session.sessionDate,
        actualDepartureAt: now,
        note:
          note?.trim() ||
          `غیبت خوابگاه در جلسه ${record.session.id} توسط مدیر بررسی شد.`,
        status: ExitPermissionStatus.APPROVED,
        approver: { id: user.id } as User,
        reviewedAt: now,
      }),
    );
    await this.emitOccupancyUpdate(
      record.session.organization.id,
      saved.id,
      "departure-recorded",
    );
    return this.serializeExitPermission(saved);
  }

  /** A student can report their return, but cannot place themselves back in occupancy. */
  async requestExitReturn(
    user: AuthenticatedUser,
    exitPermissionId: string,
    note?: string,
  ) {
    const row = await this.exitPermissions.findOne({
      where: { id: exitPermissionId },
      relations: {
        organization: true,
        student: { user: true },
        approver: true,
        returnVerifiedBy: true,
      },
    });
    if (!row) {
      throw new ApiException(
        404,
        "EXIT_PERMISSION_NOT_FOUND",
        "مجوز خروج پیدا نشد.",
      );
    }
    if (row.student.user?.id !== user.id) {
      throw new ApiException(
        403,
        "EXIT_RETURN_REQUEST_FORBIDDEN",
        "فقط خود دانش‌آموز می‌تواند بازگشت را درخواست کند.",
      );
    }
    await this.organizationForUser(user, row.organization.id);
    if (
      row.status !== ExitPermissionStatus.APPROVED ||
      !row.actualDepartureAt
    ) {
      throw new ApiException(
        409,
        "EXIT_NOT_DEPARTED",
        "بازگشت فقط پس از ثبت خروج امکان‌پذیر است.",
      );
    }
    if (row.actualReturnAt) {
      throw new ApiException(
        409,
        "EXIT_ALREADY_RETURNED",
        "برای این مجوز بازگشت ثبت شده است.",
      );
    }
    if (row.returnRequestedAt) {
      throw new ApiException(
        409,
        "EXIT_RETURN_ALREADY_REQUESTED",
        "درخواست بازگشت قبلاً ارسال شده است.",
      );
    }
    row.returnRequestedAt = new Date();
    row.returnRequestNote = note?.trim() || "";
    const saved = await this.exitPermissions.save(row);
    await this.emitOccupancyUpdate(
      row.organization.id,
      row.id,
      "return-requested",
    );
    return this.serializeExitPermission(saved);
  }

  /**
   * Gate-only fallback for students who cannot open the app. This both grants
   * the permission and records the physical departure, so occupancy remains
   * derived from movements rather than an untracked verbal approval.
   */
  async recordGateDeparture(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      phoneNumber: string;
      destination?: string;
      reason?: string;
      expectedReturnAt?: string;
    },
  ) {
    this.assertWorkflowReviewer(user);
    const organization = await this.organizationForUser(
      user,
      input.organizationId,
    );
    const student = await this.studentForPhoneInOrganization(
      input.phoneNumber,
      organization.id,
    );
    const existing = await this.exitPermissions
      .createQueryBuilder("exit")
      .where("exit.organizationId = :organizationId", {
        organizationId: organization.id,
      })
      .andWhere("exit.studentId = :studentId", { studentId: student.id })
      .andWhere("exit.status = :status", {
        status: ExitPermissionStatus.APPROVED,
      })
      .andWhere("exit.actualDepartureAt IS NOT NULL")
      .andWhere("exit.actualReturnAt IS NULL")
      .getOne();
    if (existing) {
      throw new ApiException(
        409,
        "STUDENT_ALREADY_OUT",
        "برای این دانش‌آموز خروج فعال ثبت شده است.",
      );
    }
    const expectedReturnAt = input.expectedReturnAt
      ? new Date(input.expectedReturnAt)
      : null;
    if (expectedReturnAt && Number.isNaN(expectedReturnAt.getTime())) {
      throw new ApiException(
        400,
        "EXIT_RETURN_INVALID",
        "زمان بازگشت معتبر نیست.",
      );
    }
    const now = new Date();
    const saved = await this.exitPermissions.save(
      this.exitPermissions.create({
        organization,
        student,
        destination: input.destination?.trim() || "خروج با تأیید مدرسه",
        reason: input.reason?.trim() || "ثبت مستقیم توسط مسئول مدرسه",
        requestedDepartureAt: now,
        expectedReturnAt,
        actualDepartureAt: now,
        note: "مجوز و خروج فیزیکی توسط مسئول مدرسه ثبت شد.",
        status: ExitPermissionStatus.APPROVED,
        approver: { id: user.id } as User,
        reviewedAt: now,
      }),
    );
    await this.emitOccupancyUpdate(
      organization.id,
      saved.id,
      "departure-recorded",
    );
    return this.serializeExitPermission(saved);
  }

  /** Gate staff confirm physical return by a student's phone when app access is unavailable. */
  async recordGateReturn(
    user: AuthenticatedUser,
    input: { organizationId: string; phoneNumber: string; note?: string },
  ) {
    this.assertWorkflowReviewer(user);
    const organization = await this.organizationForUser(
      user,
      input.organizationId,
    );
    const student = await this.studentForPhoneInOrganization(
      input.phoneNumber,
      organization.id,
    );
    const row = await this.exitPermissions
      .createQueryBuilder("exit")
      .leftJoinAndSelect("exit.organization", "organization")
      .leftJoinAndSelect("exit.student", "student")
      .leftJoinAndSelect("exit.approver", "approver")
      .leftJoinAndSelect("exit.returnVerifiedBy", "returnVerifiedBy")
      .where("exit.organizationId = :organizationId", {
        organizationId: organization.id,
      })
      .andWhere("exit.studentId = :studentId", { studentId: student.id })
      .andWhere("exit.status = :status", {
        status: ExitPermissionStatus.APPROVED,
      })
      .andWhere("exit.actualDepartureAt IS NOT NULL")
      .andWhere("exit.actualReturnAt IS NULL")
      .orderBy("exit.actualDepartureAt", "DESC")
      .getOne();
    if (!row) {
      throw new ApiException(
        409,
        "STUDENT_NOT_OUT",
        "برای این دانش‌آموز خروج فعال ثبت نشده است.",
      );
    }
    const now = new Date();
    row.returnRequestedAt = row.returnRequestedAt ?? now;
    row.returnRequestNote =
      input.note?.trim() || "بازگشت حضوری توسط مسئول مدرسه ثبت شد.";
    row.actualReturnAt = now;
    row.returnVerifiedBy = { id: user.id } as User;
    row.returnVerifiedAt = now;
    row.status = ExitPermissionStatus.COMPLETED;
    const saved = await this.exitPermissions.save(row);
    await this.emitOccupancyUpdate(
      organization.id,
      saved.id,
      "return-confirmed",
    );
    return this.serializeExitPermission(saved);
  }

  /** A supervisor may record the physical gate event. Scheduled approved leave
   * also affects occupancy at its requested departure time, until return is recorded. */
  async recordExitMovement(
    user: AuthenticatedUser,
    exitPermissionId: string,
    movement: "departure" | "return",
  ) {
    const row = await this.exitPermissions.findOne({
      where: { id: exitPermissionId },
      relations: {
        organization: true,
        student: { user: true },
        approver: true,
        returnVerifiedBy: true,
      },
    });
    if (!row)
      throw new ApiException(
        404,
        "EXIT_PERMISSION_NOT_FOUND",
        "مجوز خروج پیدا نشد.",
      );
    await this.organizationForUser(user, row.organization.id);
    this.assertWorkflowReviewer(user);
    if (movement === "departure") {
      if (row.status !== ExitPermissionStatus.APPROVED)
        throw new ApiException(
          409,
          "EXIT_NOT_APPROVED",
          "فقط مجوز تأییدشده قابل ثبت خروج است.",
        );
      if (row.actualReturnAt)
        throw new ApiException(
          409,
          "EXIT_ALREADY_RETURNED",
          "برای این مجوز بازگشت ثبت شده است.",
        );
      row.actualDepartureAt = row.actualDepartureAt ?? new Date();
    } else {
      if (!row.actualDepartureAt)
        throw new ApiException(
          409,
          "EXIT_NOT_DEPARTED",
          "ابتدا خروج دانش‌آموز را ثبت کنید.",
        );
      if (!row.returnRequestedAt)
        throw new ApiException(
          409,
          "EXIT_RETURN_NOT_REQUESTED",
          "دانش‌آموز باید ابتدا درخواست بازگشت را ثبت کند.",
        );
      row.actualReturnAt = new Date();
      row.status = ExitPermissionStatus.COMPLETED;
      row.returnVerifiedBy = { id: user.id } as User;
      row.returnVerifiedAt = new Date();
    }
    const saved = await this.exitPermissions.save(row);
    await this.emitOccupancyUpdate(
      row.organization.id,
      row.id,
      movement === "departure" ? "departure-recorded" : "return-confirmed",
    );
    return this.serializeExitPermission(saved);
  }

  async occupancy(user: AuthenticatedUser, organizationId?: string) {
    const memberships = await this.activeMemberships(user, organizationId);
    const ids = memberships.map((membership) => membership.organization.id);
    if (!ids.length) return [];
    const scoped = organizationId
      ? ids.includes(organizationId)
        ? [organizationId]
        : []
      : ids;
    const result = [];
    for (const id of scoped) {
      const total = await this.students.count({
        where: { organization: { id }, accountStatus: "active" },
      });
      // TypeORM's object where cannot express IS NOT NULL and IS NULL together reliably across SQLite versions.
      const rows = await this.exitPermissions
        .createQueryBuilder("exit")
        .where("exit.organizationId = :id", { id })
        .andWhere("exit.status = :status", {
          status: ExitPermissionStatus.APPROVED,
        })
        .andWhere(
          "(exit.actualDepartureAt IS NOT NULL OR exit.requestedDepartureAt <= :now)",
          {
            now: new Date().toISOString(),
          },
        )
        .andWhere("exit.actualReturnAt IS NULL")
        .getCount();
      result.push({
        organizationId: id,
        totalStudents: total,
        currentlyOut: rows,
        currentlyInSchool: Math.max(0, total - rows),
        generatedAt: new Date().toISOString(),
      });
    }
    return result;
  }

  private canReviewSchoolWorkflows(user: AuthenticatedUser) {
    return [
      "PLATFORM_ADMIN",
      "ORGANIZATION_ADMIN",
      "PRINCIPAL",
      "DISCIPLINARIAN",
      "SCHOOL_ADMIN",
      "SCHOOL_SUPERVISOR",
    ].some((role) => user.roles?.includes(role) || user.role === role);
  }

  /** Principals retain the school-wide audit view; supervisors receive only gate-exit requests. */
  private leaveReviewScope(
    user: AuthenticatedUser,
  ): "all" | "supervisor" | "own" {
    if (
      this.hasAnyRole(user, [
        "PLATFORM_ADMIN",
        "ORGANIZATION_ADMIN",
        "PRINCIPAL",
        "SCHOOL_ADMIN",
      ])
    ) {
      return "all";
    }
    if (this.hasAnyRole(user, ["SCHOOL_SUPERVISOR", "DISCIPLINARIAN"])) {
      return "supervisor";
    }
    return "own";
  }

  private assertLeaveRequestReviewer(
    user: AuthenticatedUser,
    request: LeaveRequest,
  ) {
    const scope = this.leaveReviewScope(user);
    if (
      scope === "all" ||
      (scope === "supervisor" &&
        request.reviewerRole === LeaveRequestReviewerRole.SCHOOL_SUPERVISOR)
    ) {
      return;
    }
    throw new ApiException(
      403,
      "LEAVE_REQUEST_REVIEW_FORBIDDEN",
      "این درخواست باید توسط مسئول تعیین‌شده بررسی شود.",
    );
  }

  private hasAnyRole(user: AuthenticatedUser, roles: readonly string[]) {
    return roles.some(
      (role) => user.roles?.includes(role) || user.role === role,
    );
  }

  private assertWorkflowReviewer(user: AuthenticatedUser) {
    if (!this.canReviewSchoolWorkflows(user))
      throw new ApiException(
        403,
        "WORKFLOW_REVIEW_FORBIDDEN",
        "فقط مدیریت یا ناظم مدرسه می‌تواند این عملیات را انجام دهد.",
      );
  }

  async listLetters(user: AuthenticatedUser, organizationId?: string) {
    const memberships = await this.activeMemberships(user, organizationId);
    const organizationIds = memberships.map(
      (membership) => membership.organization.id,
    );
    const requestedOrgId =
      organizationId && organizationIds.includes(organizationId)
        ? organizationId
        : undefined;
    const rows = await this.letters.find({
      where: requestedOrgId
        ? { organization: { id: requestedOrgId } }
        : { organization: { id: In(organizationIds) } },
      relations: { organization: true, sender: true, recipient: true },
      order: { createdAt: "DESC" },
    });
    return rows.map((row) => ({
      id: row.id,
      organizationId: row.organization.id,
      organizationName: row.organization.name,
      senderId: row.sender?.id || null,
      senderName: row.sender
        ? `${row.sender.firstName} ${row.sender.lastName}`.trim() ||
          row.sender.username
        : null,
      recipientId: row.recipient?.id || null,
      recipientName: row.recipient
        ? `${row.recipient.firstName} ${row.recipient.lastName}`.trim() ||
          row.recipient.username
        : null,
      recipientRole: row.recipientRole,
      subject: row.subject,
      body: row.body,
      attachments: row.attachments,
      status: row.status,
      priority: row.priority,
      readAt: row.readAt?.toISOString() || null,
      respondedAt: row.respondedAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
    }));
  }

  async createLetter(
    user: AuthenticatedUser,
    input: {
      organizationId: string;
      recipientUserId?: string;
      recipientRole?: string;
      subject: string;
      body: string;
      priority?: string;
      attachments?: string[];
    },
  ) {
    const organization = await this.organizationForUser(
      user,
      input.organizationId,
    );
    if (!input.subject?.trim() || !input.body?.trim()) {
      throw new ApiException(
        400,
        "LETTER_REQUIRED_FIELDS",
        "موضوع و متن نامه الزامی است.",
      );
    }
    let recipient: User | null = null;
    if (input.recipientUserId) {
      recipient = await this.users.findOne({
        where: { id: input.recipientUserId },
      });
      if (!recipient) {
        throw new ApiException(
          404,
          "LETTER_RECIPIENT_NOT_FOUND",
          "گیرنده نامه پیدا نشد.",
        );
      }
    }
    const row = await this.letters.save(
      this.letters.create({
        organization,
        sender: { id: user.id } as User,
        recipient: recipient || null,
        recipientRole: input.recipientRole?.trim() || "general",
        subject: input.subject.trim(),
        body: input.body.trim(),
        attachments: Array.isArray(input.attachments)
          ? input.attachments.filter(Boolean)
          : [],
        priority: input.priority?.trim() || "normal",
        status: RequestLetterStatus.SENT,
      }),
    );
    return this.serializeLetter(row);
  }

  async reviewLetter(
    user: AuthenticatedUser,
    letterId: string,
    input: { status?: string; read?: boolean },
  ) {
    const row = await this.letters.findOne({
      where: { id: letterId },
      relations: { organization: true, sender: true, recipient: true },
    });
    if (!row) {
      throw new ApiException(404, "LETTER_NOT_FOUND", "نامه پیدا نشد.");
    }
    await this.organizationForUser(user, row.organization.id);
    if (input.read) {
      row.readAt = new Date();
    }
    if (input.status) {
      row.status = this.parseLetterStatus(input.status);
      if (row.status === RequestLetterStatus.ANSWERED) {
        row.respondedAt = new Date();
      }
    }
    const saved = await this.letters.save(row);
    return this.serializeLetter(saved);
  }

  private async activeMemberships(
    user: AuthenticatedUser,
    organizationId?: string,
  ) {
    const ids = await this.access.scopedOrganizationIds(user, organizationId);
    if (!ids.length) return [];
    return this.memberships.find({
      where: {
        user: { id: user.id },
        organization: { id: In(ids) },
        status: MembershipStatus.ACTIVE,
      },
      relations: { organization: true },
    });
  }

  private async notifyRequestReviewers(
    organizationId: string,
    reviewer: LeaveRequestReviewerRole,
    title: string,
    body: string,
    url: string,
  ) {
    const roles =
      reviewer === LeaveRequestReviewerRole.SCHOOL_SUPERVISOR
        ? ["SCHOOL_SUPERVISOR", "PRINCIPAL"]
        : ["PRINCIPAL", "ORGANIZATION_ADMIN"];
    const memberships = await this.memberships.find({
      where: {
        organization: { id: organizationId },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: true, roleAssignments: { role: true } },
    });
    const recipients = memberships
      .filter((membership) =>
        membership.roleAssignments.some((assignment) =>
          roles.includes(assignment.role.code),
        ),
      )
      .map((membership) => membership.user.id);
    if (recipients.length)
      await this.notifications.createForUsers(recipients, {
        type: "ANNOUNCEMENT",
        category: "student_request",
        title,
        body,
        url,
        priority: "high",
        organizationId,
      });
  }

  private async emitOccupancyUpdate(
    organizationId: string,
    exitPermissionId: string,
    action: "departure-recorded" | "return-requested" | "return-confirmed",
  ) {
    const memberships = await this.memberships.find({
      where: {
        organization: { id: organizationId },
        status: MembershipStatus.ACTIVE,
      },
      relations: { user: true },
    });
    this.realtime.emitToUsers(
      memberships.map((membership) => membership.user.id),
      "school.occupancy.updated",
      { organizationId, exitPermissionId, action },
    );
  }

  private async organizationForUser(
    user: AuthenticatedUser,
    organizationId: string,
  ) {
    return this.access.organizationForUser(user, organizationId);
  }

  private async studentForPhoneInOrganization(
    phoneNumber: string,
    organizationId: string,
  ) {
    const phone = normalizeIranianMobile(phoneNumber);
    if (!isIranianMobile(phone)) {
      throw new ApiException(
        400,
        "STUDENT_PHONE_INVALID",
        "شماره همراه دانش‌آموز معتبر نیست.",
      );
    }
    const student = await this.students.findOne({
      where: [
        { organization: { id: organizationId }, user: { phoneNumber: phone } },
        { organization: { id: organizationId }, user: { username: phone } },
      ],
      relations: { user: true, organization: true },
    });
    if (!student) {
      throw new ApiException(
        404,
        "STUDENT_PHONE_NOT_FOUND",
        "دانش‌آموزی با این شماره در مدرسه فعال پیدا نشد.",
      );
    }
    return student;
  }

  private async studentForUser(userId: string) {
    const student = await this.students.findOne({
      where: { user: { id: userId } },
      relations: { user: true },
    });
    if (!student) {
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "پرونده دانش‌آموز پیدا نشد.",
      );
    }
    return student;
  }

  private async requireDormRoom(user: AuthenticatedUser, roomId: string) {
    const room = await this.dormRooms.findOne({
      where: { id: roomId },
      relations: { organization: true },
    });
    if (!room) {
      throw new ApiException(
        404,
        "DORM_ROOM_NOT_FOUND",
        "اتاق خوابگاه پیدا نشد.",
      );
    }
    await this.organizationForUser(user, room.organization.id);
    return room;
  }

  private async resolveOrganizationIdForContext(
    user: AuthenticatedUser,
    contextType: AttendanceContextType,
    contextId: string,
  ) {
    if (contextType === "class") {
      const classroom = await this.classes.findOne({
        where: { id: contextId },
        relations: { organization: true },
      });
      if (!classroom) {
        throw new ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
      }
      await this.organizationForUser(user, classroom.organization.id);
      return classroom.organization.id;
    }

    if (contextType === "study_group") {
      const group = await this.studyGroups.findOne({
        where: { id: contextId },
        relations: { organization: true },
      });
      if (!group) {
        throw new ApiException(
          404,
          "STUDY_GROUP_NOT_FOUND",
          "گروه درسی پیدا نشد.",
        );
      }
      await this.organizationForUser(user, group.organization.id);
      return group.organization.id;
    }

    if (contextType === "dorm") {
      const room = await this.dormRooms.findOne({
        where: { id: contextId },
        relations: { organization: true },
      });
      if (!room) {
        throw new ApiException(
          404,
          "DORM_ROOM_NOT_FOUND",
          "اتاق خوابگاه پیدا نشد.",
        );
      }
      await this.organizationForUser(user, room.organization.id);
      return room.organization.id;
    }

    const memberships = await this.activeMemberships(user);
    if (!memberships.length) {
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "به این سازمان دسترسی ندارید.",
      );
    }
    return memberships[0].organization.id;
  }

  private parseContextType(value: string): AttendanceContextType {
    if (value === "dorm" || value === "study_group") return value;
    if (value === "class") return "class";
    throw new ApiException(
      400,
      "ATTENDANCE_CONTEXT_INVALID",
      "نوع زمینه حضور معتبر نیست.",
    );
  }

  private parseAttendanceStatus(value: string): AttendanceStatus {
    if (value === "present") return AttendanceStatus.PRESENT;
    if (value === "absent") return AttendanceStatus.ABSENT;
    if (value === "late") return AttendanceStatus.LATE;
    if (value === "excused") return AttendanceStatus.EXCUSED;
    throw new ApiException(
      400,
      "ATTENDANCE_STATUS_INVALID",
      "وضعیت حضور معتبر نیست.",
    );
  }

  private parseLeaveStatus(value: string): LeaveRequestStatus {
    if (value === "APPROVED") return LeaveRequestStatus.APPROVED;
    if (value === "REJECTED") return LeaveRequestStatus.REJECTED;
    if (value === "CANCELLED") return LeaveRequestStatus.CANCELLED;
    if (value === "COMPLETED") return LeaveRequestStatus.COMPLETED;
    return LeaveRequestStatus.PENDING;
  }

  private parseExitStatus(value: string): ExitPermissionStatus {
    if (value === "APPROVED") return ExitPermissionStatus.APPROVED;
    if (value === "REJECTED") return ExitPermissionStatus.REJECTED;
    if (value === "CANCELLED") return ExitPermissionStatus.CANCELLED;
    if (value === "COMPLETED") return ExitPermissionStatus.COMPLETED;
    return ExitPermissionStatus.PENDING;
  }

  private parseLetterStatus(value: string): RequestLetterStatus {
    if (value === "DRAFT") return RequestLetterStatus.DRAFT;
    if (value === "SENT") return RequestLetterStatus.SENT;
    if (value === "RECEIVED") return RequestLetterStatus.RECEIVED;
    if (value === "UNDER_REVIEW") return RequestLetterStatus.UNDER_REVIEW;
    if (value === "ANSWERED") return RequestLetterStatus.ANSWERED;
    if (value === "REJECTED") return RequestLetterStatus.REJECTED;
    if (value === "CLOSED") return RequestLetterStatus.CLOSED;
    return RequestLetterStatus.DRAFT;
  }

  private serializeLeaveRequest(row: LeaveRequest) {
    return {
      id: row.id,
      organizationId: row.organization.id,
      organizationName: row.organization.name,
      studentId: row.student.id,
      studentName: row.student.name,
      leaveType: row.leaveType,
      reviewerRole: row.reviewerRole ?? LeaveRequestReviewerRole.PRINCIPAL,
      startDate: row.startDate.toISOString(),
      endDate: row.endDate.toISOString(),
      reason: row.reason,
      note: row.note,
      includesLunch: row.includesLunch,
      includesDinner: row.includesDinner,
      exitPermissionId: row.exitPermissionId ?? null,
      attachments: row.attachments,
      status: row.status,
      approverId: row.approver?.id || null,
      reviewedAt: row.reviewedAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private parseLeaveRequestType(value?: string): LeaveRequestType {
    if (value === LeaveRequestType.SCHOOL_EXIT)
      return LeaveRequestType.SCHOOL_EXIT;
    if (value === LeaveRequestType.LEAVE || !value || value === "general") {
      return LeaveRequestType.LEAVE;
    }
    throw new ApiException(
      400,
      "LEAVE_TYPE_INVALID",
      "نوع درخواست باید خروج از مدرسه یا مرخصی باشد.",
    );
  }

  private serializeExitPermission(row: ExitPermission) {
    return {
      id: row.id,
      organizationId: row.organization.id,
      organizationName: row.organization.name,
      studentId: row.student.id,
      studentName: row.student.name,
      destination: row.destination,
      reason: row.reason,
      requestedDepartureAt: row.requestedDepartureAt.toISOString(),
      expectedReturnAt: row.expectedReturnAt?.toISOString() || null,
      actualDepartureAt: row.actualDepartureAt?.toISOString() || null,
      actualReturnAt: row.actualReturnAt?.toISOString() || null,
      returnRequestedAt: row.returnRequestedAt?.toISOString() || null,
      returnRequestNote: row.returnRequestNote || "",
      returnVerifiedById: row.returnVerifiedBy?.id || null,
      returnVerifiedAt: row.returnVerifiedAt?.toISOString() || null,
      note: row.note,
      origin: row.origin ?? null,
      status: row.status,
      approverId: row.approver?.id || null,
      reviewedAt: row.reviewedAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
    };
  }

  private serializeLetter(row: RequestLetter) {
    return {
      id: row.id,
      organizationId: row.organization.id,
      organizationName: row.organization.name,
      senderId: row.sender?.id || null,
      senderName: row.sender
        ? `${row.sender.firstName} ${row.sender.lastName}`.trim() ||
          row.sender.username
        : null,
      recipientId: row.recipient?.id || null,
      recipientName: row.recipient
        ? `${row.recipient.firstName} ${row.recipient.lastName}`.trim() ||
          row.recipient.username
        : null,
      recipientRole: row.recipientRole,
      subject: row.subject,
      body: row.body,
      attachments: row.attachments,
      status: row.status,
      priority: row.priority,
      readAt: row.readAt?.toISOString() || null,
      respondedAt: row.respondedAt?.toISOString() || null,
      createdAt: row.createdAt.toISOString(),
    };
  }
}
