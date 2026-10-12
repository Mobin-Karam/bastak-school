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
exports.ClassesService = void 0;
const study_group_entity_1 = require("../../database/entities/study-group.entity");
const study_group_membership_entity_1 = require("../../database/entities/study-group-membership.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const education_book_entity_1 = require("../../database/entities/education-book.entity");
const education_class_book_entity_1 = require("../../database/entities/education-class-book.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const authorization_1 = require("../authorization");
const education_catalog_1 = require("../education-catalog");
let ClassesService = class ClassesService {
    classes;
    classBooks;
    enrollments;
    books;
    organizations;
    memberships;
    students;
    users;
    roleAssignments;
    authorization;
    catalog;
    constructor(classes, classBooks, enrollments, books, organizations, memberships, students, users, roleAssignments, authorization, catalog) {
        this.classes = classes;
        this.classBooks = classBooks;
        this.enrollments = enrollments;
        this.books = books;
        this.organizations = organizations;
        this.memberships = memberships;
        this.students = students;
        this.users = users;
        this.roleAssignments = roleAssignments;
        this.authorization = authorization;
        this.catalog = catalog;
    }
    async list(actor, organizationId) {
        const context = this.context(actor);
        this.authorization.requireCapability(context, "classes.read");
        const requestedOrganizationId = organizationId ?? actor.activeOrganizationId;
        const allowedOrganizations = this.isPlatform(context)
            ? requestedOrganizationId
                ? [requestedOrganizationId]
                : undefined
            : context.organizationIds;
        if (requestedOrganizationId &&
            !this.canReadOrganization(context, requestedOrganizationId))
            this.forbidden();
        const rows = await this.classes.find({
            where: allowedOrganizations?.length
                ? { organization: { id: (0, typeorm_2.In)(allowedOrganizations) } }
                : undefined,
            relations: {
                organization: true,
                advisor: true,
                books: { book: true, teacher: true },
                enrollments: { student: true },
            },
            order: { schoolYear: "DESC", name: "ASC" },
        });
        return rows
            .filter((row) => this.canSeeClass(context, row))
            .map((row) => this.view(row, context.roles.length === 1 && context.roles[0] === "TEACHER"
            ? context.id
            : undefined));
    }
    async assigned(actor, studentId) {
        const context = this.context(actor);
        this.authorization.requireCapability(context, "classes.read");
        const student = studentId
            ? await this.students.findOne({
                where: { id: studentId },
                relations: { user: true, organization: true },
            })
            : await this.students.findOne({
                where: { user: { id: actor.id } },
                relations: { user: true, organization: true },
            });
        if (!student)
            throw new api_exception_1.ApiException(404, "STUDENT_NOT_FOUND", "پرونده دانش‌آموز پیدا نشد.");
        if (!(await this.authorization.canAccessStudent(context, student.id, "classes.read")))
            this.forbidden();
        const rows = await this.enrollments.find({
            where: { student: { id: student.id }, classroom: { status: "ACTIVE" } },
            relations: {
                classroom: {
                    organization: true,
                    advisor: true,
                    books: { book: true, teacher: true },
                },
            },
            order: { classroom: { name: "ASC" } },
        });
        return rows.map((row) => this.studentView(row.classroom));
    }
    async options(actor, id) {
        const classroom = await this.requireClass(actor, id, "classes.read");
        const [books, staff, students] = await Promise.all([
            this.catalog.listBooks(this.hasCurriculumProfile(classroom) ? classroom.gradeId : undefined, this.hasCurriculumProfile(classroom)
                ? classroom.educationTypeId
                : undefined, this.hasCurriculumProfile(classroom) ? classroom.trackId : undefined, [classroom.organization.id]),
            this.staffForOrganization(classroom.organization.id),
            this.eligibleStudents(classroom),
        ]);
        return {
            classroom: this.view(classroom),
            books: books.map((book) => ({
                id: book.id,
                title: book.titleFa,
                category: book.category,
                track: book.track,
            })),
            teachers: staff.filter((member) => member.roles.includes("TEACHER")),
            advisors: staff.filter((member) => member.roles.includes("ADVISOR") ||
                member.roles.includes("COUNSELOR") ||
                member.roles.includes("MENTOR") ||
                member.roles.includes("STUDENT_AFFAIRS_MENTOR")),
            eligibleStudents: students.map((student) => ({
                id: student.id,
                name: student.name,
                grade: student.grade,
                major: student.major,
            })),
        };
    }
    async create(actor, dto) {
        const context = this.context(actor);
        this.authorization.requireCapability(context, "classes.manage");
        if (!this.canManageOrganization(context, dto.organizationId))
            this.forbidden();
        const organization = await this.organizations.findOneBy({
            id: dto.organizationId,
        });
        if (!organization)
            throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان پیدا نشد.");
        this.assertSchoolYear(dto.schoolYear);
        const code = dto.code.trim().toLowerCase();
        const existing = await this.classes.findOne({
            where: { organization: { id: organization.id }, code },
        });
        if (existing)
            throw new api_exception_1.ApiException(409, "CLASS_CODE_EXISTS", "کد کلاس در این سازمان تکراری است.");
        const classroom = await this.classes.save(this.classes.create({
            organization,
            code,
            name: dto.name.trim(),
            schoolYear: dto.schoolYear.trim(),
            gradeId: 0,
            educationTypeId: "universal",
            trackId: "universal",
            capacity: dto.capacity ?? 35,
            description: "",
            advisor: null,
            status: "ACTIVE",
        }));
        return this.view(await this.load(classroom.id));
    }
    async update(actor, id, dto) {
        const classroom = await this.requireClass(actor, id, "classes.manage", true);
        const advisor = dto.advisorId === undefined
            ? classroom.advisor
            : await this.resolveAdvisor(classroom.organization.id, dto.advisorId);
        if (dto.schoolYear !== undefined)
            this.assertSchoolYear(dto.schoolYear);
        Object.assign(classroom, {
            ...(dto.code !== undefined
                ? { code: dto.code.trim().toLowerCase() }
                : {}),
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.schoolYear !== undefined
                ? { schoolYear: dto.schoolYear.trim() }
                : {}),
            ...(dto.capacity !== undefined ? { capacity: dto.capacity } : {}),
            ...(dto.description !== undefined
                ? { description: dto.description.trim() }
                : {}),
            ...(dto.status !== undefined ? { status: dto.status } : {}),
            advisor,
        });
        if (classroom.capacity < classroom.enrollments.length)
            throw new api_exception_1.ApiException(422, "CLASS_CAPACITY_TOO_LOW", "ظرفیت نمی‌تواند از تعداد ثبت‌نام‌شدگان کمتر باشد.");
        await this.classes.save(classroom);
        return this.view(await this.load(id));
    }
    async previewTransfer(actor, dto) {
        await this.requireTransferOrganization(actor, dto.organizationId);
        return this.inspectTransfer(dto.organizationId, dto.rows);
    }
    async commitTransfer(actor, dto) {
        await this.requireTransferOrganization(actor, dto.organizationId);
        const preview = await this.inspectTransfer(dto.organizationId, dto.rows);
        if (preview.invalid)
            return {
                committed: false,
                count: 0,
                invalid: preview.invalid,
                rows: preview.rows,
            };
        const organization = await this.organizations.findOneBy({
            id: dto.organizationId,
        });
        if (!organization)
            throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان پیدا نشد.");
        await this.classes.manager.transaction(async (manager) => {
            await manager.getRepository(education_class_entity_1.EducationClass).save(dto.rows.map((row) => manager.getRepository(education_class_entity_1.EducationClass).create({
                organization,
                code: row.code.trim().toLowerCase(),
                name: row.name.trim(),
                schoolYear: row.schoolYear.trim(),
                gradeId: 0,
                educationTypeId: "universal",
                trackId: "universal",
                capacity: row.capacity ?? 35,
                description: "",
                advisor: null,
                status: "ACTIVE",
            })));
        });
        return { committed: true, count: dto.rows.length, invalid: 0 };
    }
    async exportTransfer(actor, organizationId) {
        await this.requireTransferOrganization(actor, organizationId);
        const rows = await this.classes.find({
            where: { organization: { id: organizationId } },
            order: { schoolYear: "DESC", name: "ASC" },
        });
        return rows.map((row) => ({
            code: row.code,
            name: row.name,
            schoolYear: this.normalizedAcademicYear(row.schoolYear),
            capacity: row.capacity,
        }));
    }
    async remove(actor, id) {
        const classroom = await this.requireClass(actor, id, "classes.manage", true);
        await this.classes.remove(classroom);
        return { deleted: true };
    }
    async setBooks(actor, id, dto) {
        const classroom = await this.requireClass(actor, id, "education.catalog.manage", true);
        const requested = dto.books || [];
        const eligible = await this.catalog.listBooks(this.hasCurriculumProfile(classroom) ? classroom.gradeId : undefined, this.hasCurriculumProfile(classroom)
            ? classroom.educationTypeId
            : undefined, this.hasCurriculumProfile(classroom) ? classroom.trackId : undefined, [classroom.organization.id]);
        const eligibleIds = new Set(eligible.map((book) => book.id));
        if (requested.some((item) => !eligibleIds.has(item.bookId)))
            throw new api_exception_1.ApiException(422, "CLASS_BOOK_PROFILE_MISMATCH", "یک یا چند کتاب با پایه یا نوع آموزشی کلاس سازگار نیست.");
        const teachers = await Promise.all(requested.map((item) => this.resolveTeacher(classroom.organization.id, item.teacherId)));
        const books = requested.length
            ? await this.books.findBy({
                id: (0, typeorm_2.In)(requested.map((item) => item.bookId)),
            })
            : [];
        if (books.length !== requested.length)
            throw new api_exception_1.ApiException(404, "CLASS_BOOK_NOT_FOUND", "یک یا چند کتاب پیدا نشد.");
        await this.classBooks.delete({ classroom: { id: classroom.id } });
        if (requested.length)
            await this.classBooks.save(requested.map((item, index) => this.classBooks.create({
                classroom,
                book: books.find((book) => book.id === item.bookId),
                teacher: teachers[index],
            })));
        return this.view(await this.load(id));
    }
    async setEnrollments(actor, id, dto) {
        const classroom = await this.requireClass(actor, id, "classes.roster.manage");
        const studentIds = [...new Set(dto.studentIds || [])];
        if (studentIds.length > classroom.capacity)
            throw new api_exception_1.ApiException(422, "CLASS_CAPACITY_EXCEEDED", "تعداد دانش‌آموزان از ظرفیت کلاس بیشتر است.");
        const students = studentIds.length
            ? await this.students.find({
                where: { id: (0, typeorm_2.In)(studentIds) },
                relations: { user: true, organization: true },
            })
            : [];
        if (students.length !== studentIds.length)
            throw new api_exception_1.ApiException(404, "CLASS_STUDENT_NOT_FOUND", "یک یا چند دانش‌آموز پیدا نشد.");
        await Promise.all(students.map((student) => this.assertEligibleStudent(classroom, student)));
        await this.enrollments.manager.transaction(async (manager) => {
            const enrollments = manager.getRepository(education_class_enrollment_entity_1.EducationClassEnrollment);
            await enrollments.delete({ classroom: { id: classroom.id } });
            if (students.length)
                await enrollments.save(students.map((student) => enrollments.create({ classroom, student })));
            const groups = await manager.getRepository(study_group_entity_1.StudyGroup).find({
                where: { classroom: { id: classroom.id } },
                select: { id: true },
            });
            if (groups.length)
                await manager.getRepository(study_group_membership_entity_1.StudyGroupMembership).delete({
                    group: { id: (0, typeorm_2.In)(groups.map((group) => group.id)) },
                    ...(studentIds.length
                        ? { student: { id: (0, typeorm_2.Not)((0, typeorm_2.In)(studentIds)) } }
                        : {}),
                });
        });
        return this.view(await this.load(id));
    }
    async requireClass(actor, id, capability, requireManage = false) {
        const context = this.context(actor);
        this.authorization.requireCapability(context, capability);
        const classroom = await this.load(id);
        if (requireManage
            ? !this.canManageOrganization(context, classroom.organization.id)
            : !this.canSeeClass(context, classroom))
            this.forbidden();
        return classroom;
    }
    async load(id) {
        const classroom = await this.classes.findOne({
            where: { id },
            relations: {
                organization: true,
                advisor: true,
                books: { book: true, teacher: true },
                enrollments: { student: true },
            },
        });
        if (!classroom)
            throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس پیدا نشد.");
        return classroom;
    }
    context(actor) {
        return {
            ...actor,
            roles: actor.roles || [actor.role],
            capabilities: actor.capabilities || [],
            membershipIds: actor.membershipIds || [],
            organizationIds: actor.organizationIds || [],
        };
    }
    isPlatform(context) {
        return context.roles.includes("PLATFORM_ADMIN");
    }
    canReadOrganization(context, organizationId) {
        return (this.isPlatform(context) ||
            context.organizationIds.includes(organizationId));
    }
    canManageOrganization(context, organizationId) {
        return (this.isPlatform(context) ||
            (context.capabilities.includes("education.catalog.manage") &&
                context.organizationIds.includes(organizationId)) ||
            ([
                "ORGANIZATION_ADMIN",
                "PRINCIPAL",
                "SCHOOL_SUPERVISOR",
                "RELIGIOUS_EDUCATION_MANAGER",
                "GOVERNMENT_EDUCATION_MANAGER",
            ].some((role) => context.roles.includes(role)) &&
                context.organizationIds.includes(organizationId)));
    }
    canSeeClass(context, classroom) {
        return (this.canManageOrganization(context, classroom.organization.id) ||
            classroom.advisor?.id === context.id ||
            classroom.books.some((book) => book.teacher.id === context.id));
    }
    forbidden() {
        throw new api_exception_1.ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
    }
    async requireTransferOrganization(actor, organizationId) {
        const context = this.context(actor);
        this.authorization.requireCapability(context, "classes.manage");
        if (!this.canManageOrganization(context, organizationId))
            this.forbidden();
        const organization = await this.organizations.findOneBy({
            id: organizationId,
        });
        if (!organization)
            throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان پیدا نشد.");
        return organization;
    }
    async inspectTransfer(organizationId, rows) {
        const existing = await this.classes.find({
            where: { organization: { id: organizationId } },
            select: { code: true },
        });
        const existingCodes = new Set(existing.map((item) => item.code.toLowerCase()));
        const seenCodes = new Set();
        const inspected = rows.map((row, index) => {
            const code = row.code?.trim().toLowerCase();
            const errors = [];
            if (!code)
                errors.push("ستون «کد کلاس» الزامی است.");
            else if (seenCodes.has(code))
                errors.push("ستون «کد کلاس» در همین فایل تکراری است.");
            else if (existingCodes.has(code))
                errors.push("این «کد کلاس» از قبل در سازمان وجود دارد.");
            if (code)
                seenCodes.add(code);
            if (!row.name?.trim())
                errors.push("ستون «نام کلاس» الزامی است.");
            if (!this.isAcademicYear(row.schoolYear))
                errors.push("ستون «سال تحصیلی» باید دو سال پیاپی باشد.");
            if (row.capacity !== undefined &&
                (row.capacity < 1 || row.capacity > 200))
                errors.push("ستون «ظرفیت» باید بین ۱ تا ۲۰۰ باشد.");
            return {
                row: index + 2,
                code: row.code,
                name: row.name,
                schoolYear: row.schoolYear,
                capacity: row.capacity,
                errors,
            };
        });
        const invalid = inspected.filter((row) => row.errors.length).length;
        return {
            total: rows.length,
            valid: rows.length - invalid,
            invalid,
            rows: inspected,
        };
    }
    assertSchoolYear(value) {
        if (!this.isAcademicYear(value))
            throw new api_exception_1.ApiException(422, "SCHOOL_YEAR_INVALID", "سال تحصیلی باید از دو سال پیاپی تشکیل شود.");
    }
    isAcademicYear(value) {
        const match = /^(\d{4})-(\d{4})$/.exec(value?.trim());
        if (!match)
            return false;
        const start = Number(match[1]);
        const end = Number(match[2]);
        return start >= 1405 && start <= 1430 && end === start + 1;
    }
    normalizedAcademicYear(value) {
        if (this.isAcademicYear(value))
            return value.trim();
        const start = Number(value);
        return Number.isInteger(start) && start >= 1405 && start <= 1430
            ? `${start}-${start + 1}`
            : value;
    }
    async resolveTeacher(organizationId, userId) {
        const member = await this.staffMember(organizationId, userId);
        if (!member.roles.includes("TEACHER"))
            throw new api_exception_1.ApiException(422, "CLASS_TEACHER_INVALID", "دبیر باید عضو فعال همین سازمان باشد.");
        return member.user;
    }
    async resolveAdvisor(organizationId, userId) {
        if (!userId)
            return null;
        const member = await this.staffMember(organizationId, userId);
        if (!member.roles.some((role) => role === "ADVISOR" || role === "MENTOR"))
            throw new api_exception_1.ApiException(422, "CLASS_ADVISOR_INVALID", "مشاور باید عضو فعال همین سازمان باشد.");
        return member.user;
    }
    async staffMember(organizationId, userId) {
        const member = await this.memberships.findOne({
            where: {
                organization: { id: organizationId },
                user: { id: userId },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { user: true, roleAssignments: { role: true } },
        });
        if (!member)
            throw new api_exception_1.ApiException(422, "CLASS_STAFF_INVALID", "عضو فعال سازمان پیدا نشد.");
        return {
            user: member.user,
            roles: member.roleAssignments.map((assignment) => assignment.role.code),
        };
    }
    async staffForOrganization(organizationId) {
        const members = await this.memberships.find({
            where: {
                organization: { id: organizationId },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { user: true, roleAssignments: { role: true } },
            order: { user: { firstName: "ASC", lastName: "ASC" } },
        });
        return members
            .map((member) => ({
            id: member.user.id,
            name: [member.user.firstName, member.user.lastName]
                .filter(Boolean)
                .join(" ") || member.user.username,
            roles: member.roleAssignments.map((assignment) => assignment.role.code),
        }))
            .filter((member) => member.roles.length);
    }
    async eligibleStudents(classroom) {
        return this.students.find({
            where: {
                organization: { id: classroom.organization.id },
                accountStatus: "active",
            },
            relations: { user: true, organization: true },
            order: { name: "ASC" },
        });
    }
    async assertEligibleStudent(classroom, student) {
        const matchesProfile = !this.hasCurriculumProfile(classroom) ||
            (student.gradeId === classroom.gradeId &&
                student.educationTypeId === classroom.educationTypeId &&
                student.trackId === classroom.trackId);
        if (!matchesProfile || student.accountStatus !== "active")
            throw new api_exception_1.ApiException(422, "CLASS_STUDENT_PROFILE_MISMATCH", "دانش‌آموز باید پایه، نوع و رشتهٔ سازگار و حساب فعال داشته باشد.");
        if (student.organization?.id !== classroom.organization.id)
            throw new api_exception_1.ApiException(422, "CLASS_STUDENT_ORGANIZATION_MISMATCH", "دانش‌آموز متعلق به مدرسه این کلاس نیست.");
    }
    view(classroom, assignedTeacherId) {
        const hasCurriculumProfile = this.hasCurriculumProfile(classroom);
        return {
            id: classroom.id,
            organization: {
                id: classroom.organization.id,
                name: classroom.organization.name,
                type: classroom.organization.type,
                status: classroom.organization.status,
            },
            code: classroom.code,
            name: classroom.name,
            schoolYear: this.normalizedAcademicYear(classroom.schoolYear),
            gradeId: hasCurriculumProfile ? classroom.gradeId : null,
            educationTypeId: hasCurriculumProfile ? classroom.educationTypeId : null,
            trackId: hasCurriculumProfile ? classroom.trackId : null,
            capacity: classroom.capacity,
            status: classroom.status,
            description: classroom.description,
            advisor: classroom.advisor
                ? {
                    id: classroom.advisor.id,
                    name: [classroom.advisor.firstName, classroom.advisor.lastName]
                        .filter(Boolean)
                        .join(" ") || classroom.advisor.username,
                }
                : null,
            books: classroom.books
                .filter((item) => !assignedTeacherId || item.teacher.id === assignedTeacherId)
                .map((item) => ({
                id: item.id,
                bookId: item.book.id,
                title: item.book.titleFa,
                code: item.book.textbookCode || item.book.id,
                teacher: {
                    id: item.teacher.id,
                    name: [item.teacher.firstName, item.teacher.lastName]
                        .filter(Boolean)
                        .join(" ") || item.teacher.username,
                },
            })),
            enrollmentCount: classroom.enrollments.length,
            students: classroom.enrollments.map((item) => ({
                id: item.student.id,
                name: item.student.name,
                grade: item.student.grade,
                major: item.student.major,
            })),
        };
    }
    hasCurriculumProfile(classroom) {
        return classroom.gradeId >= 1 && classroom.gradeId <= 12;
    }
    studentView(classroom) {
        const view = this.view(classroom);
        return { ...view, students: undefined };
    }
};
exports.ClassesService = ClassesService;
exports.ClassesService = ClassesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(education_class_entity_1.EducationClass)),
    __param(1, (0, typeorm_1.InjectRepository)(education_class_book_entity_1.EducationClassBook)),
    __param(2, (0, typeorm_1.InjectRepository)(education_class_enrollment_entity_1.EducationClassEnrollment)),
    __param(3, (0, typeorm_1.InjectRepository)(education_book_entity_1.EducationBook)),
    __param(4, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(5, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(6, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(7, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(8, (0, typeorm_1.InjectRepository)(user_role_assignment_entity_1.UserRoleAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        authorization_1.AuthorizationService,
        education_catalog_1.EducationCatalogService])
], ClassesService);
//# sourceMappingURL=classes.service.js.map