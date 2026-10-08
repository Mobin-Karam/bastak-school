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
const school_access_service_1 = require("../school-access/school-access.service");
const realtime_service_1 = require("../realtime/realtime.service");
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
    async listContexts(user, organizationId) {
        const ids = await this.access.scopedOrganizationIds(user, organizationId);
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
                }))
                : []),
        ];
    }
    async listSessions(user, organizationId) {
        const ids = await this.access.scopedOrganizationIds(user, organizationId);
        if (!ids.length)
            return [];
        const rows = await this.sessions.find({
            where: { organization: { id: (0, typeorm_2.In)(ids) } },
            relations: { organization: true, createdBy: true, records: true },
            order: { sessionDate: "DESC" },
        });
        return rows.map((row) => {
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
    async createSession(user, dto) {
        const organization = await this.access.organizationForUser(user, dto.organizationId);
        await this.assertContextAccess(user, dto.contextType, dto.contextId, organization.id, true);
        const date = new Date(dto.sessionDate);
        const row = await this.sessions.save(this.sessions.create({
            organization,
            contextType: dto.contextType,
            contextId: dto.contextId,
            sessionDate: date,
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
        const organization = await this.access.organizationForUser(user, dto.organizationId);
        if (!dto.entries.length)
            throw new api_exception_1.ApiException(422, "ATTENDANCE_EMPTY", "حداقل یک وضعیت حضور ارسال کنید.");
        let session = dto.sessionId
            ? await this.sessions.findOne({
                where: { id: dto.sessionId, organization: { id: organization.id } },
                relations: { organization: true },
            })
            : null;
        if (!session) {
            if (!dto.contextType || !dto.contextId)
                throw new api_exception_1.ApiException(422, "ATTENDANCE_CONTEXT_REQUIRED", "کلاس، گروه یا اتاق لازم است.");
            await this.assertContextAccess(user, dto.contextType, dto.contextId, organization.id, true);
            session = await this.sessions.save(this.sessions.create({
                organization,
                contextType: dto.contextType,
                contextId: dto.contextId,
                sessionDate: dto.sessionDate ? new Date(dto.sessionDate) : new Date(),
                note: "",
                createdBy: { id: user.id },
            }));
        }
        else {
            await this.assertContextAccess(user, session.contextType, session.contextId, organization.id, true);
        }
        const participants = await this.participantIds(user, session.contextType, session.contextId, organization.id);
        if (dto.entries.some((entry) => !participants.has(entry.studentId)))
            throw new api_exception_1.ApiException(422, "ATTENDANCE_STUDENT_NOT_IN_CONTEXT", "یک یا چند طلبه عضو این کلاس، گروه یا اتاق نیستند.");
        const saved = [];
        for (const entry of dto.entries) {
            const student = await this.students.findOneBy({ id: entry.studentId });
            if (!student)
                throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "طلبه پیدا نشد.");
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
                    recordedBy: { id: user.id },
                });
            else {
                record.status = status;
                record.note = entry.note?.trim() || "";
                record.recordedBy = { id: user.id };
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
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { user: true },
        });
        this.realtime.emitToUsers(members.map((member) => member.user.id), "attendance.updated", {
            organizationId: organization.id,
            sessionId: session.id,
            contextType: session.contextType,
            contextId: session.contextId,
            updatedBy: user.id,
        });
        return result;
    }
    async listParticipants(user, contextType, contextId) {
        const context = this.context(contextType);
        const organizationId = await this.contextOrganizationId(context, contextId);
        await this.access.organizationForUser(user, organizationId);
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
            });
            if (!student)
                throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده طلبه پیدا نشد.");
            target = student.id;
        }
        else if (!(await this.authorization.canAccessStudent(this.userContext(user), target, "students.read"))) {
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده طلبه پیدا نشد.");
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
            recent: rows.slice(0, 10).map((row) => ({
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
    async listSelfRecords(user) {
        const student = await this.students.findOne({
            where: { user: { id: user.id } },
        });
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
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
            contextType: row.session.contextType === "study_group"
                ? "class_group"
                : row.session.contextType,
            contextId: row.session.contextId,
            organizationId: row.session.organization.id,
            recordedAt: row.createdAt.toISOString(),
        }));
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
    schoolWide(user) {
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
        school_access_service_1.SchoolAccessService,
        authorization_1.AuthorizationService,
        realtime_service_1.RealtimeService])
], AttendanceService);
//# sourceMappingURL=attendance.service.js.map