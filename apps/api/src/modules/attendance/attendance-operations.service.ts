import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { createHash } from "node:crypto";
import { EntityManager, In, IsNull, MoreThan, Repository } from "typeorm";
import type {
  AttendanceDailyOverview,
  AttendancePool as PoolView,
  AttendanceEncouragement,
  DormAttendanceAssignment,
  StaffAttendanceProfile,
  StaffAttendanceSession,
} from "@moshaver/api-contract";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  AttendanceSession,
  AttendanceRosterSnapshot,
} from "../../database/entities/attendance-session.entity";
import {
  AttendanceRecord,
  AttendanceReviewStatus,
  AttendanceStatus,
} from "../../database/entities/attendance-record.entity";
import { StudentRewardLedger } from "../../database/entities/student-reward-ledger.entity";
import { AttendancePool } from "../../database/entities/attendance-pool.entity";
import { DormAttendanceDelegate } from "../../database/entities/dorm-attendance-delegate.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { AttendanceWriteReceipt } from "../../database/entities/attendance-write-receipt.entity";
import { AttendancePolicy } from "../../database/entities/attendance-policy.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { Student } from "../../database/entities/student.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { User, UserStatus } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { SchoolAccessService } from "../school-access";
import { RealtimeService } from "../realtime";
import { AttendanceService } from "./attendance.service";
import { attendanceTransaction } from "./attendance-transaction";
import {
  operationalDate,
  schoolLocalInstant,
  shiftSchoolDate,
} from "./attendance-time";
import {
  CreateAttendancePoolDto,
  DelegatedDormAttendanceDto,
  SetDormAttendanceDelegateDto,
  AttendanceHistoryQueryDto,
} from "./attendance.dto";

const zone = "Asia/Tehran";
/** Summary window and delegated night share a 16:00 Tehran boundary; no stored facts are reset. */
export function attendanceSummaryWindow(now = new Date()) {
  const day = operationalDate(now, zone, "16:00");
  return {
    day,
    startsAt: schoolLocalInstant(day, "16:00", zone),
    resetsAt: schoolLocalInstant(shiftSchoolDate(day, 1), "16:00", zone),
  };
}

