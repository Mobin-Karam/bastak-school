"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceOperationsService = void 0;
exports.attendanceSummaryWindow = attendanceSummaryWindow;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const node_crypto_1 = require("node:crypto");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const attendance_session_entity_1 = require("../../database/entities/attendance-session.entity");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const attendance_pool_entity_1 = require("../../database/entities/attendance-pool.entity");
const dorm_attendance_delegate_entity_1 = require("../../database/entities/dorm-attendance-delegate.entity");
const dorm_room_entity_1 = require("../../database/entities/dorm-room.entity");
const dorm_room_assignment_entity_1 = require("../../database/entities/dorm-room-assignment.entity");
const attendance_write_receipt_entity_1 = require("../../database/entities/attendance-write-receipt.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const school_access_1 = require("../school-access");
const realtime_1 = require("../realtime");
const attendance_service_1 = require("./attendance.service");
const attendance_transaction_1 = require("./attendance-transaction");
const attendance_time_1 = require("./attendance-time");
const zone = "Asia/Tehran";
function attendanceSummaryWindow(now = new Date()) {
    const day = (0, attendance_time_1.operationalDate)(now, zone, "16:00");
    return {
        day,
        startsAt: (0, attendance_time_1.schoolLocalInstant)(day, "16:00", zone),
        resetsAt: (0, attendance_time_1.schoolLocalInstant)((0, attendance_time_1.shiftSchoolDate)(day, 1), "16:00", zone),
    };
}
let AttendanceOperationsService = class AttendanceOperationsService {
    sessions;
    attendance;
    access;
    realtime;
    constructor(sessions, attendance, access, realtime) {
        this.sessions = sessions;
        this.attendance = attendance;
        this.access = access;
        this.realtime = realtime;
    }
    repo(entity) {
        return this.sessions.manager.getRepository(entity);
    }
    requireCapability(user, capability) {
        if (!user.capabilities?.includes(capability))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    }
    staff(user, capability = "attendance.review") {
        this.requireCapability(user, capability);
        if (![
            "PRINCIPAL",
            "SCHOOL_SUPERVISOR",
            "ORGANIZATION_ADMIN",
            "PLATFORM_ADMIN",
        ].some((role) => (user.roles ?? [user.role]).includes(role)))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "این بخش فقط برای مدیر و ناظر مدرسه است.");
    }
    async orgIds(user) {
        return this.access.scopedOrganizationIds({ ...user, role: user.roles?.[0] ?? user.role }, user.activeOrganizationId || undefined);
    }
    async selfStudent(user) {
        this.requireCapability(user, "attendance.self.read");
        if (!(user.roles ?? [user.role]).includes("STUDENT"))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "حساب طلبه لازم است.");
        const ids = await this.orgIds(user);
        const student = ids.length
            ? await this.repo(student_entity_1.Student).findOne({
                where: {
                    user: { id: user.id, status: user_entity_1.UserStatus.ACTIVE },
                    organization: { id: (0, typeorm_2.In)(ids) },
                    accountStatus: "active",
                },
                relations: { user: true, organization: true },
            })
            : null;
        if (!student?.organization)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "حساب فعال طلبه در مدرسه پیدا نشد.");
        await this.access.organizationForUser(user, student.organization.id);
        return student;
    }
    delegateView(row) {
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
    async delegates(user) {
        this.staff(user, "attendance.delegate");
        const ids = await this.orgIds(user);
        return ids.length
            ? (await this.repo(dorm_attendance_delegate_entity_1.DormAttendanceDelegate).find({
                where: { organization: { id: (0, typeorm_2.In)(ids) } },
                relations: { room: true, student: true },
            })).map((row) => this.delegateView(row))
            : [];
    }
    async setDelegate(user, roomId, dto) {
        this.staff(user, "attendance.delegate");
        try {
            (0, attendance_time_1.shiftSchoolDate)(dto.startsOn, 0);
            (0, attendance_time_1.shiftSchoolDate)(dto.endsOn, 0);
        }
        catch {
            throw new api_exception_1.ApiException(422, "ATTENDANCE_DATE_INVALID", "تاریخ معتبر نیست.");
        }
        if (dto.startsOn > dto.endsOn ||
            dto.endsOn > (0, attendance_time_1.shiftSchoolDate)(dto.startsOn, 365))
            throw new api_exception_1.ApiException(422, "ATTENDANCE_DELEGATE_RANGE", "بازه باید بین یک شب و یک سال باشد.");
        const descriptor = await this.attendance.contextDescriptor("dorm", roomId);
        await this.attendance.authorizeContext(user, "dorm", roomId, descriptor.organizationId, true);
        if (descriptor.status !== "ACTIVE")
            throw new api_exception_1.ApiException(422, "DORM_ROOM_INACTIVE", "اتاق فعال نیست.");
        const result = await (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, async (manager) => {
            const member = await manager.getRepository(dorm_room_assignment_entity_1.DormRoomAssignment).findOne({
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
            if (!member?.student.user ||
                member.student.user.status !== user_entity_1.UserStatus.ACTIVE ||
                !(await this.access.activeMembershipForUser(member.student.user.id, descriptor.organizationId)))
                throw new api_exception_1.ApiException(422, "ATTENDANCE_DELEGATE_NOT_RESIDENT", "یک طلبه ساکن اتاق با حساب فعال مدرسه انتخاب کنید.");
            const repo = manager.getRepository(dorm_attendance_delegate_entity_1.DormAttendanceDelegate);
            const previous = await repo.findOne({
                where: { room: { id: roomId } },
                relations: { student: true, room: true },
            });
            const saved = await repo.save(repo.create({
                id: previous?.id,
                organization: { id: descriptor.organizationId },
                room: member.room,
                student: member.student,
                grantedBy: { id: user.id },
                startsOn: dto.startsOn,
                endsOn: dto.endsOn,
                revoked: false,
                dormWide: false,
            }));
            await this.audit(manager, user, descriptor.organizationId, "attendance.delegate.assigned", {
                before: previous ? this.delegateView(previous) : null,
                after: this.delegateView(saved),
            });
            return {
                view: this.delegateView(saved),
                recipients: [
                    user.id,
                    member.student.user.id,
                    ...(previous?.student.user?.id ? [previous.student.user.id] : []),
                ],
            };
        });
        this.realtime.emitToUsers(result.recipients, "attendance.updated", {
            organizationId: descriptor.organizationId,
            contextType: "dorm",
            contextId: roomId,
        });
        return result.view;
    }
    async dormResidents(user) {
        this.staff(user, "attendance.delegate");
        const ids = await this.orgIds(user);
        if (!ids.length)
            return [];
        const rows = await this.repo(dorm_room_assignment_entity_1.DormRoomAssignment).find({
            where: { room: { organization: { id: (0, typeorm_2.In)(ids) }, status: "ACTIVE" }, student: { organization: { id: (0, typeorm_2.In)(ids) }, accountStatus: "active", user: { status: user_entity_1.UserStatus.ACTIVE } } },
            relations: { student: { user: true, organization: true }, room: { organization: true } },
        });
        const eligible = [];
        for (const row of rows) {
            if (row.student.organization?.id !== row.room.organization.id || !row.student.user)
                continue;
            if (await this.access.activeMembershipForUser(row.student.user.id, row.room.organization.id))
                eligible.push({ id: row.student.id, name: row.student.name, organizationId: row.room.organization.id, userId: row.student.user.id });
        }
        return [...new Map(eligible.map(row => [row.id, row])).values()];
    }
    async setDormWideDelegate(user, dto) {
        this.staff(user, "attendance.delegate");
        try {
            (0, attendance_time_1.shiftSchoolDate)(dto.startsOn, 0);
            (0, attendance_time_1.shiftSchoolDate)(dto.endsOn, 0);
        }
        catch {
            throw new api_exception_1.ApiException(422, "ATTENDANCE_DATE_INVALID", "تاریخ معتبر نیست.");
        }
        if (dto.startsOn > dto.endsOn || dto.endsOn > (0, attendance_time_1.shiftSchoolDate)(dto.startsOn, 365))
            throw new api_exception_1.ApiException(422, "ATTENDANCE_DELEGATE_RANGE", "بازه باید بین یک شب و یک سال باشد.");
        const selected = (await this.dormResidents(user)).find(row => row.id === dto.studentId);
        if (!selected)
            throw new api_exception_1.ApiException(422, "ATTENDANCE_DELEGATE_NOT_RESIDENT", "یک طلبه ساکن خوابگاه با حساب فعال انتخاب کنید.");
        await this.attendance.authorizeOrganization(user, selected.organizationId);
        const rooms = await this.repo(dorm_room_entity_1.DormRoom).find({ where: { organization: { id: selected.organizationId }, status: "ACTIVE" } });
        if (!rooms.length || rooms.length > 500)
            throw new api_exception_1.ApiException(422, "ATTENDANCE_DELEGATE_ROOMS", "تعداد اتاق‌ها معتبر نیست.");
        const result = await (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, async (manager) => {
            const repo = manager.getRepository(dorm_attendance_delegate_entity_1.DormAttendanceDelegate);
            const views = [];
            for (const room of rooms) {
                const previous = await repo.findOne({ where: { room: { id: room.id } }, relations: { student: true, room: true } });
                const student = await manager.getRepository(student_entity_1.Student).findOneByOrFail({ id: selected.id });
                const row = await repo.save(repo.create({ id: previous?.id, organization: { id: selected.organizationId }, room, student, grantedBy: { id: user.id }, startsOn: dto.startsOn, endsOn: dto.endsOn, revoked: false, dormWide: true }));
                const view = this.delegateView(row);
                await this.audit(manager, user, selected.organizationId, "attendance.delegate.assigned", { before: previous ? this.delegateView(previous) : null, after: view });
                views.push(view);
            }
            return views;
        });
        this.realtime.emitToUsers([user.id, selected.userId], "attendance.updated", { organizationId: selected.organizationId, contextType: "dorm" });
        return result;
    }
    async revokeDormWideDelegate(user) {
        this.staff(user, "attendance.delegate");
        const ids = await this.orgIds(user);
        if (!ids.length)
            return { revoked: true };
        return (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, async (manager) => {
            const repo = manager.getRepository(dorm_attendance_delegate_entity_1.DormAttendanceDelegate);
            const rows = await repo.find({ where: { organization: { id: (0, typeorm_2.In)(ids) }, dormWide: true, revoked: false }, relations: { organization: true, student: { user: true }, room: true } });
            for (const row of rows) {
                row.revoked = true;
                await repo.save(row);
                await this.audit(manager, user, row.organization.id, "attendance.delegate.revoked", { roomId: row.room?.id, delegateId: row.id });
            }
            return { revoked: true };
        });
    }
    async isDormResident(manager, studentId, organizationId) {
        return !!(await manager.getRepository(dorm_room_assignment_entity_1.DormRoomAssignment).findOne({ where: { student: { id: studentId, organization: { id: organizationId } }, room: { organization: { id: organizationId }, status: "ACTIVE" } } }));
    }
    async revokeDelegate(user, roomId) {
        this.staff(user, "attendance.delegate");
        const descriptor = await this.attendance.contextDescriptor("dorm", roomId);
        await this.attendance.authorizeContext(user, "dorm", roomId, descriptor.organizationId, true);
        return (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, async (manager) => {
            const repo = manager.getRepository(dorm_attendance_delegate_entity_1.DormAttendanceDelegate);
            const row = await repo.findOne({
                where: {
                    room: { id: roomId },
                    organization: { id: descriptor.organizationId },
                },
            });
            if (row && !row.revoked) {
                row.revoked = true;
                await repo.save(row);
                await this.audit(manager, user, descriptor.organizationId, "attendance.delegate.revoked", { roomId, delegateId: row.id });
            }
            return { revoked: true };
        });
    }
    async residentRoster(manager, roomId, organizationId) {
        const members = await manager.getRepository(dorm_room_assignment_entity_1.DormRoomAssignment).find({
            where: {
                room: { id: roomId, status: "ACTIVE" },
                student: { organization: { id: organizationId } },
            },
            relations: { student: { user: true } },
            order: { createdAt: "ASC" },
        });
        return members.map((row) => row.student);
    }
    async myDormAssignments(user) {
        const student = await this.selfStudent(user);
        const rows = await this.repo(dorm_attendance_delegate_entity_1.DormAttendanceDelegate).find({
            where: {
                student: { id: student.id },
                organization: { id: student.organization.id },
                revoked: false,
            },
            relations: { room: true, student: true },
        });
        const { day } = attendanceSummaryWindow();
        const result = [];
        for (const row of rows) {
            if (row.endsOn < day || row.room.status !== "ACTIVE")
                continue;
            const roster = await this.residentRoster(this.sessions.manager, row.room.id, student.organization.id);
            if (!(row.dormWide ? await this.isDormResident(this.sessions.manager, student.id, student.organization.id) : roster.some((member) => member.id === student.id)))
                continue;
            const session = await this.sessions.findOne({
                where: {
                    organization: { id: student.organization.id },
                    occurrenceKey: `dorm-delegate:${row.room.id}:${day}`,
                },
                relations: { records: { student: true } },
            });
            result.push({
                ...this.delegateView(row),
                nightDate: day,
                revision: session?.revision ?? 0,
                canMark: row.startsOn <= day && day <= row.endsOn,
                roster: row.startsOn <= day
                    ? roster.map((member) => ({ id: member.id, name: member.name }))
                    : [],
                records: (session?.records ?? [])
                    .filter((record) => roster.some((member) => member.id === record.student.id))
                    .map((record) => ({
                    studentId: record.student.id,
                    status: record.status,
                })),
            });
        }
        return result;
    }
    async markDorm(user, id, dto) {
        const student = await this.selfStudent(user);
        if (!dto.entries.length ||
            dto.entries.length > 500 ||
            new Set(dto.entries.map((entry) => entry.studentId)).size !==
                dto.entries.length ||
            dto.entries.some((entry) => !["present", "absent", "late"].includes(entry.status)))
            throw new api_exception_1.ApiException(422, "ATTENDANCE_ENTRIES_INVALID", "وضعیت‌های ارسال‌شده معتبر نیست.");
        const fingerprint = (0, node_crypto_1.createHash)("sha256")
            .update(JSON.stringify({
            id,
            expectedRevision: dto.expectedRevision,
            nightDate: dto.nightDate,
            entries: [...dto.entries].sort((a, b) => a.studentId.localeCompare(b.studentId)),
        }))
            .digest("hex");
        const result = await (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, async (manager) => {
            const delegate = await manager
                .getRepository(dorm_attendance_delegate_entity_1.DormAttendanceDelegate)
                .findOne({
                where: {
                    id,
                    student: { id: student.id },
                    organization: { id: student.organization.id },
                    revoked: false,
                },
                relations: { room: true },
            });
            const today = attendanceSummaryWindow().day;
            if (!delegate ||
                delegate.room.status !== "ACTIVE" ||
                dto.nightDate !== today ||
                today < delegate.startsOn ||
                today > delegate.endsOn)
                throw new api_exception_1.ApiException(403, "ATTENDANCE_DELEGATE_EXPIRED", "اجازه ثبت این اتاق یا شب را ندارید.");
            const roster = await this.residentRoster(manager, delegate.room.id, student.organization.id);
            if (!(delegate.dormWide ? await this.isDormResident(manager, student.id, student.organization.id) : roster.some((member) => member.id === student.id)) ||
                dto.entries.some((entry) => !roster.some((member) => member.id === entry.studentId)))
                throw new api_exception_1.ApiException(403, "ATTENDANCE_DELEGATE_SCOPE", "ثبت فقط برای ساکنان اتاق شما مجاز است.");
            const receipts = manager.getRepository(attendance_write_receipt_entity_1.AttendanceWriteReceipt);
            const receipt = await receipts.findOne({
                where: {
                    organization: { id: student.organization.id },
                    actor: { id: user.id },
                    requestId: dto.requestId,
                },
            });
            if (receipt) {
                if (receipt.fingerprint !== fingerprint)
                    throw new api_exception_1.ApiException(409, "ATTENDANCE_REQUEST_REUSED", "شناسه درخواست قبلاً استفاده شده است.");
                return receipt.result;
            }
            const sessions = manager.getRepository(attendance_session_entity_1.AttendanceSession);
            const occurrenceKey = `dorm-delegate:${delegate.room.id}:${today}`;
            let session = await sessions.findOne({
                where: {
                    organization: { id: student.organization.id },
                    occurrenceKey,
                },
            });
            if ((session?.revision ?? 0) !== dto.expectedRevision)
                throw new api_exception_1.ApiException(409, "ATTENDANCE_REVISION_CONFLICT", "حضور اتاق تغییر کرده است. فهرست را ببندید و دوباره باز کنید.");
            if (!session)
                session = await sessions.save(sessions.create({
                    organization: student.organization,
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
                }));
            const records = manager.getRepository(attendance_record_entity_1.AttendanceRecord);
            for (const entry of dto.entries) {
                if (!session.rosterSnapshot?.some((member) => member.id === entry.studentId))
                    throw new api_exception_1.ApiException(409, "ATTENDANCE_ROSTER_CHANGED", "فهرست اتاق تغییر کرده؛ از ناظر بخواهید جلسه تازه ایجاد کند.");
                const old = await records.findOne({
                    where: {
                        session: { id: session.id },
                        student: { id: entry.studentId },
                    },
                });
                await records.save(records.create({
                    id: old?.id,
                    session,
                    student: { id: entry.studentId },
                    status: entry.status,
                    physicalStatus: entry.status,
                    recordedBy: { id: user.id },
                    revision: (old?.revision ?? 0) + 1,
                    reviewStatus: entry.status === "absent"
                        ? attendance_record_entity_1.AttendanceReviewStatus.PENDING
                        : null,
                    reviewNote: "",
                    reviewedBy: null,
                    reviewedAt: null,
                }));
            }
            session.revision++;
            await sessions.save(session);
            const saved = { sessionId: session.id, count: dto.entries.length };
            await receipts.save(receipts.create({
                organization: student.organization,
                actor: { id: user.id },
                requestId: dto.requestId,
                fingerprint,
                session,
                result: saved,
            }));
            await this.audit(manager, user, student.organization.id, "attendance.dorm.delegated-mark", { sessionId: session.id, delegateId: id, entries: dto.entries });
            return saved;
        });
        this.realtime.emitToUser(user.id, "attendance.updated", {
            sessionId: result.sessionId,
        });
        return result;
    }
    snapshot(student) {
        return {
            id: student.id,
            name: student.name,
            userId: student.user?.id ?? null,
            nationalCode: student.nationalCode ?? null,
        };
    }
    poolView(row) {
        const expected = row.session.rosterSnapshot?.length ?? 0;
        const present = row.session.records?.filter((record) => record.status === "present")
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
    async pools(user) {
        this.staff(user);
        const ids = await this.orgIds(user);
        return ids.length
            ? (await this.repo(attendance_pool_entity_1.AttendancePool).find({
                where: { organization: { id: (0, typeorm_2.In)(ids) } },
                relations: { session: { records: true } },
                order: { createdAt: "DESC" },
                take: 100,
            })).map((row) => this.poolView(row))
            : [];
    }
    async createPool(user, dto) {
        this.staff(user);
        this.requireCapability(user, "attendance.manage");
        const organization = await this.attendance.authorizeContext(user, dto.contextType, dto.contextId, dto.organizationId, true);
        const descriptor = await this.attendance.contextDescriptor(dto.contextType, dto.contextId);
        if (descriptor.status !== "ACTIVE")
            throw new api_exception_1.ApiException(422, "ATTENDANCE_CONTEXT_INACTIVE", "محل حضور فعال نیست.");
        const roster = await this.attendance.listParticipants(user, dto.contextType, dto.contextId);
        if (!roster.length || roster.length > 500)
            throw new api_exception_1.ApiException(422, "ATTENDANCE_POOL_ROSTER", "فراخوان باید بین ۱ و ۵۰۰ عضو داشته باشد.");
        if (!dto.title.trim() ||
            !dto.place.trim() ||
            dto.durationMinutes < 1 ||
            dto.durationMinutes > 240)
            throw new api_exception_1.ApiException(422, "ATTENDANCE_POOL_INVALID", "عنوان، محل و زمان فراخوان لازم است.");
        const fingerprint = (0, node_crypto_1.createHash)("sha256")
            .update(JSON.stringify(dto))
            .digest("hex");
        const pool = await (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, async (manager) => {
            const sessions = manager.getRepository(attendance_session_entity_1.AttendanceSession);
            const existing = await sessions.findOne({
                where: {
                    organization: { id: organization.id },
                    occurrenceKey: `pool:${user.id}:${dto.requestId}`,
                },
            });
            if (existing) {
                if (existing.creationFingerprint !== fingerprint)
                    throw new api_exception_1.ApiException(409, "ATTENDANCE_REQUEST_REUSED", "شناسه درخواست قبلاً استفاده شده است.");
                return manager.getRepository(attendance_pool_entity_1.AttendancePool).findOneOrFail({
                    where: { session: { id: existing.id } },
                    relations: { session: { records: true } },
                });
            }
            const session = await sessions.save(sessions.create({
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
            }));
            const saved = await manager.getRepository(attendance_pool_entity_1.AttendancePool).save(manager.getRepository(attendance_pool_entity_1.AttendancePool).create({
                organization,
                session,
                place: dto.place.trim(),
                endsAt: new Date(Date.now() + dto.durationMinutes * 60000),
            }));
            await this.audit(manager, user, organization.id, "attendance.pool.opened", { sessionId: session.id, poolId: saved.id });
            return saved;
        });
        this.realtime.emitToUsers(pool.session.rosterSnapshot?.flatMap((member) => member.userId ? [member.userId] : []) ?? [], "attendance.updated", { poolId: pool.id });
        return this.poolView(pool);
    }
    async closePool(user, id) {
        this.staff(user);
        this.requireCapability(user, "attendance.manage");
        const result = await (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, async (manager) => {
            const repo = manager.getRepository(attendance_pool_entity_1.AttendancePool);
            const pool = await repo.findOne({
                where: { id },
                relations: { organization: true, session: true },
            });
            if (!pool)
                throw new api_exception_1.ApiException(404, "ATTENDANCE_POOL_NOT_FOUND", "فراخوان پیدا نشد.");
            await this.attendance.authorizeOrganization(user, pool.organization.id);
            if (!pool.closedAt) {
                pool.closedAt = new Date();
                pool.session.status = "finalized";
                await repo.save(pool);
                await manager.getRepository(attendance_session_entity_1.AttendanceSession).save(pool.session);
                await this.audit(manager, user, pool.organization.id, "attendance.pool.closed", { sessionId: pool.session.id, poolId: id });
            }
            return { closed: true };
        });
        return result;
    }
    async myPools(user) {
        const student = await this.selfStudent(user);
        const pools = await this.repo(attendance_pool_entity_1.AttendancePool).find({
            where: {
                organization: { id: student.organization.id },
                closedAt: (0, typeorm_2.IsNull)(),
                endsAt: (0, typeorm_2.MoreThan)(new Date()),
            },
            order: { endsAt: "ASC" },
            relations: { session: { records: { student: true } } },
        });
        return pools
            .filter((pool) => !this.poolView(pool).closed &&
            pool.session.rosterSnapshot?.some((member) => member.id === student.id && member.userId === user.id) &&
            !pool.session.records.some((record) => record.student.id === student.id))
            .map((pool) => ({
            id: pool.id,
            title: pool.session.titleSnapshot,
            place: pool.place,
            endsAt: pool.endsAt.toISOString(),
        }));
    }
    async checkIn(user, id) {
        const student = await this.selfStudent(user);
        return (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, async (manager) => {
            const pool = await manager.getRepository(attendance_pool_entity_1.AttendancePool).findOne({
                where: { id, organization: { id: student.organization.id } },
                relations: { session: true },
            });
            if (!pool ||
                pool.closedAt ||
                pool.endsAt.getTime() <= Date.now() ||
                !pool.session.rosterSnapshot?.some((member) => member.id === student.id && member.userId === user.id))
                throw new api_exception_1.ApiException(403, "ATTENDANCE_POOL_CLOSED", "این فراخوان فعال نیست یا برای شما نیست.");
            const records = manager.getRepository(attendance_record_entity_1.AttendanceRecord);
            if (!(await records.findOne({
                where: {
                    session: { id: pool.session.id },
                    student: { id: student.id },
                },
            }))) {
                await records.save(records.create({
                    session: pool.session,
                    student,
                    status: attendance_record_entity_1.AttendanceStatus.PRESENT,
                    physicalStatus: "present",
                    recordedBy: { id: user.id },
                    revision: 1,
                }));
                await this.audit(manager, user, student.organization.id, "attendance.pool.checked-in", { sessionId: pool.session.id, studentId: student.id });
            }
            return { confirmed: true };
        });
    }
    async staffSessions(user) {
        this.staff(user);
        const ids = await this.orgIds(user);
        const rows = ids.length
            ? await this.sessions.find({
                where: { organization: { id: (0, typeorm_2.In)(ids) } },
                relations: { records: true },
                order: { sessionDate: "DESC" },
                take: 200,
            })
            : [];
        return rows.map((session) => {
            const counts = this.counts(session.records ?? []);
            return {
                id: session.id,
                contextType: session.contextType === "study_group"
                    ? "class_group"
                    : session.contextType,
                contextId: session.contextId,
                title: session.titleSnapshot || "جلسه ثبت‌شده",
                sessionDate: session.sessionDate.toISOString(),
                expected: session.rosterSnapshot == null ? null : session.rosterSnapshot.length,
                ...counts,
                unmarked: session.rosterSnapshot == null
                    ? null
                    : Math.max(0, session.rosterSnapshot.length - session.records.length),
            };
        });
    }
    async dailyOverview(user) {
        this.staff(user);
        const ids = await this.orgIds(user);
        const window = attendanceSummaryWindow();
        const rows = ids.length
            ? await this.sessions
                .createQueryBuilder("session")
                .leftJoinAndSelect("session.records", "record")
                .where("session.organizationId IN (:...ids)", { ids })
                .andWhere("session.sessionDate >= :start AND session.sessionDate < :end", { start: window.startsAt, end: window.resetsAt })
                .getMany()
            : [];
        return {
            day: window.day,
            startsAt: window.startsAt.toISOString(),
            resetsAt: window.resetsAt.toISOString(),
            timeZone: zone,
            sessions: rows.length,
            present: rows.reduce((n, s) => n + this.counts(s.records).present, 0),
            absent: rows.reduce((n, s) => n + this.counts(s.records).absent, 0),
            late: rows.reduce((n, s) => n + this.counts(s.records).late, 0),
            excused: rows.reduce((n, s) => n + this.counts(s.records).excused, 0),
            unmarked: rows.reduce((n, s) => n +
                Math.max(0, (s.rosterSnapshot?.length ?? s.records.length) - s.records.length), 0),
        };
    }
    async staffProfile(user, id) {
        this.staff(user);
        const ids = await this.orgIds(user);
        const student = ids.length
            ? await this.repo(student_entity_1.Student).findOne({
                where: { id, organization: { id: (0, typeorm_2.In)(ids) } },
                relations: { user: true },
            })
            : null;
        if (!student || student.user?.id === user.id)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده مجاز طلبه پیدا نشد.");
        const rows = await this.repo(attendance_record_entity_1.AttendanceRecord).find({
            where: { student: { id }, session: { organization: { id: (0, typeorm_2.In)(ids) } } },
            relations: { session: true },
            order: { createdAt: "DESC" },
        });
        return {
            studentId: id,
            name: student.name,
            counts: this.counts(rows),
            records: rows.slice(0, 200).map((row) => ({
                id: row.id,
                sessionId: row.session.id,
                title: row.session.titleSnapshot || "جلسه ثبت‌شده",
                contextType: row.session.contextType === "study_group"
                    ? "class_group"
                    : row.session.contextType,
                sessionDate: row.session.sessionDate.toISOString(),
                status: row.status,
                note: row.note,
            })),
        };
    }
    async encouragement(user) {
        const student = await this.selfStudent(user);
        const rows = await this.repo(attendance_record_entity_1.AttendanceRecord).find({
            where: {
                student: { id: student.id },
                session: { organization: { id: student.organization.id } },
            },
        });
        const counts = this.counts(rows);
        const rate = rows.length
            ? Math.round(((counts.present + counts.late) / rows.length) * 100)
            : null;
        return {
            totalSessions: rows.length,
            ...counts,
            attendanceRate: rate,
            message: !rows.length
                ? "با حضور منظم، شروع خوبی بسازید."
                : counts.absent > 0
                    ? "برای حضور منظم‌تر برنامه‌ریزی کنید و اگر مشکلی دارید با ناظر مدرسه صحبت کنید."
                    : counts.late > 0
                        ? "حضور شما خوب است؛ با رسیدن به‌موقع آن را بهتر کنید."
                        : "حضور منظم شما قابل تقدیر است؛ همین مسیر را ادامه دهید.",
        };
    }
    counts(rows) {
        const counts = { present: 0, absent: 0, late: 0, excused: 0 };
        for (const row of rows)
            counts[row.status]++;
        return counts;
    }
    async audit(manager, user, organizationId, action, metadata) {
        await manager.getRepository(audit_log_entity_1.AuditLog).save({
            user: { id: user.id },
            organizationId,
            entity: "attendance",
            action,
            metadata,
        });
    }
};
exports.AttendanceOperationsService = AttendanceOperationsService;
exports.AttendanceOperationsService = AttendanceOperationsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_session_entity_1.AttendanceSession)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        attendance_service_1.AttendanceService,
        school_access_1.SchoolAccessService,
        realtime_1.RealtimeService])
], AttendanceOperationsService);
//# sourceMappingURL=attendance-operations.service.js.map