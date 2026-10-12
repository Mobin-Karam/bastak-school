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
exports.WorkflowsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const attendance_session_entity_1 = require("../../database/entities/attendance-session.entity");
const exit_permission_entity_1 = require("../../database/entities/exit-permission.entity");
const leave_request_entity_1 = require("../../database/entities/leave-request.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const request_letter_entity_1 = require("../../database/entities/request-letter.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const dorm_room_entity_1 = require("../../database/entities/dorm-room.entity");
const dorm_room_assignment_entity_1 = require("../../database/entities/dorm-room-assignment.entity");
const study_group_entity_1 = require("../../database/entities/study-group.entity");
const study_group_membership_entity_1 = require("../../database/entities/study-group-membership.entity");
const realtime_1 = require("../realtime");
const notifications_1 = require("../notifications");
const phone_number_1 = require("../../common/utils/phone-number");
let WorkflowsService = class WorkflowsService {
    sessions;
    attendanceRecords;
    leaveRequests;
    exitPermissions;
    letters;
    students;
    classes;
    classEnrollments;
    studyGroups;
    studyGroupMemberships;
    dormRooms;
    dormAssignments;
    memberships;
    users;
    realtime;
    notifications;
    constructor(sessions, attendanceRecords, leaveRequests, exitPermissions, letters, students, classes, classEnrollments, studyGroups, studyGroupMemberships, dormRooms, dormAssignments, memberships, users, realtime, notifications) {
        this.sessions = sessions;
        this.attendanceRecords = attendanceRecords;
        this.leaveRequests = leaveRequests;
        this.exitPermissions = exitPermissions;
        this.letters = letters;
        this.students = students;
        this.classes = classes;
        this.classEnrollments = classEnrollments;
        this.studyGroups = studyGroups;
        this.studyGroupMemberships = studyGroupMemberships;
        this.dormRooms = dormRooms;
        this.dormAssignments = dormAssignments;
        this.memberships = memberships;
        this.users = users;
        this.realtime = realtime;
        this.notifications = notifications;
    }
    async listAttendanceContexts(user, organizationId) {
        const memberships = await this.activeMemberships(user.id);
        const organizationIds = memberships.map((membership) => membership.organization.id);
        if (!organizationIds.length) {
            return [];
        }
        const effectiveOrgId = organizationId && organizationIds.includes(organizationId)
            ? organizationId
            : undefined;
        const orgFilter = effectiveOrgId
            ? { id: effectiveOrgId }
            : { id: (0, typeorm_2.In)(organizationIds) };
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
                contextType: "class",
                code: item.code,
                name: item.name,
                label: `${item.name} (${item.code})`,
                total: item.enrollments?.length ?? 0,
                activeOrganizationId: item.organization.id,
            })),
            ...rooms.map((item) => ({
                id: item.id,
                contextType: "dorm",
                code: item.code,
                name: item.name,
                label: `${item.name} (${item.code})`,
                total: item.assignments?.length ?? 0,
                activeOrganizationId: item.organization.id,
            })),
            ...groups.map((item) => ({
                id: item.id,
                contextType: "study_group",
                code: item.code,
                name: item.name,
                label: `${item.name} (${item.code})`,
                total: item.memberships?.length ?? 0,
                activeOrganizationId: item.organization.id,
            })),
        ];
    }
    async listDormRooms(user, organizationId) {
        const memberships = await this.activeMemberships(user.id);
        const organizationIds = memberships.map((membership) => membership.organization.id);
        if (!organizationIds.length) {
            return [];
        }
        const effectiveOrgId = organizationId && organizationIds.includes(organizationId)
            ? organizationId
            : undefined;
        const rooms = await this.dormRooms.find({
            where: effectiveOrgId
                ? { organization: { id: effectiveOrgId } }
                : { organization: { id: (0, typeorm_2.In)(organizationIds) } },
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
    async createDormRoom(user, input) {
        const organization = await this.organizationForUser(user.id, input.organizationId);
        const code = (input.code || "").trim();
        const name = (input.name || "").trim();
        if (!code || !name) {
            throw new api_exception_1.ApiException(400, "DORM_ROOM_INVALID", "کد و نام اتاق خوابگاه الزامی است.");
        }
        const existing = await this.dormRooms.findOne({
            where: { organization: { id: organization.id }, code },
        });
        if (existing) {
            throw new api_exception_1.ApiException(409, "DORM_ROOM_EXISTS", "این کد اتاق در سازمان تکراری است.");
        }
        const room = await this.dormRooms.save(this.dormRooms.create({
            organization,
            code,
            name,
            capacity: Math.max(1, Number(input.capacity ?? 1) || 1),
            status: "ACTIVE",
        }));
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
    async listDormAssignments(user, roomId) {
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
    async setDormAssignments(user, roomId, studentIds) {
        const room = await this.requireDormRoom(user, roomId);
        const uniqueStudentIds = [...new Set((studentIds || []).filter(Boolean))];
        if (!uniqueStudentIds.length) {
            await this.dormAssignments.delete({ room: { id: room.id } });
            return { roomId: room.id, count: 0 };
        }
        const students = await this.students.find({
            where: { id: (0, typeorm_2.In)(uniqueStudentIds) },
            relations: { user: true },
        });
        if (students.length !== uniqueStudentIds.length) {
            throw new api_exception_1.ApiException(400, "DORM_STUDENT_NOT_FOUND", "یکی از دانش‌آموزان پیدا نشد.");
        }
        const validStudentIds = new Set();
        for (const student of students) {
            if (!student.user?.id)
                continue;
            const membership = await this.memberships.findOne({
                where: {
                    user: { id: student.user.id },
                    organization: { id: room.organization.id },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                },
                relations: { user: true, organization: true },
            });
            if (membership)
                validStudentIds.add(student.id);
        }
        if (validStudentIds.size !== uniqueStudentIds.length) {
            throw new api_exception_1.ApiException(403, "DORM_STUDENT_FORBIDDEN", "بعضی از دانش‌آموزان به این سازمان تعلق ندارند.");
        }
        if (uniqueStudentIds.length > room.capacity) {
            throw new api_exception_1.ApiException(400, "DORM_ROOM_CAPACITY", "تعداد دانش‌آموزان بیشتر از ظرفیت اتاق است.");
        }
        await this.dormAssignments.delete({ room: { id: room.id } });
        const saved = await Promise.all(uniqueStudentIds.map(async (studentId) => this.dormAssignments.save(this.dormAssignments.create({
            room,
            student: { id: studentId },
        }))));
        return { roomId: room.id, count: saved.length };
    }
    async listAttendanceSessions(user, organizationId) {
        const memberships = await this.activeMemberships(user.id);
        const organizationIds = memberships.map((membership) => membership.organization.id);
        if (!organizationIds.length) {
            return [];
        }
        const effectiveOrgId = organizationId && organizationIds.includes(organizationId)
            ? organizationId
            : undefined;
        const rows = await this.sessions.find({
            where: effectiveOrgId
                ? { organization: { id: effectiveOrgId } }
                : { organization: { id: (0, typeorm_2.In)(organizationIds) } },
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
    async createAttendanceSession(user, input) {
        const organization = await this.organizationForUser(user.id, input.organizationId);
        const contextType = this.parseContextType(input.contextType);
        const date = new Date(input.sessionDate);
        if (Number.isNaN(date.getTime())) {
            throw new api_exception_1.ApiException(400, "ATTENDANCE_DATE_INVALID", "تاریخ جلسه معتبر نیست.");
        }
        const row = await this.sessions.save(this.sessions.create({
            organization,
            contextType,
            contextId: input.contextId.trim(),
            sessionDate: date,
            note: input.note?.trim() || "",
            createdBy: { id: user.id },
        }));
        return {
            id: row.id,
            organizationId: row.organization.id,
            contextType: row.contextType,
            contextId: row.contextId,
            sessionDate: row.sessionDate.toISOString(),
            note: row.note,
        };
    }
    async bulkMarkAttendance(user, input) {
        const organization = await this.organizationForUser(user.id, input.organizationId);
        if (!input.entries?.length) {
            throw new api_exception_1.ApiException(400, "ATTENDANCE_EMPTY", "هیچ ورودی حضوری ارسال نشده است.");
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
                throw new api_exception_1.ApiException(400, "ATTENDANCE_DATE_INVALID", "تاریخ جلسه معتبر نیست.");
            }
            session = await this.sessions.save(this.sessions.create({
                organization,
                contextType,
                contextId: input.contextId?.trim() || "default",
                sessionDate: date,
                note: "",
                createdBy: { id: user.id },
            }));
        }
        const created = await Promise.all(input.entries.map(async (entry) => {
            const student = await this.students.findOne({
                where: { id: entry.studentId },
                relations: { user: true },
            });
            if (!student) {
                throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "دانش‌آموز مورد نظر پیدا نشد.");
            }
            const status = this.parseAttendanceStatus(entry.status || "present");
            const existing = await this.attendanceRecords.findOne({
                where: { session: { id: session.id }, student: { id: student.id } },
            });
            if (existing) {
                existing.status = status;
                existing.note = entry.note?.trim() || existing.note || "";
                existing.recordedBy = { id: user.id };
                return this.attendanceRecords.save(existing);
            }
            return this.attendanceRecords.save(this.attendanceRecords.create({
                session,
                student,
                status,
                note: entry.note?.trim() || "",
                recordedBy: { id: user.id },
            }));
        }));
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
    async listContextParticipants(user, contextType, contextId) {
        const context = this.parseContextType(contextType);
        const organizationId = await this.resolveOrganizationIdForContext(user, context, contextId);
        const organization = await this.organizationForUser(user.id, organizationId);
        if (context === "class") {
            const classroom = await this.classes.findOne({
                where: { id: contextId, organization: { id: organization.id } },
                relations: { organization: true },
            });
            if (!classroom) {
                throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
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
                throw new api_exception_1.ApiException(404, "STUDY_GROUP_NOT_FOUND", "گروه درسی پیدا نشد.");
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
                throw new api_exception_1.ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق خوابگاه پیدا نشد.");
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
    async getStudentAttendanceSummary(user, studentId) {
        const targetStudentId = studentId || (await this.studentForUser(user.id)).id;
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
            if (record.status === attendance_record_entity_1.AttendanceStatus.PRESENT)
                summary.present += 1;
            if (record.status === attendance_record_entity_1.AttendanceStatus.ABSENT)
                summary.absent += 1;
            if (record.status === attendance_record_entity_1.AttendanceStatus.LATE)
                summary.late += 1;
            if (record.status === attendance_record_entity_1.AttendanceStatus.EXCUSED)
                summary.excused += 1;
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
    async listLeaveRequests(user, organizationId) {
        const memberships = await this.activeMemberships(user.id);
        const organizationIds = memberships.map((membership) => membership.organization.id);
        const requestedOrgId = organizationId && organizationIds.includes(organizationId)
            ? organizationId
            : undefined;
        const reviewScope = this.leaveReviewScope(user);
        const rows = await this.leaveRequests.find({
            where: reviewScope === "all"
                ? requestedOrgId
                    ? { organization: { id: requestedOrgId } }
                    : { organization: { id: (0, typeorm_2.In)(organizationIds) } }
                : reviewScope === "supervisor"
                    ? requestedOrgId
                        ? {
                            organization: { id: requestedOrgId },
                            reviewerRole: leave_request_entity_1.LeaveRequestReviewerRole.SCHOOL_SUPERVISOR,
                        }
                        : {
                            organization: { id: (0, typeorm_2.In)(organizationIds) },
                            reviewerRole: leave_request_entity_1.LeaveRequestReviewerRole.SCHOOL_SUPERVISOR,
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
    async createLeaveRequest(user, input) {
        const student = await this.studentForUser(user.id);
        const organization = await this.organizationForUser(user.id, input.organizationId);
        const startDate = new Date(input.startDate);
        const endDate = new Date(input.endDate);
        if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
            throw new api_exception_1.ApiException(400, "LEAVE_DATE_INVALID", "تاریخ شروع یا پایان مرخصی معتبر نیست.");
        }
        if (endDate < startDate) {
            throw new api_exception_1.ApiException(400, "LEAVE_DATE_RANGE_INVALID", "تاریخ پایان نمی‌تواند قبل از تاریخ شروع باشد.");
        }
        if (!input.reason?.trim()) {
            throw new api_exception_1.ApiException(400, "LEAVE_REASON_REQUIRED", "دلیل مرخصی الزامی است.");
        }
        const leaveType = this.parseLeaveRequestType(input.leaveType);
        const reviewerRole = leaveType === leave_request_entity_1.LeaveRequestType.SCHOOL_EXIT
            ? leave_request_entity_1.LeaveRequestReviewerRole.SCHOOL_SUPERVISOR
            : leave_request_entity_1.LeaveRequestReviewerRole.PRINCIPAL;
        const row = await this.leaveRequests.save(this.leaveRequests.create({
            organization,
            student,
            leaveType,
            reviewerRole,
            startDate,
            endDate,
            reason: input.reason.trim(),
            note: input.note?.trim() || "",
            attachments: Array.isArray(input.attachments)
                ? input.attachments.filter(Boolean)
                : [],
            status: leave_request_entity_1.LeaveRequestStatus.PENDING,
        }));
        await this.notifyRequestReviewers(organization.id, reviewerRole, "درخواست جدید دانش‌آموز", `درخواست ${leaveType === leave_request_entity_1.LeaveRequestType.SCHOOL_EXIT ? "خروج" : "مرخصی"} برای بررسی ثبت شد.`, `/admin/leave-requests?requestId=${row.id}`);
        return this.serializeLeaveRequest(row);
    }
    async reviewLeaveRequest(user, leaveRequestId, input) {
        const row = await this.leaveRequests.findOne({
            where: { id: leaveRequestId },
            relations: {
                organization: true,
                student: { user: true },
                approver: true,
            },
        });
        if (!row) {
            throw new api_exception_1.ApiException(404, "LEAVE_REQUEST_NOT_FOUND", "درخواست مرخصی پیدا نشد.");
        }
        await this.organizationForUser(user.id, row.organization.id);
        this.assertLeaveRequestReviewer(user, row);
        const status = this.parseLeaveStatus(input.status);
        row.status = status;
        row.note = input.note?.trim() || row.note || "";
        row.approver = { id: user.id };
        row.reviewedAt = new Date();
        const saved = await this.leaveRequests.save(row);
        return this.serializeLeaveRequest(saved);
    }
    async listExitPermissions(user, organizationId) {
        const memberships = await this.activeMemberships(user.id);
        const organizationIds = memberships.map((membership) => membership.organization.id);
        const requestedOrgId = organizationId && organizationIds.includes(organizationId)
            ? organizationId
            : undefined;
        const rows = await this.exitPermissions.find({
            where: this.canReviewSchoolWorkflows(user)
                ? requestedOrgId
                    ? { organization: { id: requestedOrgId } }
                    : { organization: { id: (0, typeorm_2.In)(organizationIds) } }
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
    async createExitPermission(user, input) {
        const student = await this.studentForUser(user.id);
        const organization = await this.organizationForUser(user.id, input.organizationId);
        const departure = new Date(input.requestedDepartureAt);
        if (Number.isNaN(departure.getTime())) {
            throw new api_exception_1.ApiException(400, "EXIT_DEPARTURE_INVALID", "زمان خروج معتبر نیست.");
        }
        const expectedReturn = input.expectedReturnAt
            ? new Date(input.expectedReturnAt)
            : null;
        if (expectedReturn && Number.isNaN(expectedReturn.getTime())) {
            throw new api_exception_1.ApiException(400, "EXIT_RETURN_INVALID", "زمان بازگشت معتبر نیست.");
        }
        const row = await this.exitPermissions.save(this.exitPermissions.create({
            organization,
            student,
            destination: input.destination.trim(),
            reason: input.reason.trim(),
            requestedDepartureAt: departure,
            expectedReturnAt: expectedReturn,
            note: input.note?.trim() || "",
            status: exit_permission_entity_1.ExitPermissionStatus.PENDING,
        }));
        await this.notifyRequestReviewers(organization.id, leave_request_entity_1.LeaveRequestReviewerRole.SCHOOL_SUPERVISOR, "درخواست خروج جدید", "یک درخواست خروج دانش‌آموز برای بررسی ثبت شد.", `/admin/exit-permissions?requestId=${row.id}`);
        return this.serializeExitPermission(row);
    }
    async reviewExitPermission(user, exitPermissionId, input) {
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
            throw new api_exception_1.ApiException(404, "EXIT_PERMISSION_NOT_FOUND", "درخواست مجوز خروج پیدا نشد.");
        }
        await this.organizationForUser(user.id, row.organization.id);
        this.assertWorkflowReviewer(user);
        const status = this.parseExitStatus(input.status);
        row.status = status;
        row.note = input.note?.trim() || row.note || "";
        row.approver = { id: user.id };
        row.reviewedAt = new Date();
        const saved = await this.exitPermissions.save(row);
        return this.serializeExitPermission(saved);
    }
    async requestExitReturn(user, exitPermissionId, note) {
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
            throw new api_exception_1.ApiException(404, "EXIT_PERMISSION_NOT_FOUND", "مجوز خروج پیدا نشد.");
        }
        if (row.student.user?.id !== user.id) {
            throw new api_exception_1.ApiException(403, "EXIT_RETURN_REQUEST_FORBIDDEN", "فقط خود دانش‌آموز می‌تواند بازگشت را درخواست کند.");
        }
        await this.organizationForUser(user.id, row.organization.id);
        if (row.status !== exit_permission_entity_1.ExitPermissionStatus.APPROVED ||
            !row.actualDepartureAt) {
            throw new api_exception_1.ApiException(409, "EXIT_NOT_DEPARTED", "بازگشت فقط پس از ثبت خروج امکان‌پذیر است.");
        }
        if (row.actualReturnAt) {
            throw new api_exception_1.ApiException(409, "EXIT_ALREADY_RETURNED", "برای این مجوز بازگشت ثبت شده است.");
        }
        if (row.returnRequestedAt) {
            throw new api_exception_1.ApiException(409, "EXIT_RETURN_ALREADY_REQUESTED", "درخواست بازگشت قبلاً ارسال شده است.");
        }
        row.returnRequestedAt = new Date();
        row.returnRequestNote = note?.trim() || "";
        const saved = await this.exitPermissions.save(row);
        await this.emitOccupancyUpdate(row.organization.id, row.id, "return-requested");
        return this.serializeExitPermission(saved);
    }
    async recordGateDeparture(user, input) {
        this.assertWorkflowReviewer(user);
        const organization = await this.organizationForUser(user.id, input.organizationId);
        const student = await this.studentForPhoneInOrganization(input.phoneNumber, organization.id);
        const existing = await this.exitPermissions
            .createQueryBuilder("exit")
            .where("exit.organizationId = :organizationId", {
            organizationId: organization.id,
        })
            .andWhere("exit.studentId = :studentId", { studentId: student.id })
            .andWhere("exit.status = :status", {
            status: exit_permission_entity_1.ExitPermissionStatus.APPROVED,
        })
            .andWhere("exit.actualDepartureAt IS NOT NULL")
            .andWhere("exit.actualReturnAt IS NULL")
            .getOne();
        if (existing) {
            throw new api_exception_1.ApiException(409, "STUDENT_ALREADY_OUT", "برای این دانش‌آموز خروج فعال ثبت شده است.");
        }
        const expectedReturnAt = input.expectedReturnAt
            ? new Date(input.expectedReturnAt)
            : null;
        if (expectedReturnAt && Number.isNaN(expectedReturnAt.getTime())) {
            throw new api_exception_1.ApiException(400, "EXIT_RETURN_INVALID", "زمان بازگشت معتبر نیست.");
        }
        const now = new Date();
        const saved = await this.exitPermissions.save(this.exitPermissions.create({
            organization,
            student,
            destination: input.destination?.trim() || "خروج با تأیید مدرسه",
            reason: input.reason?.trim() || "ثبت مستقیم توسط مسئول مدرسه",
            requestedDepartureAt: now,
            expectedReturnAt,
            actualDepartureAt: now,
            note: "مجوز و خروج فیزیکی توسط مسئول مدرسه ثبت شد.",
            status: exit_permission_entity_1.ExitPermissionStatus.APPROVED,
            approver: { id: user.id },
            reviewedAt: now,
        }));
        await this.emitOccupancyUpdate(organization.id, saved.id, "departure-recorded");
        return this.serializeExitPermission(saved);
    }
    async recordGateReturn(user, input) {
        this.assertWorkflowReviewer(user);
        const organization = await this.organizationForUser(user.id, input.organizationId);
        const student = await this.studentForPhoneInOrganization(input.phoneNumber, organization.id);
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
            status: exit_permission_entity_1.ExitPermissionStatus.APPROVED,
        })
            .andWhere("exit.actualDepartureAt IS NOT NULL")
            .andWhere("exit.actualReturnAt IS NULL")
            .orderBy("exit.actualDepartureAt", "DESC")
            .getOne();
        if (!row) {
            throw new api_exception_1.ApiException(409, "STUDENT_NOT_OUT", "برای این دانش‌آموز خروج فعال ثبت نشده است.");
        }
        const now = new Date();
        row.returnRequestedAt = row.returnRequestedAt ?? now;
        row.returnRequestNote =
            input.note?.trim() || "بازگشت حضوری توسط مسئول مدرسه ثبت شد.";
        row.actualReturnAt = now;
        row.returnVerifiedBy = { id: user.id };
        row.returnVerifiedAt = now;
        row.status = exit_permission_entity_1.ExitPermissionStatus.COMPLETED;
        const saved = await this.exitPermissions.save(row);
        await this.emitOccupancyUpdate(organization.id, saved.id, "return-confirmed");
        return this.serializeExitPermission(saved);
    }
    async recordExitMovement(user, exitPermissionId, movement) {
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
            throw new api_exception_1.ApiException(404, "EXIT_PERMISSION_NOT_FOUND", "مجوز خروج پیدا نشد.");
        await this.organizationForUser(user.id, row.organization.id);
        this.assertWorkflowReviewer(user);
        if (movement === "departure") {
            if (row.status !== exit_permission_entity_1.ExitPermissionStatus.APPROVED)
                throw new api_exception_1.ApiException(409, "EXIT_NOT_APPROVED", "فقط مجوز تأییدشده قابل ثبت خروج است.");
            if (row.actualReturnAt)
                throw new api_exception_1.ApiException(409, "EXIT_ALREADY_RETURNED", "برای این مجوز بازگشت ثبت شده است.");
            row.actualDepartureAt = row.actualDepartureAt ?? new Date();
        }
        else {
            if (!row.actualDepartureAt)
                throw new api_exception_1.ApiException(409, "EXIT_NOT_DEPARTED", "ابتدا خروج دانش‌آموز را ثبت کنید.");
            if (!row.returnRequestedAt)
                throw new api_exception_1.ApiException(409, "EXIT_RETURN_NOT_REQUESTED", "دانش‌آموز باید ابتدا درخواست بازگشت را ثبت کند.");
            row.actualReturnAt = new Date();
            row.status = exit_permission_entity_1.ExitPermissionStatus.COMPLETED;
            row.returnVerifiedBy = { id: user.id };
            row.returnVerifiedAt = new Date();
        }
        const saved = await this.exitPermissions.save(row);
        await this.emitOccupancyUpdate(row.organization.id, row.id, movement === "departure" ? "departure-recorded" : "return-confirmed");
        return this.serializeExitPermission(saved);
    }
    async occupancy(user, organizationId) {
        const memberships = await this.activeMemberships(user.id);
        const ids = memberships.map((membership) => membership.organization.id);
        if (!ids.length)
            return [];
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
            const rows = await this.exitPermissions
                .createQueryBuilder("exit")
                .where("exit.organizationId = :id", { id })
                .andWhere("exit.status = :status", {
                status: exit_permission_entity_1.ExitPermissionStatus.APPROVED,
            })
                .andWhere("exit.actualDepartureAt IS NOT NULL")
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
    canReviewSchoolWorkflows(user) {
        return [
            "PLATFORM_ADMIN",
            "ORGANIZATION_ADMIN",
            "PRINCIPAL",
            "DISCIPLINARIAN",
            "SCHOOL_ADMIN",
            "SCHOOL_SUPERVISOR",
        ].some((role) => user.roles?.includes(role) || user.role === role);
    }
    leaveReviewScope(user) {
        if (this.hasAnyRole(user, [
            "PLATFORM_ADMIN",
            "ORGANIZATION_ADMIN",
            "PRINCIPAL",
            "SCHOOL_ADMIN",
        ])) {
            return "all";
        }
        if (this.hasAnyRole(user, ["SCHOOL_SUPERVISOR", "DISCIPLINARIAN"])) {
            return "supervisor";
        }
        return "own";
    }
    assertLeaveRequestReviewer(user, request) {
        const scope = this.leaveReviewScope(user);
        if (scope === "all" ||
            (scope === "supervisor" &&
                request.reviewerRole === leave_request_entity_1.LeaveRequestReviewerRole.SCHOOL_SUPERVISOR)) {
            return;
        }
        throw new api_exception_1.ApiException(403, "LEAVE_REQUEST_REVIEW_FORBIDDEN", "این درخواست باید توسط مسئول تعیین‌شده بررسی شود.");
    }
    hasAnyRole(user, roles) {
        return roles.some((role) => user.roles?.includes(role) || user.role === role);
    }
    assertWorkflowReviewer(user) {
        if (!this.canReviewSchoolWorkflows(user))
            throw new api_exception_1.ApiException(403, "WORKFLOW_REVIEW_FORBIDDEN", "فقط مدیریت یا ناظم مدرسه می‌تواند این عملیات را انجام دهد.");
    }
    async listLetters(user, organizationId) {
        const memberships = await this.activeMemberships(user.id);
        const organizationIds = memberships.map((membership) => membership.organization.id);
        const requestedOrgId = organizationId && organizationIds.includes(organizationId)
            ? organizationId
            : undefined;
        const rows = await this.letters.find({
            where: requestedOrgId
                ? { organization: { id: requestedOrgId } }
                : { organization: { id: (0, typeorm_2.In)(organizationIds) } },
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
    async createLetter(user, input) {
        const organization = await this.organizationForUser(user.id, input.organizationId);
        if (!input.subject?.trim() || !input.body?.trim()) {
            throw new api_exception_1.ApiException(400, "LETTER_REQUIRED_FIELDS", "موضوع و متن نامه الزامی است.");
        }
        let recipient = null;
        if (input.recipientUserId) {
            recipient = await this.users.findOne({
                where: { id: input.recipientUserId },
            });
            if (!recipient) {
                throw new api_exception_1.ApiException(404, "LETTER_RECIPIENT_NOT_FOUND", "گیرنده نامه پیدا نشد.");
            }
        }
        const row = await this.letters.save(this.letters.create({
            organization,
            sender: { id: user.id },
            recipient: recipient || null,
            recipientRole: input.recipientRole?.trim() || "general",
            subject: input.subject.trim(),
            body: input.body.trim(),
            attachments: Array.isArray(input.attachments)
                ? input.attachments.filter(Boolean)
                : [],
            priority: input.priority?.trim() || "normal",
            status: request_letter_entity_1.RequestLetterStatus.SENT,
        }));
        return this.serializeLetter(row);
    }
    async reviewLetter(user, letterId, input) {
        const row = await this.letters.findOne({
            where: { id: letterId },
            relations: { organization: true, sender: true, recipient: true },
        });
        if (!row) {
            throw new api_exception_1.ApiException(404, "LETTER_NOT_FOUND", "نامه پیدا نشد.");
        }
        await this.organizationForUser(user.id, row.organization.id);
        if (input.read) {
            row.readAt = new Date();
        }
        if (input.status) {
            row.status = this.parseLetterStatus(input.status);
            if (row.status === request_letter_entity_1.RequestLetterStatus.ANSWERED) {
                row.respondedAt = new Date();
            }
        }
        const saved = await this.letters.save(row);
        return this.serializeLetter(saved);
    }
    async activeMemberships(userId) {
        return this.memberships.find({
            where: { user: { id: userId }, status: organization_membership_entity_1.MembershipStatus.ACTIVE },
            relations: { organization: true },
        });
    }
    async notifyRequestReviewers(organizationId, reviewer, title, body, url) {
        const roles = reviewer === leave_request_entity_1.LeaveRequestReviewerRole.SCHOOL_SUPERVISOR
            ? ["SCHOOL_SUPERVISOR", "PRINCIPAL"]
            : ["PRINCIPAL", "ORGANIZATION_ADMIN"];
        const memberships = await this.memberships.find({
            where: {
                organization: { id: organizationId },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { user: true, roleAssignments: { role: true } },
        });
        const recipients = memberships
            .filter((membership) => membership.roleAssignments.some((assignment) => roles.includes(assignment.role.code)))
            .map((membership) => membership.user.id);
        if (recipients.length)
            await this.notifications.createForUsers(recipients, {
                type: "ANNOUNCEMENT",
                category: "student_request",
                title,
                body,
                url,
                priority: "high",
            });
    }
    async emitOccupancyUpdate(organizationId, exitPermissionId, action) {
        const memberships = await this.memberships.find({
            where: {
                organization: { id: organizationId },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { user: true },
        });
        this.realtime.emitToUsers(memberships.map((membership) => membership.user.id), "school.occupancy.updated", { organizationId, exitPermissionId, action });
    }
    async organizationForUser(userId, organizationId) {
        const membership = await this.memberships.findOne({
            where: {
                user: { id: userId },
                organization: { id: organizationId },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { organization: true },
        });
        if (!membership?.organization) {
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        }
        return membership.organization;
    }
    async studentForPhoneInOrganization(phoneNumber, organizationId) {
        const phone = (0, phone_number_1.normalizeIranianMobile)(phoneNumber);
        if (!(0, phone_number_1.isIranianMobile)(phone)) {
            throw new api_exception_1.ApiException(400, "STUDENT_PHONE_INVALID", "شماره همراه دانش‌آموز معتبر نیست.");
        }
        const student = await this.students.findOne({
            where: [
                { organization: { id: organizationId }, user: { phoneNumber: phone } },
                { organization: { id: organizationId }, user: { username: phone } },
            ],
            relations: { user: true, organization: true },
        });
        if (!student) {
            throw new api_exception_1.ApiException(404, "STUDENT_PHONE_NOT_FOUND", "دانش‌آموزی با این شماره در مدرسه فعال پیدا نشد.");
        }
        return student;
    }
    async studentForUser(userId) {
        const student = await this.students.findOne({
            where: { user: { id: userId } },
            relations: { user: true },
        });
        if (!student) {
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        }
        return student;
    }
    async requireDormRoom(user, roomId) {
        const room = await this.dormRooms.findOne({
            where: { id: roomId },
            relations: { organization: true },
        });
        if (!room) {
            throw new api_exception_1.ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق خوابگاه پیدا نشد.");
        }
        await this.organizationForUser(user.id, room.organization.id);
        return room;
    }
    async resolveOrganizationIdForContext(user, contextType, contextId) {
        if (contextType === "class") {
            const classroom = await this.classes.findOne({
                where: { id: contextId },
                relations: { organization: true },
            });
            if (!classroom) {
                throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
            }
            await this.organizationForUser(user.id, classroom.organization.id);
            return classroom.organization.id;
        }
        if (contextType === "study_group") {
            const group = await this.studyGroups.findOne({
                where: { id: contextId },
                relations: { organization: true },
            });
            if (!group) {
                throw new api_exception_1.ApiException(404, "STUDY_GROUP_NOT_FOUND", "گروه درسی پیدا نشد.");
            }
            await this.organizationForUser(user.id, group.organization.id);
            return group.organization.id;
        }
        if (contextType === "dorm") {
            const room = await this.dormRooms.findOne({
                where: { id: contextId },
                relations: { organization: true },
            });
            if (!room) {
                throw new api_exception_1.ApiException(404, "DORM_ROOM_NOT_FOUND", "اتاق خوابگاه پیدا نشد.");
            }
            await this.organizationForUser(user.id, room.organization.id);
            return room.organization.id;
        }
        const memberships = await this.activeMemberships(user.id);
        if (!memberships.length) {
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        }
        return memberships[0].organization.id;
    }
    parseContextType(value) {
        if (value === "dorm" || value === "study_group")
            return value;
        if (value === "class")
            return "class";
        throw new api_exception_1.ApiException(400, "ATTENDANCE_CONTEXT_INVALID", "نوع زمینه حضور معتبر نیست.");
    }
    parseAttendanceStatus(value) {
        if (value === "present")
            return attendance_record_entity_1.AttendanceStatus.PRESENT;
        if (value === "absent")
            return attendance_record_entity_1.AttendanceStatus.ABSENT;
        if (value === "late")
            return attendance_record_entity_1.AttendanceStatus.LATE;
        if (value === "excused")
            return attendance_record_entity_1.AttendanceStatus.EXCUSED;
        throw new api_exception_1.ApiException(400, "ATTENDANCE_STATUS_INVALID", "وضعیت حضور معتبر نیست.");
    }
    parseLeaveStatus(value) {
        if (value === "APPROVED")
            return leave_request_entity_1.LeaveRequestStatus.APPROVED;
        if (value === "REJECTED")
            return leave_request_entity_1.LeaveRequestStatus.REJECTED;
        if (value === "CANCELLED")
            return leave_request_entity_1.LeaveRequestStatus.CANCELLED;
        if (value === "COMPLETED")
            return leave_request_entity_1.LeaveRequestStatus.COMPLETED;
        return leave_request_entity_1.LeaveRequestStatus.PENDING;
    }
    parseExitStatus(value) {
        if (value === "APPROVED")
            return exit_permission_entity_1.ExitPermissionStatus.APPROVED;
        if (value === "REJECTED")
            return exit_permission_entity_1.ExitPermissionStatus.REJECTED;
        if (value === "CANCELLED")
            return exit_permission_entity_1.ExitPermissionStatus.CANCELLED;
        if (value === "COMPLETED")
            return exit_permission_entity_1.ExitPermissionStatus.COMPLETED;
        return exit_permission_entity_1.ExitPermissionStatus.PENDING;
    }
    parseLetterStatus(value) {
        if (value === "DRAFT")
            return request_letter_entity_1.RequestLetterStatus.DRAFT;
        if (value === "SENT")
            return request_letter_entity_1.RequestLetterStatus.SENT;
        if (value === "RECEIVED")
            return request_letter_entity_1.RequestLetterStatus.RECEIVED;
        if (value === "UNDER_REVIEW")
            return request_letter_entity_1.RequestLetterStatus.UNDER_REVIEW;
        if (value === "ANSWERED")
            return request_letter_entity_1.RequestLetterStatus.ANSWERED;
        if (value === "REJECTED")
            return request_letter_entity_1.RequestLetterStatus.REJECTED;
        if (value === "CLOSED")
            return request_letter_entity_1.RequestLetterStatus.CLOSED;
        return request_letter_entity_1.RequestLetterStatus.DRAFT;
    }
    serializeLeaveRequest(row) {
        return {
            id: row.id,
            organizationId: row.organization.id,
            organizationName: row.organization.name,
            studentId: row.student.id,
            studentName: row.student.name,
            leaveType: row.leaveType,
            reviewerRole: row.reviewerRole ?? leave_request_entity_1.LeaveRequestReviewerRole.PRINCIPAL,
            startDate: row.startDate.toISOString(),
            endDate: row.endDate.toISOString(),
            reason: row.reason,
            note: row.note,
            attachments: row.attachments,
            status: row.status,
            approverId: row.approver?.id || null,
            reviewedAt: row.reviewedAt?.toISOString() || null,
            createdAt: row.createdAt.toISOString(),
        };
    }
    parseLeaveRequestType(value) {
        if (value === leave_request_entity_1.LeaveRequestType.SCHOOL_EXIT)
            return leave_request_entity_1.LeaveRequestType.SCHOOL_EXIT;
        if (value === leave_request_entity_1.LeaveRequestType.LEAVE || !value || value === "general") {
            return leave_request_entity_1.LeaveRequestType.LEAVE;
        }
        throw new api_exception_1.ApiException(400, "LEAVE_TYPE_INVALID", "نوع درخواست باید خروج از مدرسه یا مرخصی باشد.");
    }
    serializeExitPermission(row) {
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
            status: row.status,
            approverId: row.approver?.id || null,
            reviewedAt: row.reviewedAt?.toISOString() || null,
            createdAt: row.createdAt.toISOString(),
        };
    }
    serializeLetter(row) {
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
};
exports.WorkflowsService = WorkflowsService;
exports.WorkflowsService = WorkflowsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(attendance_session_entity_1.AttendanceSession)),
    __param(1, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __param(2, (0, typeorm_1.InjectRepository)(leave_request_entity_1.LeaveRequest)),
    __param(3, (0, typeorm_1.InjectRepository)(exit_permission_entity_1.ExitPermission)),
    __param(4, (0, typeorm_1.InjectRepository)(request_letter_entity_1.RequestLetter)),
    __param(5, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(6, (0, typeorm_1.InjectRepository)(education_class_entity_1.EducationClass)),
    __param(7, (0, typeorm_1.InjectRepository)(education_class_enrollment_entity_1.EducationClassEnrollment)),
    __param(8, (0, typeorm_1.InjectRepository)(study_group_entity_1.StudyGroup)),
    __param(9, (0, typeorm_1.InjectRepository)(study_group_membership_entity_1.StudyGroupMembership)),
    __param(10, (0, typeorm_1.InjectRepository)(dorm_room_entity_1.DormRoom)),
    __param(11, (0, typeorm_1.InjectRepository)(dorm_room_assignment_entity_1.DormRoomAssignment)),
    __param(12, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(13, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
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
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        realtime_1.RealtimeService,
        notifications_1.NotificationsService])
], WorkflowsService);
//# sourceMappingURL=workflows.service.js.map