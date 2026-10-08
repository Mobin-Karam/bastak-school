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
exports.SubjectsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const student_subject_entity_1 = require("../../database/entities/student-subject.entity");
const subject_entity_1 = require("../../database/entities/subject.entity");
const teacher_subject_assignment_entity_1 = require("../../database/entities/teacher-subject-assignment.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const authorization_1 = require("../authorization");
let SubjectsService = class SubjectsService {
    subjects;
    settings;
    students;
    organizations;
    teacherSubjects;
    memberships;
    roleAssignments;
    users;
    authorization;
    constructor(subjects, settings, students, organizations, teacherSubjects, memberships, roleAssignments, users, authorization) {
        this.subjects = subjects;
        this.settings = settings;
        this.students = students;
        this.organizations = organizations;
        this.teacherSubjects = teacherSubjects;
        this.memberships = memberships;
        this.roleAssignments = roleAssignments;
        this.users = users;
        this.authorization = authorization;
    }
    context(u) {
        return {
            ...u,
            roles: u.roles ?? [u.role],
            capabilities: u.capabilities ?? [],
            membershipIds: u.membershipIds ?? [],
            organizationIds: u.organizationIds ?? [],
        };
    }
    async list(u, includeArchived = false) {
        const c = this.context(u);
        if (includeArchived)
            this.authorization.requireCapability(c, "subjects.archive");
        if (c.roles.length === 1 && c.roles[0] === "TEACHER") {
            const rows = await this.teacherSubjects.find({
                where: {
                    teacher: { id: c.id },
                    organization: { id: (0, typeorm_2.In)(c.organizationIds) },
                    subject: includeArchived ? {} : { active: true },
                },
                relations: { subject: { organization: true } },
                order: { subject: { name: "ASC" } },
            });
            return rows.map((row) => row.subject);
        }
        const orgs = c.organizationIds;
        return this.subjects.find({
            where: orgs.length
                ? [
                    { organization: (0, typeorm_2.IsNull)(), ...(includeArchived ? {} : { active: true }) },
                    { organization: { id: (0, typeorm_2.In)(orgs) }, ...(includeArchived ? {} : { active: true }) },
                ]
                : { organization: (0, typeorm_2.IsNull)(), ...(includeArchived ? {} : { active: true }) },
            order: { name: "ASC" },
            relations: { organization: true },
        });
    }
    async create(u, d) {
        const c = this.context(u);
        this.authorization.requireCapability(c, "subjects.create");
        if (d.organizationId &&
            !this.authorization.canAccessOrganization(c, d.organizationId, "organization.read"))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        const organization = d.organizationId
            ? await this.organizations.findOne({ where: { id: d.organizationId } })
            : null;
        if (d.organizationId && !organization)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
        const code = d.code.trim().toLowerCase();
        const existing = await this.subjects.findOne({
            where: d.organizationId
                ? { code, organization: { id: d.organizationId } }
                : { code, organization: (0, typeorm_2.IsNull)() },
        });
        if (existing)
            throw new api_exception_1.ApiException(409, "SUBJECT_CODE_EXISTS", "کلید یکتای درس قبلاً ثبت شده است.");
        return this.subjects.save(this.subjects.create({
            code,
            name: d.name.trim(),
            category: d.category?.trim() || "عمومی",
            organization,
            active: true,
        }));
    }
    async update(u, id, d) {
        const c = this.context(u);
        this.authorization.requireCapability(c, "subjects.update");
        const subject = await this.accessibleSubject(c, id);
        Object.assign(subject, {
            ...(d.name !== undefined ? { name: d.name.trim() } : {}),
            ...(d.category !== undefined ? { category: d.category.trim() } : {}),
        });
        return this.subjects.save(subject);
    }
    async export(u) {
        const rows = await this.list(u, true);
        return {
            schemaVersion: "1.0",
            subjects: rows.map((row) => ({
                code: row.code,
                name: row.name,
                category: row.category || "عمومی",
                active: row.active,
                organizationId: row.organization?.id,
            })),
        };
    }
    importSample() {
        return {
            schemaVersion: "1.0",
            subjects: [
                { code: "mathematics", name: "ریاضی", category: "علوم پایه" },
                { code: "persian", name: "فارسی", category: "عمومی" },
            ],
        };
    }
    async previewImport(u, rows = []) {
        this.authorization.requireCapability(this.context(u), "subjects.create");
        if (!Array.isArray(rows) || !rows.length || rows.length > 500)
            throw new api_exception_1.ApiException(422, "SUBJECT_IMPORT_INVALID", "فایل باید شامل ۱ تا ۵۰۰ درس باشد.");
        const seen = new Set();
        const results = await Promise.all(rows.map(async (row, index) => {
            const code = typeof row?.code === "string" ? row.code.trim().toLowerCase() : "";
            const name = typeof row?.name === "string" ? row.name.trim() : "";
            const category = typeof row?.category === "string" ? row.category.trim() : "عمومی";
            const errors = [];
            if (!code || code.length > 80)
                errors.push("کلید درس معتبر نیست");
            if (name.length < 2 || name.length > 160)
                errors.push("نام درس معتبر نیست");
            if (!category || category.length > 80)
                errors.push("دسته‌بندی معتبر نیست");
            const identity = `${row?.organizationId || "platform"}:${code}`;
            if (seen.has(identity))
                errors.push("کلید درس در همین فایل تکراری است");
            seen.add(identity);
            if (row?.organizationId && !this.authorization.canAccessOrganization(this.context(u), row.organizationId, "organization.read"))
                errors.push("سازمان انتخاب‌شده در دسترس نیست");
            if (!errors.length) {
                const existing = await this.subjects.findOne({ where: row.organizationId ? { code, organization: { id: row.organizationId } } : { code, organization: (0, typeorm_2.IsNull)() } });
                if (existing)
                    errors.push("کلید درس از قبل ثبت شده است");
            }
            return { row: index + 1, code: code || null, valid: !errors.length, errors };
        }));
        return { valid: results.every((row) => row.valid), accepted: results.filter((row) => row.valid).length, rejected: results.filter((row) => !row.valid).length, rows: results };
    }
    async commitImport(u, rows = []) {
        const preview = await this.previewImport(u, rows);
        if (!preview.valid)
            throw new api_exception_1.ApiException(422, "SUBJECT_IMPORT_INVALID", "پیش‌نمایش ورود دارای خطا است.", preview);
        const created = [];
        for (const row of rows)
            created.push(await this.create(u, row));
        return { imported: created.length, subjects: created };
    }
    async setActive(u, id, active) {
        const c = this.context(u);
        this.authorization.requireCapability(c, "subjects.archive");
        const subject = await this.accessibleSubject(c, id);
        subject.active = active;
        return this.subjects.save(subject);
    }
    async accessibleSubject(c, id) {
        const subject = await this.subjects.findOne({
            where: { id },
            relations: { organization: true },
        });
        if (!subject)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "درس یافت نشد.");
        if (subject.organization &&
            !this.authorization.canAccessOrganization(c, subject.organization.id, "organization.read"))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "درس یافت نشد.");
        return subject;
    }
    async assignTeacher(u, subjectId, d) {
        const c = this.context(u);
        this.authorization.requireCapability(c, "organization.members.manage");
        if (!this.authorization.canAccessOrganization(c, d.organizationId, "organization.members.manage"))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
        const [teacher, subject, organization, membership] = await Promise.all([
            this.users.findOne({ where: { id: d.teacherId } }),
            this.subjects.findOne({
                where: { id: subjectId },
                relations: { organization: true },
            }),
            this.organizations.findOne({ where: { id: d.organizationId } }),
            this.memberships.findOne({
                where: {
                    user: { id: d.teacherId },
                    organization: { id: d.organizationId },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                },
            }),
        ]);
        if (!teacher ||
            !subject ||
            !organization ||
            !membership ||
            (subject.organization && subject.organization.id !== organization.id))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "معلم، درس یا عضویت معتبر یافت نشد.");
        const teacherRole = await this.roleAssignments.findOne({
            where: {
                user: { id: teacher.id },
                membership: { id: membership.id },
                role: { code: "TEACHER" },
            },
        });
        if (!teacherRole)
            throw new api_exception_1.ApiException(422, "TEACHER_ROLE_REQUIRED", "کاربر در این سازمان نقش معلم ندارد.");
        const existing = await this.teacherSubjects.findOne({
            where: {
                teacher: { id: teacher.id },
                subject: { id: subject.id },
                organization: { id: organization.id },
            },
        });
        return (existing ??
            this.teacherSubjects.save(this.teacherSubjects.create({ teacher, subject, organization })));
    }
    async listTeachers(u, subjectId, organizationId) {
        const c = this.context(u);
        this.authorization.requireCapability(c, "organization.members.manage");
        if (!organizationId || !this.authorization.canAccessOrganization(c, organizationId, "organization.members.manage"))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
        const rows = await this.teacherSubjects.find({
            where: { subject: { id: subjectId }, organization: { id: organizationId } },
            relations: { teacher: true },
            order: { createdAt: "ASC" },
        });
        return rows.map((row) => ({ id: row.id, teacher: { id: row.teacher.id, username: row.teacher.username, firstName: row.teacher.firstName, lastName: row.teacher.lastName }, createdAt: row.createdAt }));
    }
    async unassignTeacher(u, subjectId, teacherId, organizationId) {
        const c = this.context(u);
        this.authorization.requireCapability(c, "organization.members.manage");
        if (!this.authorization.canAccessOrganization(c, organizationId, "organization.members.manage"))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
        const result = await this.teacherSubjects.delete({
            teacher: { id: teacherId },
            subject: { id: subjectId },
            organization: { id: organizationId },
        });
        return { removed: Boolean(result.affected) };
    }
    async forStudent(u, studentId) {
        const c = this.context(u);
        if (!(await this.authorization.canAccessStudent(c, studentId, "studentSubjects.read")))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
        const rows = await this.settings.find({
            where: { student: { id: studentId } },
            relations: { subject: true },
            order: { subject: { name: "ASC" } },
        });
        return rows.map((row) => ({
            subject: {
                id: row.subject.id,
                code: row.subject.code,
                name: row.subject.name,
                category: row.subject.category || "عمومی",
            },
            enabled: row.enabled,
            displayName: row.displayName,
            weeklyTargetMinutes: row.weeklyTargetMinutes,
        }));
    }
    async configure(u, studentId, subjectId, d) {
        const c = this.context(u);
        if (!(await this.authorization.canAccessStudent(c, studentId, "studentSubjects.manage")))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
        const [student, subject] = await Promise.all([
            this.students.findOne({ where: { id: studentId } }),
            this.subjects.findOne({ where: { id: subjectId } }),
        ]);
        if (!student || !subject)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یا درس یافت نشد.");
        let row = await this.settings.findOne({
            where: { student: { id: studentId }, subject: { id: subjectId } },
        });
        row = row ?? this.settings.create({ student, subject });
        Object.assign(row, d);
        return this.settings.save(row);
    }
};
exports.SubjectsService = SubjectsService;
exports.SubjectsService = SubjectsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(subject_entity_1.Subject)),
    __param(1, (0, typeorm_1.InjectRepository)(student_subject_entity_1.StudentSubject)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(4, (0, typeorm_1.InjectRepository)(teacher_subject_assignment_entity_1.TeacherSubjectAssignment)),
    __param(5, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(6, (0, typeorm_1.InjectRepository)(user_role_assignment_entity_1.UserRoleAssignment)),
    __param(7, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService])
], SubjectsService);
//# sourceMappingURL=subjects.service.js.map