@Injectable()
export class AttendanceOperationsService {
  constructor(
    @InjectRepository(AttendanceSession)
    private readonly sessions: Repository<AttendanceSession>,
    private readonly attendance: AttendanceService,
    private readonly access: SchoolAccessService,
    private readonly realtime: RealtimeService,
  ) {}
  private repo<T extends object>(entity: new () => T) {
    return this.sessions.manager.getRepository(entity);
  }
  private requireCapability(user: AuthenticatedUser, capability: string) {
    if (!user.capabilities?.includes(capability))
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
  }
  private staff(
    user: AuthenticatedUser,
    capabilities: string | readonly string[] = ["attendance.review"],
  ) {
    const allowed = typeof capabilities === "string" ? [capabilities] : capabilities;
    if (!allowed.some((capability) => user.capabilities?.includes(capability)))
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    if (
      ![
        "TEACHER",
        "PRINCIPAL",
        "SCHOOL_SUPERVISOR",
        "ORGANIZATION_ADMIN",
        "PLATFORM_ADMIN",
      ].some((role) => (user.roles ?? [user.role]).includes(role))
    )
      throw new ApiException(
        403,
        "FORBIDDEN",
        "این بخش فقط برای معلم، مدیر و ناظر مدرسه است.",
      );
  }
  private async orgIds(user: AuthenticatedUser) {
    // Work-context scoping takes precedence over all memberships/platform scope.
    return this.access.scopedOrganizationIds(
      { ...user, role: user.roles?.[0] ?? user.role },
      user.activeOrganizationId || undefined,
    );
  }
  private async selfStudent(user: AuthenticatedUser) {
    this.requireCapability(user, "attendance.self.read");
    if (!(user.roles ?? [user.role]).includes("STUDENT"))
      throw new ApiException(403, "FORBIDDEN", "حساب طلبه لازم است.");
    const ids = await this.orgIds(user);
    const student = ids.length
      ? await this.repo(Student).findOne({
          where: {
            user: { id: user.id, status: UserStatus.ACTIVE },
            organization: { id: In(ids) },
            accountStatus: "active",
          },
          relations: { user: true, organization: true },
        })
      : null;
    if (!student?.organization)
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "حساب فعال طلبه در مدرسه پیدا نشد.",
      );
    await this.access.organizationForUser(user, student.organization.id);
    return student;
  }
  private delegateView(row: DormAttendanceDelegate) {
    return {
      id: row.id,
      roomId: row.room.id,
      roomName: row.room.name,
      studentId: row.student.id,
      studentName: row.student.name,
      startsOn: row.startsOn,
      endsOn: row.endsOn,
      revoked: row.revoked,
      dormWide: row.dormWide,
    };
  }
  async delegates(user: AuthenticatedUser) {
    this.staff(user, "attendance.delegate");
    const ids = await this.orgIds(user);
    return ids.length
      ? (
          await this.repo(DormAttendanceDelegate).find({
            where: { organization: { id: In(ids) } },
            relations: { room: true, student: true },
          })
        ).map((row) => this.delegateView(row))
      : [];
  }
  async setDelegate(
    user: AuthenticatedUser,
    roomId: string,
    dto: SetDormAttendanceDelegateDto,
  ) {
    this.staff(user, "attendance.delegate");
    // Calendar parsing rejects dates such as February 30; date ranges are inclusive and bounded.
    try {
      shiftSchoolDate(dto.startsOn, 0);
      shiftSchoolDate(dto.endsOn, 0);
    } catch {
      throw new ApiException(
        422,
        "ATTENDANCE_DATE_INVALID",
        "تاریخ معتبر نیست.",
      );
    }
    if (
      dto.startsOn > dto.endsOn ||
      dto.endsOn > shiftSchoolDate(dto.startsOn, 365)
    )
      throw new ApiException(
        422,
        "ATTENDANCE_DELEGATE_RANGE",
        "بازه باید بین یک شب و یک سال باشد.",
      );
    const descriptor = await this.attendance.contextDescriptor("dorm", roomId);
    await this.attendance.authorizeContext(
      user,
      "dorm",
      roomId,
      descriptor.organizationId,
      true,
    );
    if (descriptor.status !== "ACTIVE")
      throw new ApiException(422, "DORM_ROOM_INACTIVE", "اتاق فعال نیست.");
    const result = await attendanceTransaction(
      this.sessions.manager,
      async (manager) => {
        const member = await manager.getRepository(DormRoomAssignment).findOne({
          where: {
            room: { id: roomId },
            student: {
              id: dto.studentId,
              organization: { id: descriptor.organizationId },
              accountStatus: "active",
            },
          },
          relations: { student: { user: true }, room: true },
        });
        if (
          !member?.student.user ||
          member.student.user.status !== UserStatus.ACTIVE ||
          !(await this.access.activeMembershipForUser(
            member.student.user.id,
            descriptor.organizationId,
          ))
        )
          throw new ApiException(
            422,
            "ATTENDANCE_DELEGATE_NOT_RESIDENT",
            "یک طلبه ساکن اتاق با حساب فعال مدرسه انتخاب کنید.",
          );
        const repo = manager.getRepository(DormAttendanceDelegate);
        const previous = await repo.findOne({
          where: { room: { id: roomId } },
          relations: { student: true, room: true },
        });
        const saved = await repo.save(
          repo.create({
            id: previous?.id,
            organization: { id: descriptor.organizationId },
            room: member.room,
            student: member.student,
            grantedBy: { id: user.id },
            startsOn: dto.startsOn,
            endsOn: dto.endsOn,
            revoked: false,
            dormWide: false,
          }),
        );
        await this.audit(
          manager,
          user,
          descriptor.organizationId,
          "attendance.delegate.assigned",
          {
            before: previous ? this.delegateView(previous) : null,
            after: this.delegateView(saved),
          },
        );
        return {
          view: this.delegateView(saved),
          recipients: [
            user.id,
            member.student.user.id,
            ...(previous?.student.user?.id ? [previous.student.user.id] : []),
          ],
        };
      },
    );
    this.realtime.emitToUsers(result.recipients, "attendance.updated", {
      organizationId: descriptor.organizationId,
      contextType: "dorm",
      contextId: roomId,
    });
    return result.view;
  }
  async dormResidents(user: AuthenticatedUser) {
    this.staff(user, "attendance.delegate");
    const ids = await this.orgIds(user);
    if (!ids.length) return [];
    const rows = await this.repo(DormRoomAssignment).find({
      where: {
        room: { organization: { id: In(ids) }, status: "ACTIVE" },
        student: {
          organization: { id: In(ids) },
          accountStatus: "active",
          user: { status: UserStatus.ACTIVE },
        },
      },
      relations: {
        student: { user: true, organization: true },
        room: { organization: true },
      },
    });
    const eligible = [];
    for (const row of rows) {
      if (
        row.student.organization?.id !== row.room.organization.id ||
        !row.student.user
      )
        continue;
      if (
        await this.access.activeMembershipForUser(
          row.student.user.id,
          row.room.organization.id,
        )
      )
        eligible.push({
          id: row.student.id,
          name: row.student.name,
          organizationId: row.room.organization.id,
          userId: row.student.user.id,
        });
    }
    return [...new Map(eligible.map((row) => [row.id, row])).values()];
  }
  /** Explicitly grants each currently active room, atomically; future rooms need a new grant. */
  async setDormWideDelegate(
    user: AuthenticatedUser,
    dto: SetDormAttendanceDelegateDto,
  ) {
    this.staff(user, "attendance.delegate");
    try {
      shiftSchoolDate(dto.startsOn, 0);
      shiftSchoolDate(dto.endsOn, 0);
    } catch {
      throw new ApiException(
        422,
        "ATTENDANCE_DATE_INVALID",
        "تاریخ معتبر نیست.",
      );
    }
    if (
      dto.startsOn > dto.endsOn ||
      dto.endsOn > shiftSchoolDate(dto.startsOn, 365)
    )
      throw new ApiException(
        422,
        "ATTENDANCE_DELEGATE_RANGE",
        "بازه باید بین یک شب و یک سال باشد.",
      );
    const selected = (await this.dormResidents(user)).find(
      (row) => row.id === dto.studentId,
    );
    if (!selected)
      throw new ApiException(
        422,
        "ATTENDANCE_DELEGATE_NOT_RESIDENT",
        "یک طلبه ساکن خوابگاه با حساب فعال انتخاب کنید.",
      );
    await this.attendance.authorizeOrganization(user, selected.organizationId);
    const rooms = await this.repo(DormRoom).find({
      where: {
        organization: { id: selected.organizationId },
        status: "ACTIVE",
      },
    });
    if (!rooms.length || rooms.length > 500)
      throw new ApiException(
        422,
        "ATTENDANCE_DELEGATE_ROOMS",
        "تعداد اتاق‌ها معتبر نیست.",
      );
    const result = await attendanceTransaction(
      this.sessions.manager,
      async (manager) => {
        const repo = manager.getRepository(DormAttendanceDelegate);
        const views = [];
        for (const room of rooms) {
          const previous = await repo.findOne({
            where: { room: { id: room.id } },
            relations: { student: true, room: true },
          });
          const student = await manager
            .getRepository(Student)
            .findOneByOrFail({ id: selected.id });
          const row = await repo.save(
            repo.create({
              id: previous?.id,
              organization: { id: selected.organizationId },
              room,
              student,
              grantedBy: { id: user.id },
              startsOn: dto.startsOn,
              endsOn: dto.endsOn,
              revoked: false,
              dormWide: true,
            }),
          );
          const view = this.delegateView(row);
          await this.audit(
            manager,
            user,
            selected.organizationId,
            "attendance.delegate.assigned",
            {
              before: previous ? this.delegateView(previous) : null,
              after: view,
            },
          );
          views.push(view);
        }
        return views;
      },
    );
    this.realtime.emitToUsers(
      [user.id, selected.userId],
      "attendance.updated",
      { organizationId: selected.organizationId, contextType: "dorm" },
    );
    return result;
  }
  async revokeDormWideDelegate(user: AuthenticatedUser) {
    this.staff(user, "attendance.delegate");
    const ids = await this.orgIds(user);
    if (!ids.length) return { revoked: true };
    return attendanceTransaction(this.sessions.manager, async (manager) => {
      const repo = manager.getRepository(DormAttendanceDelegate);
      const rows = await repo.find({
        where: {
          organization: { id: In(ids) },
          dormWide: true,
          revoked: false,
        },
        relations: { organization: true, student: { user: true }, room: true },
      });
      for (const row of rows) {
        row.revoked = true;
        await repo.save(row);
        await this.audit(
          manager,
          user,
          row.organization.id,
          "attendance.delegate.revoked",
          { roomId: row.room?.id, delegateId: row.id },
        );
      }
      return { revoked: true };
    });
  }
  private async isDormResident(
    manager: EntityManager,
    studentId: string,
    organizationId: string,
  ) {
    return !!(await manager.getRepository(DormRoomAssignment).findOne({
      where: {
        student: { id: studentId, organization: { id: organizationId } },
        room: { organization: { id: organizationId }, status: "ACTIVE" },
      },
    }));
  }
  async revokeDelegate(user: AuthenticatedUser, roomId: string) {
    this.staff(user, "attendance.delegate");
    const descriptor = await this.attendance.contextDescriptor("dorm", roomId);
    await this.attendance.authorizeContext(
      user,
      "dorm",
      roomId,
      descriptor.organizationId,
      true,
    );
    return attendanceTransaction(this.sessions.manager, async (manager) => {
      const repo = manager.getRepository(DormAttendanceDelegate);
      const row = await repo.findOne({
        where: {
          room: { id: roomId },
          organization: { id: descriptor.organizationId },
        },
      });
      if (row && !row.revoked) {
        row.revoked = true;
        await repo.save(row);
        await this.audit(
          manager,
          user,
          descriptor.organizationId,
          "attendance.delegate.revoked",
          { roomId, delegateId: row.id },
        );
      }
      return { revoked: true };
    });
  }
  private async residentRoster(
    manager: EntityManager,
    roomId: string,
    organizationId: string,
  ) {
    const members = await manager.getRepository(DormRoomAssignment).find({
      where: {
        room: { id: roomId, status: "ACTIVE" },
        student: { organization: { id: organizationId } },
      },
      relations: { student: { user: true } },
      order: { createdAt: "ASC" },
    });
    return members.map((row) => row.student);
  }
  async myDormAssignments(
    user: AuthenticatedUser,
  ): Promise<DormAttendanceAssignment[]> {
    const student = await this.selfStudent(user);
    const rows = await this.repo(DormAttendanceDelegate).find({
      where: {
        student: { id: student.id },
        organization: { id: student.organization!.id },
        revoked: false,
      },
      relations: { room: true, student: true },
    });
    const { day } = attendanceSummaryWindow();
    const result: DormAttendanceAssignment[] = [];
    for (const row of rows) {
      if (row.endsOn < day || row.room.status !== "ACTIVE") continue;
      const roster = await this.residentRoster(
        this.sessions.manager,
        row.room.id,
        student.organization!.id,
      );
      if (
        !(row.dormWide
          ? await this.isDormResident(
              this.sessions.manager,
              student.id,
              student.organization!.id,
            )
          : roster.some((member) => member.id === student.id))
      )
        continue;
      const session = await this.sessions.findOne({
        where: {
          organization: { id: student.organization!.id },
          occurrenceKey: `dorm-delegate:${row.room.id}:${day}`,
        },
        relations: { records: { student: true } },
      });
      result.push({
        ...this.delegateView(row),
        nightDate: day,
        revision: session?.revision ?? 0,
        canMark: row.startsOn <= day && day <= row.endsOn,
        roster:
          row.startsOn <= day
            ? roster.map((member) => ({ id: member.id, name: member.name }))
            : [],
        records: (session?.records ?? [])
          .filter((record) =>
            roster.some((member) => member.id === record.student.id),
          )
          .map((record) => ({
            studentId: record.student.id,
            status: record.status as "present" | "absent" | "late",
          })),
      });
    }
    return result;
  }
  async markDorm(
    user: AuthenticatedUser,
    id: string,
    dto: DelegatedDormAttendanceDto,
  ) {
    const student = await this.selfStudent(user);
    if (
      !dto.entries.length ||
      dto.entries.length > 500 ||
      new Set(dto.entries.map((entry) => entry.studentId)).size !==
        dto.entries.length ||
      dto.entries.some(
        (entry) => !["present", "absent", "late"].includes(entry.status),
      )
    )
      throw new ApiException(
        422,
        "ATTENDANCE_ENTRIES_INVALID",
        "وضعیت‌های ارسال‌شده معتبر نیست.",
      );
    const fingerprint = createHash("sha256")
      .update(
        JSON.stringify({
          id,
          expectedRevision: dto.expectedRevision,
          nightDate: dto.nightDate,
          entries: [...dto.entries].sort((a, b) =>
            a.studentId.localeCompare(b.studentId),
          ),
        }),
      )
      .digest("hex");
    const result = await attendanceTransaction(
      this.sessions.manager,
      async (manager) => {
        const delegate = await manager
          .getRepository(DormAttendanceDelegate)
          .findOne({
            where: {
              id,
              student: { id: student.id },
              organization: { id: student.organization!.id },
              revoked: false,
            },
            relations: { room: true },
          });
        const today = attendanceSummaryWindow().day;
        if (
          !delegate ||
          delegate.room.status !== "ACTIVE" ||
          dto.nightDate !== today ||
          today < delegate.startsOn ||
          today > delegate.endsOn
        )
          throw new ApiException(
            403,
            "ATTENDANCE_DELEGATE_EXPIRED",
            "اجازه ثبت این اتاق یا شب را ندارید.",
          );
        const roster = await this.residentRoster(
          manager,
          delegate.room.id,
          student.organization!.id,
        );
        if (
          !(delegate.dormWide
            ? await this.isDormResident(
                manager,
                student.id,
                student.organization!.id,
              )
            : roster.some((member) => member.id === student.id)) ||
          dto.entries.some(
            (entry) => !roster.some((member) => member.id === entry.studentId),
          )
        )
          throw new ApiException(
            403,
            "ATTENDANCE_DELEGATE_SCOPE",
            "ثبت فقط برای ساکنان اتاق شما مجاز است.",
          );
        // Dorm marking is absence-first too.  The authenticated delegate may send
        // exceptional statuses only; every omitted member is materialized as present
        // in this one transaction, so a room never has a silently partial session.
        const entriesByStudent = new Map(
          dto.entries.map((entry) => [entry.studentId, entry]),
        );
        const entries = roster.map((member) => ({
          studentId: member.id,
          status: entriesByStudent.get(member.id)?.status ?? "present",
        }));
        const receipts = manager.getRepository(AttendanceWriteReceipt);
        const receipt = await receipts.findOne({
          where: {
            organization: { id: student.organization!.id },
            actor: { id: user.id },
            requestId: dto.requestId,
          },
        });
        if (receipt) {
          if (receipt.fingerprint !== fingerprint)
            throw new ApiException(
              409,
              "ATTENDANCE_REQUEST_REUSED",
              "شناسه درخواست قبلاً استفاده شده است.",
            );
          return receipt.result;
        }
        const sessions = manager.getRepository(AttendanceSession);
        const occurrenceKey = `dorm-delegate:${delegate.room.id}:${today}`;
        let session = await sessions.findOne({
          where: {
            organization: { id: student.organization!.id },
            occurrenceKey,
          },
        });
        if ((session?.revision ?? 0) !== dto.expectedRevision)
          throw new ApiException(
            409,
            "ATTENDANCE_REVISION_CONFLICT",
            "حضور اتاق تغییر کرده است. فهرست را ببندید و دوباره باز کنید.",
          );
        if (!session)
          session = await sessions.save(
            sessions.create({
              organization: student.organization!,
              contextType: "dorm",
              contextId: delegate.room.id,
              occurrenceKey,
              operationalDate: today,
              sessionDate: new Date(),
              titleSnapshot: delegate.room.name,
              timeZone: zone,
              rosterSnapshot: roster.map((member) => this.snapshot(member)),
              rosterCapturedAt: new Date(),
              createdBy: { id: user.id },
              status: "submitted",
            }),
          );
        const records = manager.getRepository(AttendanceRecord);
        for (const entry of entries) {
          if (
            !session.rosterSnapshot?.some(
              (member) => member.id === entry.studentId,
            )
          )
            throw new ApiException(
              409,
              "ATTENDANCE_ROSTER_CHANGED",
              "فهرست اتاق تغییر کرده؛ از ناظر بخواهید جلسه تازه ایجاد کند.",
            );
          const old = await records.findOne({
            where: {
              session: { id: session.id },
              student: { id: entry.studentId },
            },
          });
          await records.save(
            records.create({
              id: old?.id,
              session,
              student: { id: entry.studentId },
              status: entry.status as AttendanceStatus,
              physicalStatus: entry.status,
              recordedBy: { id: user.id },
              revision: (old?.revision ?? 0) + 1,
              reviewStatus:
                entry.status === "absent"
                  ? AttendanceReviewStatus.PENDING
                  : null,
              reviewNote: "",
              reviewedBy: null,
              reviewedAt: null,
            }),
          );
        }
        session.revision++;
        await sessions.save(session);
        const saved = { sessionId: session.id, count: entries.length };
        await receipts.save(
          receipts.create({
            organization: student.organization!,
            actor: { id: user.id },
            requestId: dto.requestId,
            fingerprint,
            session,
            result: saved,
          }),
        );
        await this.audit(
          manager,
          user,
          student.organization!.id,
          "attendance.dorm.delegated-mark",
          { sessionId: session.id, delegateId: id, entries },
        );
        return saved;
      },
    );
    this.realtime.emitToUser(user.id, "attendance.updated", {
      sessionId: result.sessionId,
    });
    return result;
  }
  private snapshot(student: Student): AttendanceRosterSnapshot {
    return {
      id: student.id,
      name: student.name,
      userId: student.user?.id ?? null,
      nationalCode: student.nationalCode ?? null,
    };
  }
  private poolView(row: AttendancePool): PoolView {
    const expected = row.session.rosterSnapshot?.length ?? 0;
    const present =
      row.session.records?.filter((record) => record.status === "present")
        .length ?? 0;
    return {
      contextId: row.session.contextId,
      id: row.id,
      sessionId: row.session.id,
      title: row.session.titleSnapshot,
      place: row.place,
      endsAt: row.endsAt.toISOString(),
      closed: Boolean(row.closedAt) || row.endsAt.getTime() <= Date.now(),
      expected,
      present,
      remaining: expected - present,
    };
  }
  async pools(user: AuthenticatedUser) {
    this.staff(user);
    const ids = await this.orgIds(user);
    return ids.length
      ? (
          await this.repo(AttendancePool).find({
            where: { organization: { id: In(ids) } },
            relations: { session: { records: true } },
            order: { createdAt: "DESC" },
            take: 100,
          })
        ).map((row) => this.poolView(row))
      : [];
  }
  async createPool(user: AuthenticatedUser, dto: CreateAttendancePoolDto) {
    this.staff(user);
    this.requireCapability(user, "attendance.manage");
    const organization = await this.attendance.authorizeContext(
      user,
      dto.contextType,
      dto.contextId,
      dto.organizationId,
      true,
    );
    const descriptor = await this.attendance.contextDescriptor(
      dto.contextType,
      dto.contextId,
    );
    if (descriptor.status !== "ACTIVE")
      throw new ApiException(
        422,
        "ATTENDANCE_CONTEXT_INACTIVE",
        "محل حضور فعال نیست.",
      );
    const roster = await this.attendance.listParticipants(
      user,
      dto.contextType,
      dto.contextId,
    );
    if (!roster.length || roster.length > 500)
      throw new ApiException(
        422,
        "ATTENDANCE_POOL_ROSTER",
        "فراخوان باید بین ۱ و ۵۰۰ عضو داشته باشد.",
      );
    if (
      !dto.title.trim() ||
      !dto.place.trim() ||
      dto.durationMinutes < 1 ||
      dto.durationMinutes > 240
    )
      throw new ApiException(
        422,
        "ATTENDANCE_POOL_INVALID",
        "عنوان، محل و زمان فراخوان لازم است.",
      );
    const fingerprint = createHash("sha256")
      .update(JSON.stringify(dto))
      .digest("hex");
    const pool = await attendanceTransaction(
      this.sessions.manager,
      async (manager) => {
        const sessions = manager.getRepository(AttendanceSession);
        const existing = await sessions.findOne({
          where: {
            organization: { id: organization.id },
            occurrenceKey: `pool:${user.id}:${dto.requestId}`,
          },
        });
        if (existing) {
          if (existing.creationFingerprint !== fingerprint)
            throw new ApiException(
              409,
              "ATTENDANCE_REQUEST_REUSED",
              "شناسه درخواست قبلاً استفاده شده است.",
            );
          return manager.getRepository(AttendancePool).findOneOrFail({
            where: { session: { id: existing.id } },
            relations: { session: { records: true } },
          });
        }
        const session = await sessions.save(
          sessions.create({
            organization,
            contextType: "pool",
            contextId: dto.contextId,
            sessionDate: new Date(),
            occurrenceKey: `pool:${user.id}:${dto.requestId}`,
            creationFingerprint: fingerprint,
            titleSnapshot: dto.title.trim(),
            timeZone: zone,
            operationalDate: attendanceSummaryWindow().day,
            rosterSnapshot: roster.map((member) => ({
              id: member.id,
              name: member.name,
              userId: member.userId,
              nationalCode: member.nationalCode ?? null,
            })),
            rosterCapturedAt: new Date(),
            status: "open",
            createdBy: { id: user.id },
          }),
        );
        const saved = await manager.getRepository(AttendancePool).save(
          manager.getRepository(AttendancePool).create({
            organization,
            session,
            place: dto.place.trim(),
            endsAt: new Date(Date.now() + dto.durationMinutes * 60000),
          }),
        );
        await this.audit(
          manager,
          user,
          organization.id,
          "attendance.pool.opened",
          { sessionId: session.id, poolId: saved.id },
        );
        return saved;
      },
    );
    this.realtime.emitToUsers(
      pool.session.rosterSnapshot?.flatMap((member) =>
        member.userId ? [member.userId] : [],
      ) ?? [],
      "attendance.updated",
      { poolId: pool.id },
    );
    return this.poolView(pool);
  }
  async closePool(user: AuthenticatedUser, id: string) {
    this.staff(user);
    this.requireCapability(user, "attendance.manage");
    const result = await attendanceTransaction(
      this.sessions.manager,
      async (manager) => {
        const repo = manager.getRepository(AttendancePool);
        const pool = await repo.findOne({
          where: { id },
          relations: { organization: true, session: true },
        });
        if (!pool)
          throw new ApiException(
            404,
            "ATTENDANCE_POOL_NOT_FOUND",
            "فراخوان پیدا نشد.",
          );
        await this.attendance.authorizeOrganization(user, pool.organization.id);
        if (!pool.closedAt) {
          pool.closedAt = new Date();
          pool.session.status = "finalized";
          await repo.save(pool);
          await manager.getRepository(AttendanceSession).save(pool.session);
          await this.audit(
            manager,
            user,
            pool.organization.id,
            "attendance.pool.closed",
            { sessionId: pool.session.id, poolId: id },
          );
        }
        return { closed: true };
      },
    );
    return result;
  }
  async myPools(user: AuthenticatedUser) {
    const student = await this.selfStudent(user);
    const pools = await this.repo(AttendancePool).find({
      where: {
        organization: { id: student.organization!.id },
        closedAt: IsNull(),
        endsAt: MoreThan(new Date()),
      },
      order: { endsAt: "ASC" },
      relations: { session: { records: { student: true } } },
    });
    return pools
      .filter(
        (pool) =>
          !this.poolView(pool).closed &&
          pool.session.rosterSnapshot?.some(
            (member) => member.id === student.id && member.userId === user.id,
          ) &&
          !pool.session.records.some(
            (record) => record.student.id === student.id,
          ),
      )
      .map((pool) => ({
        id: pool.id,
        title: pool.session.titleSnapshot,
        place: pool.place,
        endsAt: pool.endsAt.toISOString(),
      }));
  }
  async checkIn(user: AuthenticatedUser, id: string) {
    const student = await this.selfStudent(user);
    return attendanceTransaction(this.sessions.manager, async (manager) => {
      const pool = await manager.getRepository(AttendancePool).findOne({
        where: { id, organization: { id: student.organization!.id } },
        relations: { session: true },
      });
      if (
        !pool ||
        pool.closedAt ||
        pool.endsAt.getTime() <= Date.now() ||
        !pool.session.rosterSnapshot?.some(
          (member) => member.id === student.id && member.userId === user.id,
        )
      )
        throw new ApiException(
          403,
          "ATTENDANCE_POOL_CLOSED",
          "این فراخوان فعال نیست یا برای شما نیست.",
        );
      const records = manager.getRepository(AttendanceRecord);
      if (
        !(await records.findOne({
          where: {
            session: { id: pool.session.id },
            student: { id: student.id },
          },
        }))
      ) {
        await records.save(
          records.create({
            session: pool.session,
            student,
            status: AttendanceStatus.PRESENT,
            physicalStatus: "present",
            recordedBy: { id: user.id },
            revision: 1,
          }),
        );
        await this.audit(
          manager,
          user,
          student.organization!.id,
          "attendance.pool.checked-in",
          { sessionId: pool.session.id, studentId: student.id },
        );
      }
      return { confirmed: true };
    });
  }
  async staffSessions(
    user: AuthenticatedUser,
    query: AttendanceHistoryQueryDto = {},
  ): Promise<{
    items: StaffAttendanceSession[];
    page: number;
    limit: number;
    total: number;
    hasNext: boolean;
  }> {
    this.staff(user, ["attendance.review", "attendance.class.read"]);
    const ids = await this.orgIds(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 25;
    const schoolWide = this.attendance.hasSchoolWideScope(user);
    const sessionQuery = {
          where: { organization: { id: In(ids) } },
          relations: { records: true, organization: true },
          order: { sessionDate: "DESC" },
        } as const;
    const [rows, total] = !ids.length
      ? [[], 0]
      : schoolWide
        ? await this.sessions.findAndCount({
            ...sessionQuery,
            skip: (page - 1) * limit,
            take: limit,
          })
        : [await this.sessions.find(sessionQuery), 0];
    const visibleRows = await this.visibleSessions(user, rows);
    const pageRows = schoolWide
      ? visibleRows
      : visibleRows.slice((page - 1) * limit, page * limit);
    const items = pageRows.map((session) => {
      const counts = this.counts(session.records ?? []);
      return {
        id: session.id,
        contextType:
          session.contextType === "study_group"
            ? "class_group"
            : session.contextType,
        contextId: session.contextId,
        title: session.titleSnapshot || "جلسه ثبت‌شده",
        sessionDate: session.sessionDate.toISOString(),
        expected:
          session.rosterSnapshot == null ? null : session.rosterSnapshot.length,
        ...counts,
        unmarked:
          session.rosterSnapshot == null
            ? null
            : Math.max(
                0,
                session.rosterSnapshot.length - session.records.length,
              ),
      };
    });
    return {
      items,
      page,
      limit,
      total: schoolWide ? total : visibleRows.length,
      hasNext: schoolWide ? page * limit < total : page * limit < visibleRows.length,
    };
  }
  async dailyOverview(
    user: AuthenticatedUser,
  ): Promise<AttendanceDailyOverview> {
    this.staff(user, ["attendance.review", "attendance.class.read"]);
    const ids = await this.orgIds(user);
    const window = attendanceSummaryWindow();
    const rows = ids.length
      ? await this.sessions
          .createQueryBuilder("session")
          .leftJoinAndSelect("session.records", "record")
          .leftJoinAndSelect("session.organization", "organization")
          .where("session.organizationId IN (:...ids)", { ids })
          .andWhere(
            "session.sessionDate >= :start AND session.sessionDate < :end",
            { start: window.startsAt, end: window.resetsAt },
          )
          .getMany()
      : [];
    const visibleRows = await this.visibleSessions(user, rows);
    return {
      day: window.day,
      startsAt: window.startsAt.toISOString(),
      resetsAt: window.resetsAt.toISOString(),
      timeZone: zone,
      sessions: visibleRows.length,
      present: visibleRows.reduce((n, s) => n + this.counts(s.records).present, 0),
      absent: visibleRows.reduce((n, s) => n + this.counts(s.records).absent, 0),
      late: visibleRows.reduce((n, s) => n + this.counts(s.records).late, 0),
      excused: visibleRows.reduce((n, s) => n + this.counts(s.records).excused, 0),
      unmarked: visibleRows.reduce(
        (n, s) =>
          n +
          Math.max(
            0,
            (s.rosterSnapshot?.length ?? s.records.length) - s.records.length,
          ),
        0,
      ),
    };
  }
  /** Finalized facts only: cancelled and unmarked sessions never enter the percentage denominator. */
  async reportSummary(
    user: AuthenticatedUser,
    from?: string,
    to?: string,
    filters: { academicYearId?: string; termId?: string } = {},
  ) {
    this.staff(user, "attendance.reports.read");
    const ids = await this.orgIds(user);
    const fromDate = from ? new Date(from) : null;
    const toDate = to ? new Date(to) : null;
    if (fromDate && Number.isNaN(fromDate.getTime()))
      throw new ApiException(
        422,
        "ATTENDANCE_REPORT_DATE_INVALID",
        "تاریخ شروع معتبر نیست.",
      );
    if (toDate && Number.isNaN(toDate.getTime()))
      throw new ApiException(
        422,
        "ATTENDANCE_REPORT_DATE_INVALID",
        "تاریخ پایان معتبر نیست.",
      );
    if (fromDate && toDate && fromDate > toDate)
      throw new ApiException(
        422,
        "ATTENDANCE_REPORT_DATE_RANGE",
        "تاریخ شروع نمی‌تواند بعد از تاریخ پایان باشد.",
      );
    const query = this.sessions
      .createQueryBuilder("session")
      .leftJoinAndSelect("session.records", "record")
      .leftJoinAndSelect("session.organization", "organization")
      .where("session.organizationId IN (:...ids)", { ids })
      .andWhere("session.status = :status", { status: "finalized" });
    if (fromDate) query.andWhere("session.sessionDate >= :from", { from: fromDate });
    if (toDate) query.andWhere("session.sessionDate <= :to", { to: toDate });
    if (filters.academicYearId)
      query.andWhere("session.academicYearIdSnapshot = :academicYearId", {
        academicYearId: filters.academicYearId,
      });
    if (filters.termId)
      query.andWhere("session.termIdSnapshot = :termId", { termId: filters.termId });
    const sessions = ids.length ? await query.getMany() : [];
    const policies = ids.length
      ? await this.repo(AttendancePolicy).find({
          where: { organization: { id: In(ids) } },
          relations: { organization: true },
        })
      : [];
    const lateCountsAsPresent = new Map(
      policies.map((policy) => [
        policy.organization.id,
        policy.lateCountsAsPresent,
      ]),
    );
    const counts = sessions.reduce(
      (total, session) => {
        const current = this.counts(session.records ?? []);
        total.present += current.present;
        total.absent += current.absent;
        total.late += current.late;
        total.excused += current.excused;
        return total;
      },
      { present: 0, absent: 0, late: 0, excused: 0 },
    );
    const denominator =
      counts.present + counts.absent + counts.late + counts.excused;
    const attendanceNumerator = sessions.reduce((total, session) => {
      const current = this.counts(session.records ?? []);
      return (
        total +
        current.present +
        ((lateCountsAsPresent.get(session.organization.id) ?? true)
          ? current.late
          : 0)
      );
    }, 0);
    return {
      from: from ?? null,
      to: to ?? null,
      academicYearId: filters.academicYearId ?? null,
      termId: filters.termId ?? null,
      finalizedSessions: sessions.length,
      denominator,
      ...counts,
      attendanceRate:
        denominator === 0
          ? null
          : Math.round((attendanceNumerator / denominator) * 100),
    };
  }
  async staffProfile(
    user: AuthenticatedUser,
    id: string,
  ): Promise<StaffAttendanceProfile> {
    this.staff(user, ["attendance.review", "attendance.class.read"]);
    const ids = await this.orgIds(user);
    const student = ids.length
      ? await this.repo(Student).findOne({
          where: { id, organization: { id: In(ids) } },
          relations: { user: true, organization: true },
        })
      : null;
    if (!student || student.user?.id === user.id)
      throw new ApiException(
        404,
        "STUDENT_NOT_FOUND",
        "پرونده مجاز طلبه پیدا نشد.",
      );
    const enrollments = await this.repo(EducationClassEnrollment).find({
      where: { student: { id } },
      relations: { classroom: { organization: true } },
    });
    const schoolWide = this.attendance.hasSchoolWideScope(user);
    const organizationEnrollments = enrollments.filter(({ classroom }) =>
      ids.includes(classroom.organization.id),
    );
    const visibleEnrollments = schoolWide
      ? organizationEnrollments
      : (
          await Promise.all(
            organizationEnrollments.map(async (enrollment) => {
              try {
                await this.attendance.authorizeContext(
                  user,
                  "class",
                  enrollment.classroom.id,
                  enrollment.classroom.organization.id,
                  false,
                );
                return enrollment;
              } catch (error) {
                if (error instanceof ApiException && error.getStatus() === 403)
                  return null;
                throw error;
              }
            }),
          )
        ).filter((enrollment): enrollment is EducationClassEnrollment => Boolean(enrollment));
    if (!schoolWide && !visibleEnrollments.length)
      throw new ApiException(404, "STUDENT_NOT_FOUND", "پرونده مجاز دانش‌آموز پیدا نشد.");

    const rows = await this.repo(AttendanceRecord).find({
      where: { student: { id }, session: { organization: { id: In(ids) } } },
      relations: { session: true },
      order: { createdAt: "DESC" },
    });
    const visibleClassIds = new Set(visibleEnrollments.map(({ classroom }) => classroom.id));
    const visibleRows = schoolWide
      ? rows
      : rows.filter(
          (row) =>
            row.session.contextType === "class" && visibleClassIds.has(row.session.contextId),
        );
    const points = await this.repo(StudentRewardLedger).find({
      where: { student: { id }, organization: { id: student.organization!.id } },
    });
    const counts = this.counts(visibleRows);
    const totalSessions = visibleRows.length;
    const attendanceRate = totalSessions
      ? Math.round(((counts.present + counts.late) / totalSessions) * 100)
      : null;
    const eligibleSessions = await this.sessions.find({
      where: { organization: { id: student.organization!.id } },
      select: { id: true, rosterSnapshot: true, contextType: true, contextId: true },
    });
    const visibleSessions = schoolWide
      ? eligibleSessions
      : eligibleSessions.filter(
          (session) =>
            session.contextType === "class" && visibleClassIds.has(session.contextId),
        );
    const eligibleSessionCount = visibleSessions.filter((session) =>
      (session.rosterSnapshot ?? []).some((member) => member.id === id),
    ).length;
    return {
      studentId: id,
      name: student.name,
      schoolName: student.organization?.name ?? "—",
      classNames: visibleEnrollments.map(({ classroom }) => classroom.name),
      points: points.reduce((total, row) => total + row.points, 0),
      attendanceRate,
      attendanceCoverage: eligibleSessionCount
        ? Math.round((totalSessions / eligibleSessionCount) * 100)
        : null,
      totalSessions,
      scopedToTeacherClasses: !schoolWide,
      counts,
      records: visibleRows.slice(0, 200).map((row) => ({
        id: row.id,
        sessionId: row.session.id,
        title: row.session.titleSnapshot || "جلسه ثبت‌شده",
        contextType:
          row.session.contextType === "study_group"
            ? "class_group"
            : row.session.contextType,
        sessionDate: row.session.sessionDate.toISOString(),
        status: row.status,
        note: row.note,
      })),
    };
  }
  async encouragement(
    user: AuthenticatedUser,
  ): Promise<AttendanceEncouragement> {
    const student = await this.selfStudent(user);
    const rows = await this.repo(AttendanceRecord).find({
      where: {
        student: { id: student.id },
        session: { organization: { id: student.organization!.id } },
      },
    });
    const counts = this.counts(rows);
    const pointRows = await this.repo(StudentRewardLedger).find({
      where: { student: { id: student.id } },
    });
    const points = pointRows.reduce((total, row) => total + row.points, 0);
    const rate = rows.length
      ? Math.round(((counts.present + counts.late) / rows.length) * 100)
      : null;
    return {
      totalSessions: rows.length,
      ...counts,
      attendanceRate: rate,
      points,
      message: !rows.length
        ? "با حضور منظم، شروع خوبی بسازید."
        : counts.absent > 0
          ? "برای حضور منظم‌تر برنامه‌ریزی کنید و اگر مشکلی دارید با ناظر مدرسه صحبت کنید."
          : counts.late > 0
            ? "حضور شما خوب است؛ با رسیدن به‌موقع آن را بهتر کنید."
            : "حضور منظم شما قابل تقدیر است؛ همین مسیر را ادامه دهید.",
    } as AttendanceEncouragement;
  }
  private counts(rows: AttendanceRecord[]) {
    const counts = { present: 0, absent: 0, late: 0, excused: 0 };
    for (const row of rows) counts[row.status]++;
    return counts;
  }
  /** Teachers see only sessions whose context is assigned to them; school-wide roles keep their full scope. */
  private async visibleSessions(user: AuthenticatedUser, sessions: AttendanceSession[]) {
    if (this.attendance.hasSchoolWideScope(user)) return sessions;
    return (
      await Promise.all(
        sessions.map(async (session) => {
          if (
            !session.organization ||
            !["class", "class_group", "study_group"].includes(session.contextType)
          )
            return null;
          try {
            await this.attendance.authorizeContext(
              user,
              session.contextType,
              session.contextId,
              session.organization.id,
              false,
            );
            return session;
          } catch (error) {
            if (error instanceof ApiException && error.getStatus() === 403) return null;
            throw error;
          }
        }),
      )
    ).filter((session): session is AttendanceSession => Boolean(session));
  }
  private async audit(
    manager: EntityManager,
    user: AuthenticatedUser,
    organizationId: string,
    action: string,
    metadata: Record<string, unknown>,
  ) {
    await manager.getRepository(AuditLog).save({
      user: { id: user.id },
      organizationId,
      entity: "attendance",
      action,
      metadata,
    });
  }
}
