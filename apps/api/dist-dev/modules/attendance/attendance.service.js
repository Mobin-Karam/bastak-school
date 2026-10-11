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
exports.AttendanceService = void 0;
const attendance_transaction_1 = require("./attendance-transaction");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const node_crypto_1 = require("node:crypto");
const attendance_write_receipt_entity_1 = require("../../database/entities/attendance-write-receipt.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const attendance_session_entity_1 = require("../../database/entities/attendance-session.entity");
const dorm_room_assignment_entity_1 = require("../../database/entities/dorm-room-assignment.entity");
const dorm_room_entity_1 = require("../../database/entities/dorm-room.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const study_group_membership_entity_1 = require("../../database/entities/study-group-membership.entity");
const study_group_entity_1 = require("../../database/entities/study-group.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const authorization_1 = require("../authorization");
const school_access_1 = require("../school-access");
const realtime_1 = require("../realtime");
const maximumAttendanceBatchSize = 500;
let AttendanceService = class AttendanceService {
    sessions;
    records;
    students;
    classes;
    enrollments;
    groups;
    groupMemberships;
    rooms;
    roomAssignments;
    memberships;
    access;
    authorization;
    realtime;
    constructor(sessions, records, students, classes, enrollments, groups, groupMemberships, rooms, roomAssignments, memberships, access, authorization, realtime) {
        this.sessions = sessions;
        this.records = records;
        this.students = students;
        this.classes = classes;
        this.enrollments = enrollments;
        this.groups = groups;
        this.groupMemberships = groupMemberships;
        this.rooms = rooms;
        this.roomAssignments = roomAssignments;
        this.memberships = memberships;
        this.access = access;
        this.authorization = authorization;
        this.realtime = realtime;
    }
    async authorizeOrganization(user, organizationId) {
        this.assertWorkOrganization(user, organizationId);
        return this.access.organizationForUser(this.effectiveUser(user), organizationId);
    }
    async authorizeContext(user, type, id, organizationId, manage) {
        const organization = await this.authorizeOrganization(user, organizationId);
        await this.assertContextAccess(user, this.context(type), id, organization.id, manage);
        return organization;
    }
    hasSchoolWideScope(user) {
        return this.schoolWide(user);
    }
    async contextDescriptor(type, id) {
        const context = this.context(type);
        if (context === "class") {
            const row = await this.classes.findOne({
                where: { id },
                relations: { organization: true },
            });
            if (!row)
                throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
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
                throw new api_exception_1.ApiException(404, "CLASS_GROUP_NOT_FOUND", "گروه پیدا نشد.");
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
            throw new api_exception_1.ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق پیدا نشد.");
        return {
            organizationId: row.organization.id,
            title: row.name,
            status: row.status,
        };
    }
    async sessionDetail(user, id) {
        const session = await this.authorizedSavedSession(user, id);
        const records = await this.records.find({
            where: { session: { id } },
            relations: { student: true, recordedBy: true },
            order: { createdAt: "ASC", id: "ASC" },
        });
        const roster = session.rosterSnapshot ?? [];
        const expected = session.rosterSnapshot == null ? null : roster.length;
        const canManage = false;
        return {
            id: session.id,
            organizationId: session.organization.id,
            organizationName: session.organization.name,
            contextType: session.contextType === "study_group"
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
                physicalStatus: record.physicalStatus ??
                    (record.status === attendance_record_entity_1.AttendanceStatus.EXCUSED
                        ? record.reviewStatus === attendance_record_entity_1.AttendanceReviewStatus.APPROVED
                            ? "absent"
                            : "legacy_unknown"
                        : record.status),
                legacyStatus: record.status,
                note: record.note,
                revision: record.revision,
                minutesLate: record.minutesLate ?? null,
                arrivalAt: record.arrivalAt?.toISOString() ?? null,
                recordedById: record.recordedBy?.id ?? null,
                recordedByName: [record.recordedBy?.firstName, record.recordedBy?.lastName]
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
            unmarked: expected === null
                ? null
                : roster.filter((student) => !records.some((record) => record.student.id === student.id)).length,
            canManage,
            canCorrect: false,
        };
    }
    async sessionHistory(user, id) {
        const session = await this.authorizedSavedSession(user, id);
        return this.sessions.manager
            .getRepository(audit_log_entity_1.AuditLog)
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
    async authorizedSavedSession(user, id) {
        if (!user.capabilities?.includes("attendance.read"))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی به حضور و غیاب ندارید.");
        const session = await this.sessions.findOne({
            where: { id },
            relations: { organization: true, assignedStaff: true, submittedBy: true },
        });
        if (!session)
            throw new api_exception_1.ApiException(404, "ATTENDANCE_SESSION_NOT_FOUND", "جلسه حضور و غیاب پیدا نشد.");
        await this.authorizeOrganization(user, session.organization.id);
        if (session.contextType === "pool") {
            this.assertReviewAccess(user);
            if (!user.capabilities?.includes("attendance.review"))
                throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
            return session;
        }
        const descriptor = await this.contextDescriptor(session.contextType, session.contextId);
        if (descriptor.organizationId !== session.organization.id)
            throw new api_exception_1.ApiException(403, "ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH", "سازمان جلسه با محل حضور و غیاب تطابق ندارد.");
        if (session.assignedStaff?.id !== user.id)
            await this.authorizeContext(user, session.contextType, session.contextId, session.organization.id, false);
        return session;
    }
    async listContexts(user, organizationId) {
        const ids = await this.access.scopedOrganizationIds(this.effectiveUser(user), organizationId || user.activeOrganizationId || undefined);
        if (!ids.length)
            return [];
        const [classes, groups, rooms] = await Promise.all([
            this.classes.find({
                where: { organization: { id: (0, typeorm_2.In)(ids) }, status: "ACTIVE" },
                relations: {
                    organization: true,
                    advisor: true,
                    books: { teacher: true },
                    enrollments: true,
                },
            }),
            this.groups.find({
                where: { organization: { id: (0, typeorm_2.In)(ids) }, status: "ACTIVE" },
                relations: {
                    organization: true,
                    classroom: { advisor: true, books: { teacher: true } },
                    memberships: true,
                },
            }),
            this.rooms.find({
                where: { organization: { id: (0, typeorm_2.In)(ids) }, status: "ACTIVE" },
                relations: { organization: true, assignments: true },
            }),
        ]);
        const schoolWide = this.schoolWide(user);
        const canDorm = schoolWide || user.roles?.includes("DISCIPLINARIAN");
        return [
            ...classes
                .filter((item) => schoolWide ||
                item.advisor?.id === user.id ||
                item.books?.some((book) => book.teacher?.id === user.id))
                .map((item) => ({
                id: item.id,
                contextType: "class",
                code: item.code,
                name: item.name,
                label: `${item.name} (${item.code})`,
                total: item.enrollments?.length ?? 0,
                activeOrganizationId: item.organization.id,
            })),
            ...groups
                .filter((item) => schoolWide ||
                item.classroom?.advisor?.id === user.id ||
                item.classroom?.books?.some((book) => book.teacher?.id === user.id))
                .map((item) => ({
                id: item.id,
                contextType: "class_group",
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
                    contextType: "dorm",
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
    async listSessions(user, organizationId) {
        const ids = await this.access.scopedOrganizationIds(this.effectiveUser(user), organizationId || user.activeOrganizationId || undefined);
        if (!ids.length)
            return [];
        const allowed = await this.listContexts(user, organizationId || user.activeOrganizationId || undefined);
        const rows = await this.sessions.find({
            where: { organization: { id: (0, typeorm_2.In)(ids) } },
            relations: { organization: true, createdBy: true, records: true },
            order: { sessionDate: "DESC" },
        });
        return rows
            .filter((row) => this.schoolWide(user) ||
            allowed.some((context) => context.id === row.contextId &&
                context.contextType ===
                    (row.contextType === "study_group"
                        ? "class_group"
                        : row.contextType)))
            .map((row) => {
            const counts = { present: 0, absent: 0, late: 0, excused: 0 };
            for (const record of row.records ?? [])
                counts[record.status] += 1;
            const total = row.records?.length ?? 0;
            return {
                id: row.id,
                organizationId: row.organization.id,
                organizationName: row.organization.name,
                contextType: row.contextType === "study_group" ? "class_group" : row.contextType,
                contextId: row.contextId,
                contextLabel: row.titleSnapshot || "",
                sessionDate: row.sessionDate.toISOString(),
                total,
                ...counts,
                remaining: row.rosterSnapshot == null
                    ? null
                    : Math.max(0, row.rosterSnapshot.length - total),
                note: row.note,
                createdById: row.createdBy?.id ?? null,
                createdAt: row.createdAt.toISOString(),
            };
        });
    }
    async createSession(user, dto) {
        const organization = await this.access.organizationForUser(this.effectiveUser(user), dto.organizationId);
        await this.assertContextAccess(user, dto.contextType, dto.contextId, organization.id, true);
        const descriptor = await this.contextDescriptor(dto.contextType, dto.contextId);
        const roster = await this.listParticipants(user, dto.contextType, dto.contextId);
        const date = new Date(dto.sessionDate);
        const row = await this.sessions.save(this.sessions.create({
            organization,
            contextType: dto.contextType,
            contextId: dto.contextId,
            sessionDate: date,
            titleSnapshot: descriptor.title,
            rosterSnapshot: roster.map(member => ({ id: member.id, name: member.name, nationalCode: member.nationalCode ?? null, userId: member.userId })),
            rosterCapturedAt: new Date(),
            note: dto.note?.trim() || "",
            createdBy: { id: user.id },
        }));
        return {
            id: row.id,
            organizationId: organization.id,
            contextType: row.contextType,
            contextId: row.contextId,
            sessionDate: row.sessionDate.toISOString(),
            note: row.note,
        };
    }
    async bulkMark(user, dto) {
        if (dto.entries.some((entry) => entry.status === attendance_record_entity_1.AttendanceStatus.EXCUSED)) {
            throw new api_exception_1.ApiException(422, "ATTENDANCE_EXCUSE_REQUIRES_REVIEW", "ابتدا غیبت را ثبت کنید؛ موجه‌بودن دلیل در مرحله بررسی مشخص می‌شود.");
        }
        if (!dto.entries.length) {
            throw new api_exception_1.ApiException(422, "ATTENDANCE_EMPTY", "حداقل یک وضعیت حضور ارسال کنید.");
        }
        if (dto.entries.length > maximumAttendanceBatchSize) {
            throw new api_exception_1.ApiException(422, "ATTENDANCE_BATCH_SIZE", "بین ۱ تا ۵۰۰ وضعیت حضور ارسال کنید.");
        }
        if (new Set(dto.entries.map((entry) => entry.studentId)).size !==
            dto.entries.length) {
            throw new api_exception_1.ApiException(422, "ATTENDANCE_DUPLICATE_STUDENT", "هر طلبه فقط یک بار در درخواست حضور درج شود.");
        }
        const fingerprint = (0, node_crypto_1.createHash)("sha256")
            .update(JSON.stringify({
            organizationId: dto.organizationId,
            sessionId: dto.sessionId,
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
        }))
            .digest("hex");
        const entries = dto.entries.map((entry) => ({
            ...entry,
            status: this.status(entry.status),
        }));
        const sessionDate = dto.sessionDate
            ? new Date(dto.sessionDate)
            : new Date();
        if (Number.isNaN(sessionDate.getTime())) {
            throw new api_exception_1.ApiException(422, "ATTENDANCE_DATE_INVALID", "تاریخ جلسه معتبر نیست.");
        }
        const { result, recipients, organizationId, contextType, contextId } = await this.attendanceTransaction(async (manager) => {
            const sessions = manager.getRepository(attendance_session_entity_1.AttendanceSession);
            const records = manager.getRepository(attendance_record_entity_1.AttendanceRecord);
            const students = manager.getRepository(student_entity_1.Student);
            const organization = await this.access.organizationForUser(this.effectiveUser(user), dto.organizationId);
            const receipts = manager.getRepository(attendance_write_receipt_entity_1.AttendanceWriteReceipt);
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
                    await this.assertContextAccess(user, receipt.session.contextType, receipt.session.contextId, organization.id, true);
                    if (receipt.fingerprint !== fingerprint)
                        throw new api_exception_1.ApiException(409, "ATTENDANCE_REQUEST_REUSED", "شناسه درخواست قبلاً برای اطلاعات دیگری استفاده شده است.");
                    return {
                        result: receipt.result,
                        recipients: [],
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
                    relations: { organization: true },
                })
                : null;
            if (dto.sessionId && !session) {
                throw new api_exception_1.ApiException(404, "ATTENDANCE_SESSION_NOT_FOUND", "جلسه حضور و غیاب پیدا نشد.");
            }
            if (session?.occurrenceKey)
                throw new api_exception_1.ApiException(409, "ATTENDANCE_SESSION_WORKFLOW_REQUIRED", "برای این جلسه از ثبت حضور جلسه با شماره نسخه استفاده کنید.");
            const contextType = session?.contextType ?? dto.contextType;
            const contextId = session?.contextId ?? dto.contextId;
            if (!contextType || !contextId) {
                throw new api_exception_1.ApiException(422, "ATTENDANCE_CONTEXT_REQUIRED", "کلاس، گروه یا اتاق لازم است.");
            }
            await this.assertContextAccess(user, contextType, contextId, organization.id, true);
            const participantIds = await this.participantIds(user, contextType, contextId, organization.id);
            if (entries.some((entry) => !participantIds.has(entry.studentId))) {
                throw new api_exception_1.ApiException(422, "ATTENDANCE_STUDENT_NOT_IN_CONTEXT", "یک یا چند طلبه عضو این کلاس، گروه یا اتاق نیستند.");
            }
            const roster = await students.findBy({
                id: (0, typeorm_2.In)(entries.map((entry) => entry.studentId)),
            });
            if (roster.length !== entries.length) {
                throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "طلبه پیدا نشد.");
            }
            const byId = new Map(roster.map((student) => [student.id, student]));
            if (!session) {
                const fullRoster = await students.find({
                    where: { id: (0, typeorm_2.In)([...participantIds]) },
                    relations: { user: true },
                });
                const descriptor = await this.contextDescriptor(contextType, contextId);
                session = await sessions.save(sessions.create({
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
                    createdBy: { id: user.id },
                }));
            }
            const saved = [];
            const changes = [];
            for (const entry of entries) {
                const student = byId.get(entry.studentId);
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
                if (!record)
                    record = records.create({ session, student });
                record.status = entry.status;
                record.physicalStatus =
                    entry.status === attendance_record_entity_1.AttendanceStatus.EXCUSED
                        ? "legacy_unknown"
                        : entry.status;
                record.revision = (record.revision ?? 0) + 1;
                record.note = entry.note?.trim() || "";
                record.recordedBy = { id: user.id };
                record.reviewStatus =
                    entry.status === attendance_record_entity_1.AttendanceStatus.ABSENT
                        ? attendance_record_entity_1.AttendanceReviewStatus.PENDING
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
            await manager.getRepository(audit_log_entity_1.AuditLog).save({
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
                .getRepository(organization_membership_entity_1.OrganizationMembership)
                .find({
                where: {
                    organization: { id: organization.id },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
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
                await receipts.save(receipts.create({
                    organization,
                    actor: { id: user.id },
                    session,
                    requestId: dto.requestId,
                    fingerprint,
                    result,
                }));
            return {
                result,
                recipients: members.map((member) => member.user.id),
                organizationId: organization.id,
                contextType,
                contextId,
            };
        });
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
    attendanceTransaction(work) {
        return (0, attendance_transaction_1.attendanceTransaction)(this.sessions.manager, work);
    }
    async listAbsenceReviews(user, organizationId) {
        this.assertReviewAccess(user);
        const ids = await this.access.scopedOrganizationIds(this.effectiveUser(user), organizationId);
        if (!ids.length)
            return [];
        const rows = await this.records.find({
            where: {
                session: { organization: { id: (0, typeorm_2.In)(ids) } },
                status: attendance_record_entity_1.AttendanceStatus.ABSENT,
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
    async listLiveRecords(user, organizationId) {
        const ids = await this.access.scopedOrganizationIds(this.effectiveUser(user), organizationId);
        if (!ids.length)
            return [];
        const rows = await this.records.find({
            where: { session: { organization: { id: (0, typeorm_2.In)(ids) } } },
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
    async reviewAbsence(user, recordId, dto) {
        this.assertReviewAccess(user);
        const { saved, recipients } = await this.attendanceTransaction(async (manager) => {
            const records = manager.getRepository(attendance_record_entity_1.AttendanceRecord);
            const relations = {
                session: { organization: true },
                student: { user: true },
                recordedBy: true,
                reviewedBy: true,
            };
            const record = await records.findOne({
                where: { id: recordId },
                relations,
            });
            if (!record)
                throw new api_exception_1.ApiException(404, "ATTENDANCE_RECORD_NOT_FOUND", "رکورد حضور پیدا نشد.");
            await this.access.organizationForUser(this.effectiveUser(user), record.session.organization.id);
            await this.assertContextAccess(user, record.session.contextType, record.session.contextId, record.session.organization.id, true);
            const decision = dto.decision === "approved"
                ? attendance_record_entity_1.AttendanceReviewStatus.APPROVED
                : attendance_record_entity_1.AttendanceReviewStatus.REJECTED;
            const note = dto.note?.trim() || "";
            const reviewedAt = new Date();
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
                status: dto.decision === "approved"
                    ? attendance_record_entity_1.AttendanceStatus.EXCUSED
                    : attendance_record_entity_1.AttendanceStatus.ABSENT,
            })
                .where("id = :id", { id: record.id })
                .andWhere("status = :status AND reviewStatus = :pending", {
                status: attendance_record_entity_1.AttendanceStatus.ABSENT,
                pending: attendance_record_entity_1.AttendanceReviewStatus.PENDING,
            })
                .execute();
            if (transition.affected !== 1)
                throw new api_exception_1.ApiException(409, "ATTENDANCE_REVIEW_CLOSED", "این غیبت دیگر در انتظار بررسی نیست.");
            const saved = await records.findOneOrFail({
                where: { id: record.id },
                relations,
            });
            await manager.getRepository(audit_log_entity_1.AuditLog).save({
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
                .getRepository(organization_membership_entity_1.OrganizationMembership)
                .find({
                where: {
                    organization: { id: record.session.organization.id },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                },
                relations: {
                    user: true,
                    roleAssignments: { role: { permissions: { permission: true } } },
                },
            });
            const recipients = new Set([user.id]);
            for (const member of members) {
                const reviewer = member.roleAssignments.some((assignment) => assignment.role.permissions.some((permission) => permission.permission.code === "attendance.review"));
                if (reviewer ||
                    member.user.id === record.recordedBy?.id ||
                    member.user.id === record.student.user?.id)
                    recipients.add(member.user.id);
            }
            return { saved, recipients: [...recipients] };
        });
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
    async listMyAbsenceReviews(user) {
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
    async listParticipants(user, contextType, contextId) {
        const context = this.context(contextType);
        const organizationId = await this.contextOrganizationId(context, contextId);
        await this.access.organizationForUser(this.effectiveUser(user), organizationId);
        this.assertWorkOrganization(user, organizationId);
        await this.assertContextAccess(user, context, contextId, organizationId, false);
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
    async summary(user, studentId) {
        let target = studentId;
        if (!target) {
            const student = await this.students.findOne({
                where: { user: { id: user.id } },
                relations: { organization: true },
            });
            if (!student)
                throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده طلبه پیدا نشد.");
            if (student.organization)
                await this.authorizeOrganization(user, student.organization.id);
            target = student.id;
        }
        else if (!(await this.authorization.canAccessStudent(this.userContext(user), target, "students.read"))) {
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده طلبه پیدا نشد.");
        }
        if (studentId) {
            this.assertReviewAccess(user);
            if (!user.capabilities?.includes("attendance.review"))
                throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
            const student = await this.students.findOne({
                where: { id: target },
                relations: { organization: true, user: true },
            });
            if (!student?.organization || student.user?.id === user.id)
                throw new api_exception_1.ApiException(403, "FORBIDDEN", "پرونده فقط برای ناظر و مدیر است.");
            await this.authorizeOrganization(user, student.organization.id);
        }
        const rows = await this.records.find({
            where: { student: { id: target } },
            relations: { session: { organization: true } },
            order: { createdAt: "DESC" },
        });
        const counts = { present: 0, absent: 0, late: 0, excused: 0 };
        for (const row of rows)
            counts[row.status] += 1;
        return {
            studentId: target,
            totalSessions: rows.length,
            ...counts,
            recent: (studentId ? rows.slice(0, 10) : []).map((row) => ({
                id: row.id,
                sessionId: row.session.id,
                status: row.status,
                sessionDate: row.session.sessionDate.toISOString(),
                contextType: row.session.contextType === "study_group"
                    ? "class_group"
                    : row.session.contextType,
                contextId: row.session.contextId,
                organizationId: row.session.organization.id,
                recordedAt: row.createdAt.toISOString(),
            })),
        };
    }
    async listSelfRecords(_user) {
        return [];
    }
    async participantIds(user, type, id, organizationId) {
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
    async assertContextAccess(user, type, id, organizationId, manage) {
        if (manage)
            this.assertWorkOrganization(user, organizationId);
        const contextOrganizationId = await this.contextOrganizationId(type, id);
        if (contextOrganizationId !== organizationId) {
            throw new api_exception_1.ApiException(403, "ATTENDANCE_CONTEXT_ORGANIZATION_MISMATCH", "کلاس، گروه یا اتاق متعلق به سازمان انتخاب‌شده نیست.");
        }
        if (this.schoolWide(user))
            return;
        if (type === "dorm")
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی خوابگاه برای این نقش مجاز نیست.");
        const classroom = type === "class"
            ? await this.classes.findOne({
                where: { id, organization: { id: organizationId } },
                relations: { advisor: true, books: { teacher: true } },
            })
            : (await this.groups.findOne({
                where: { id, organization: { id: organizationId } },
                relations: {
                    classroom: { advisor: true, books: { teacher: true } },
                },
            }))?.classroom;
        if (!classroom ||
            (classroom.advisor?.id !== user.id &&
                !classroom.books?.some((book) => book.teacher?.id === user.id)))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "این کلاس یا گروه به شما واگذار نشده است.");
    }
    effectiveUser(user) {
        return { ...user, role: user.roles ? (user.roles[0] ?? "") : user.role };
    }
    assertWorkOrganization(user, organizationId) {
        if (user.activeOrganizationId &&
            user.activeOrganizationId !== organizationId) {
            throw new api_exception_1.ApiException(403, "ATTENDANCE_WORK_CONTEXT_MISMATCH", "ابتدا سازمان فعال را تغییر دهید.");
        }
    }
    schoolWide(user) {
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
    assertReviewAccess(user) {
        if ([
            "PRINCIPAL",
            "SCHOOL_SUPERVISOR",
            "ORGANIZATION_ADMIN",
            "PLATFORM_ADMIN",
        ].some((role) => (user.roles ?? [user.role]).includes(role)))
            return;
        throw new api_exception_1.ApiException(403, "FORBIDDEN", "بررسی دلیل غیبت فقط برای مدیر و ناظر مدرسه مجاز است.");
    }
    reviewView(row) {
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
            contextType: row.session.contextType === "study_group"
                ? "class_group"
                : row.session.contextType,
            contextId: row.session.contextId,
            organizationId: row.session.organization.id,
            organizationName: row.session.organization.name,
            teacherName: [row.recordedBy?.firstName, row.recordedBy?.lastName]
                .filter(Boolean)
                .join(" ") ||
                row.recordedBy?.username ||
                "استاد کلاس",
        };
    }
    async contextOrganizationId(type, id) {
        if (type === "class") {
            const row = await this.classes.findOne({
                where: { id },
                relations: { organization: true },
            });
            if (!row)
                throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
            return row.organization.id;
        }
        if (type === "class_group" || type === "study_group") {
            const row = await this.groups.findOne({
                where: { id },
                relations: { organization: true },
            });
            if (!row)
                throw new api_exception_1.ApiException(404, "CLASS_GROUP_NOT_FOUND", "گروه کلاس پیدا نشد.");
            return row.organization.id;
        }
        const row = await this.rooms.findOne({
            where: { id },
            relations: { organization: true },
        });
        if (!row)
            throw new api_exception_1.ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق خوابگاه پیدا نشد.");
        return row.organization.id;
    }
    context(value) {
        if (value === "class" ||
            value === "dorm" ||
            value === "class_group" ||
            value === "study_group")
            return value;
        throw new api_exception_1.ApiException(422, "ATTENDANCE_CONTEXT_INVALID", "نوع حضور و غیاب معتبر نیست.");
    }
    status(value) {
        if (value === "present")
            return attendance_record_entity_1.AttendanceStatus.PRESENT;
        if (value === "absent")
            return attendance_record_entity_1.AttendanceStatus.ABSENT;
        if (value === "late")
            return attendance_record_entity_1.AttendanceStatus.LATE;
        if (value === "excused")
            return attendance_record_entity_1.AttendanceStatus.EXCUSED;
        throw new api_exception_1.ApiException(422, "ATTENDANCE_STATUS_INVALID", "وضعیت حضور معتبر نیست.");
    }
    studentView(student) {
        return {
            id: student.id,
            name: student.name,
            userId: student.user?.id ?? null,
            nationalCode: student.nationalCode,
            accountStatus: student.accountStatus,
        };
    }
    userContext(user) {
        return {
            ...user,
            roles: user.roles ?? [user.role],
            capabilities: user.capabilities ?? [],
            membershipIds: user.membershipIds ?? [],
            organizationIds: user.organizationIds ?? [],
        };
    }
};
exports.AttendanceService = AttendanceService;
exports.AttendanceService = AttendanceService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_session_entity_1.AttendanceSession)),
    __param(1, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(education_class_entity_1.EducationClass)),
    __param(4, (0, typeorm_1.InjectRepository)(education_class_enrollment_entity_1.EducationClassEnrollment)),
    __param(5, (0, typeorm_1.InjectRepository)(study_group_entity_1.StudyGroup)),
    __param(6, (0, typeorm_1.InjectRepository)(study_group_membership_entity_1.StudyGroupMembership)),
    __param(7, (0, typeorm_1.InjectRepository)(dorm_room_entity_1.DormRoom)),
    __param(8, (0, typeorm_1.InjectRepository)(dorm_room_assignment_entity_1.DormRoomAssignment)),
    __param(9, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        school_access_1.SchoolAccessService,
        authorization_1.AuthorizationService,
        realtime_1.RealtimeService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map