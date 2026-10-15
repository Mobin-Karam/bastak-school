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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudentAdministrationService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const role_entity_1 = require("../../database/entities/role.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const authorization_1 = require("../authorization");
const students_service_1 = require("./students.service");
const task_issue_entity_1 = require("../../database/entities/task-issue.entity");
const recovery_request_entity_1 = require("../../database/entities/recovery-request.entity");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const learning_item_entity_1 = require("../../database/entities/learning-item.entity");
const exam_retry_request_entity_1 = require("../../database/entities/exam-retry-request.entity");
const education_catalog_1 = require("../education-catalog");
const phone_number_1 = require("../../common/utils/phone-number");
const student_profile_entity_1 = require("../../database/entities/student-profile.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const onboarding_1 = require("../onboarding");
let StudentAdministrationService = class StudentAdministrationService {
    students;
    profiles;
    classes;
    enrollments;
    users;
    attendanceRecords;
    memberships;
    relationships;
    issues;
    recoveries;
    learningItems;
    retryRequests;
    authorization;
    legacy;
    dataSource;
    catalog;
    constructor(students, profiles, classes, enrollments, users, attendanceRecords, memberships, relationships, issues, recoveries, learningItems, retryRequests, authorization, legacy, dataSource, catalog) {
        this.students = students;
        this.profiles = profiles;
        this.classes = classes;
        this.enrollments = enrollments;
        this.users = users;
        this.attendanceRecords = attendanceRecords;
        this.memberships = memberships;
        this.relationships = relationships;
        this.issues = issues;
        this.recoveries = recoveries;
        this.learningItems = learningItems;
        this.retryRequests = retryRequests;
        this.authorization = authorization;
        this.legacy = legacy;
        this.dataSource = dataSource;
        this.catalog = catalog;
    }
    context(user) {
        return {
            ...user,
            roles: user.roles ?? [user.role],
            capabilities: user.capabilities ?? [],
            membershipIds: user.membershipIds ?? [],
            organizationIds: user.organizationIds ?? [],
        };
    }
    async list(user, organizationId) {
        const context = this.context(user);
        const schoolWide = context.roles.includes("PLATFORM_ADMIN") ||
            [
                "ORGANIZATION_ADMIN",
                "PRINCIPAL",
                "SCHOOL_SUPERVISOR",
                "DISCIPLINARIAN",
                "RELIGIOUS_EDUCATION_MANAGER",
                "GOVERNMENT_EDUCATION_MANAGER",
            ].some((role) => context.roles.includes(role));
        if (schoolWide) {
            const allowedOrganizationIds = context.roles.includes("PLATFORM_ADMIN")
                ? organizationId
                    ? [organizationId]
                    : undefined
                : organizationId
                    ? context.organizationIds.filter((id) => id === organizationId)
                    : context.organizationIds;
            if (allowedOrganizationIds && !allowedOrganizationIds.length)
                return [];
            const rows = await this.students.find({
                where: allowedOrganizationIds?.length
                    ? { organization: { id: (0, typeorm_2.In)(allowedOrganizationIds) } }
                    : undefined,
                relations: { user: true, organization: true, profile: true, enrollments: { classroom: true } },
                order: { createdAt: "DESC" },
            });
            return rows.map((student) => this.project(student));
        }
        const links = await this.relationships.find({
            where: { fromUser: { id: user.id }, status: user_relationship_entity_1.RelationshipStatus.ACTIVE },
            relations: { toStudent: { user: true, organization: true } },
        });
        const own = context.roles.includes("STUDENT")
            ? await this.students.find({
                where: { user: { id: user.id } },
                relations: { user: true, organization: true, profile: true, enrollments: { classroom: true } },
            })
            : [];
        const linked = links.map((link) => link.toStudent);
        const unique = new Map([...own, ...linked].map((student) => [student.id, student]));
        const allowed = [];
        for (const student of unique.values())
            if ((!organizationId || student.organization?.id === organizationId) &&
                await this.authorization.canAccessStudent(context, student.id, "students.read"))
                allowed.push(this.project(student));
        return allowed;
    }
    async get(user, id, capability = "students.read") {
        if (!(await this.authorization.canAccessStudent(this.context(user), id, capability)))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
        const student = await this.students.findOne({
            where: { id },
            relations: { user: true, organization: true, profile: true, enrollments: { classroom: true } },
        });
        if (!student)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
        return this.project(student);
    }
    async profile(user, id) {
        await this.get(user, id, "students.read");
        const student = await this.students.findOne({
            where: { id },
            relations: { user: true, organization: true },
        });
        if (!student) {
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
        }
        const records = await this.attendanceRecords.find({
            where: { student: { id } },
            relations: { session: { organization: true } },
            order: { createdAt: "DESC" },
            take: 10,
        });
        const summary = {
            totalSessions: records.length,
            present: 0,
            absent: 0,
            late: 0,
            excused: 0,
        };
        for (const record of records) {
            if (record.status === "present")
                summary.present += 1;
            if (record.status === "absent")
                summary.absent += 1;
            if (record.status === "late")
                summary.late += 1;
            if (record.status === "excused")
                summary.excused += 1;
        }
        return {
            ...this.project(student),
            identity: {
                firstName: student.user?.firstName ?? "",
                lastName: student.user?.lastName ?? "",
                fullName: student.name,
                nationalCode: student.nationalCode ?? null,
                phoneNumber: student.user?.phoneNumber ?? null,
                email: student.user?.email ?? null,
                profilePhoto: student.user?.chatAvatarUrl ?? "",
            },
            contact: {
                phoneNumber: student.user?.phoneNumber ?? null,
                email: student.user?.email ?? null,
            },
            education: {
                learnerProfile: student.learnerProfile,
                independentType: student.independentType ?? null,
                learningLevel: student.learningLevel,
                gradeId: student.gradeId ?? null,
                educationTypeId: student.educationTypeId,
                trackId: student.trackId,
                grade: student.grade,
                major: student.major,
                targetUniversity: student.targetUniversity,
                targetField: student.targetField,
                targetRank: student.targetRank,
                dailyCapacity: student.dailyCapacity,
            },
            attendanceSummary: summary,
            recentAttendance: records.map((record) => ({
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
    async updateProfile(user, id, dto) {
        await this.get(user, id, "students.update");
        const student = await this.students.findOne({
            where: { id },
            relations: { user: true },
        });
        if (!student) {
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
        }
        const change = await this.legacy.update(id, {
            ...(dto.name ? { name: dto.name } : {}),
            ...(dto.learnerProfile ? { learnerProfile: dto.learnerProfile } : {}),
            ...(dto.independentType ? { independentType: dto.independentType } : {}),
            ...(dto.learningLevel !== undefined
                ? { learningLevel: dto.learningLevel }
                : {}),
            ...(dto.gradeId !== undefined ? { gradeId: dto.gradeId } : {}),
            ...(dto.educationTypeId !== undefined
                ? { educationTypeId: dto.educationTypeId }
                : {}),
            ...(dto.trackId !== undefined ? { trackId: dto.trackId } : {}),
            ...(dto.grade !== undefined ? { grade: dto.grade } : {}),
            ...(dto.major !== undefined ? { major: dto.major } : {}),
            ...(dto.targetUniversity !== undefined
                ? { targetUniversity: dto.targetUniversity }
                : {}),
            ...(dto.targetField !== undefined
                ? { targetField: dto.targetField }
                : {}),
            ...(dto.targetRank !== undefined ? { targetRank: dto.targetRank } : {}),
            ...(dto.dailyCapacity !== undefined
                ? { dailyCapacity: dto.dailyCapacity }
                : {}),
        });
        if (student.user && dto.phoneNumber) {
            const normalized = (0, phone_number_1.normalizeIranianMobile)(dto.phoneNumber);
            await this.users.update(student.user.id, {
                phoneNumber: normalized,
                username: normalized,
            });
        }
        if (student.user && (dto.name || dto.phoneNumber)) {
            const merged = {
                ...(dto.name ? { firstName: dto.name.split(" ")[0] ?? "" } : {}),
                ...(dto.name
                    ? { lastName: dto.name.split(" ").slice(1).join(" ") ?? "" }
                    : {}),
            };
            if (Object.keys(merged).length) {
                await this.users.update(student.user.id, merged);
            }
        }
        return this.profile(user, id);
    }
    async create(actor, dto) {
        const context = this.context(actor);
        this.authorization.requireCapability(context, "students.create");
        if (!context.roles.includes("PLATFORM_ADMIN") &&
            (!dto.organizationId ||
                !context.organizationIds.includes(dto.organizationId)))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        const profile = dto.learnerProfile ?? "school";
        if (profile === "independent" && !dto.independentType)
            throw new api_exception_1.ApiException(422, "INDEPENDENT_TYPE_REQUIRED", "نوع یادگیرنده مستقل را انتخاب کنید.");
        const education = profile === "school"
            ? this.catalog.validateSelection(dto.gradeId, dto.educationTypeId, dto.trackId)
            : null;
        return this.dataSource.transaction(async (manager) => {
            const phoneNumber = (0, phone_number_1.normalizeIranianMobile)(dto.phoneNumber);
            const username = phoneNumber;
            const [firstName = "", ...lastNameParts] = dto.name.trim().split(/\s+/);
            if (await manager.findOne(user_entity_1.User, { where: { phoneNumber } }))
                throw new api_exception_1.ApiException(409, "PHONE_NUMBER_EXISTS", "شماره همراه تکراری است.");
            const user = await manager.save(user_entity_1.User, manager.create(user_entity_1.User, {
                username,
                phoneNumber,
                passwordHash: await bcryptjs_1.default.hash(dto.password, 12),
                firstName,
                lastName: lastNameParts.join(" "),
                role: user_entity_1.UserRole.STUDENT,
                status: user_entity_1.UserStatus.ACTIVE,
            }));
            const organization = dto.organizationId
                ? await manager.findOne(organization_entity_1.Organization, {
                    where: { id: dto.organizationId },
                })
                : null;
            if (dto.organizationId && !organization)
                throw new api_exception_1.ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
            const student = await manager.save(student_entity_1.Student, manager.create(student_entity_1.Student, {
                user,
                organization,
                name: dto.name,
                learnerProfile: profile,
                independentType: profile === "independent" ? dto.independentType : null,
                learningLevel: profile === "independent" ? dto.learningLevel?.trim() || "" : "",
                gradeId: education?.gradeId ?? null,
                educationTypeId: education?.educationTypeId ?? "independent",
                trackId: education?.trackId ?? "independent",
                grade: education?.gradeLabel ?? "",
                major: education?.trackLabel ?? "",
                targetUniversity: dto.targetUniversity?.trim() || "",
                targetField: dto.targetField?.trim() || "",
                targetRank: dto.targetRank?.trim() || "",
                dailyCapacity: dto.dailyCapacity?.trim() || "",
                accountStatus: "active",
            }));
            const role = await manager.findOneByOrFail(role_entity_1.Role, { code: "STUDENT" });
            const membership = organization
                ? await manager.save(organization_membership_entity_1.OrganizationMembership, manager.create(organization_membership_entity_1.OrganizationMembership, {
                    user,
                    organization,
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                }))
                : null;
            await manager.save(user_role_assignment_entity_1.UserRoleAssignment, manager.create(user_role_assignment_entity_1.UserRoleAssignment, {
                user,
                role,
                membership: role.organizationScoped ? membership : null,
            }));
            await this.syncSchoolProfile(manager, student, organization, dto);
            await this.syncGuardians(manager, student, organization, dto);
            return this.project(student);
        });
    }
    async update(actor, id, dto) {
        await this.get(actor, id, "students.update");
        const existing = await this.students.findOneByOrFail({ id });
        const profile = dto.learnerProfile ?? existing.learnerProfile;
        const independentType = dto.independentType ?? existing.independentType ?? undefined;
        const hasEducationUpdate = dto.gradeId !== undefined ||
            dto.educationTypeId !== undefined ||
            dto.trackId !== undefined;
        if (profile === "school" &&
            hasEducationUpdate &&
            (!dto.gradeId || !dto.educationTypeId)) {
            throw new api_exception_1.ApiException(422, "INVALID_EDUCATION_SELECTION", "پایه و نوع آموزش باید با هم ارسال شوند.");
        }
        if (profile === "independent" && !independentType)
            throw new api_exception_1.ApiException(422, "INDEPENDENT_TYPE_REQUIRED", "نوع یادگیرنده مستقل را انتخاب کنید.");
        const education = profile === "school" && hasEducationUpdate
            ? this.catalog.validateSelection(dto.gradeId, dto.educationTypeId, dto.trackId)
            : null;
        const updated = await this.dataSource.transaction(async (manager) => {
            const student = await manager.findOneOrFail(student_entity_1.Student, {
                where: { id },
                relations: { user: true, organization: true },
            });
            const { phoneNumber: requestedPhoneNumber, ...studentFields } = dto;
            const requestedStudentName = dto.name?.trim();
            const studentUpdate = {
                ...studentFields,
                ...(requestedStudentName ? { name: requestedStudentName } : {}),
                ...(education
                    ? {
                        gradeId: education.gradeId,
                        educationTypeId: education.educationTypeId,
                        trackId: education.trackId,
                        grade: education.gradeLabel,
                        major: education.trackLabel,
                    }
                    : {}),
                ...(profile === "independent"
                    ? {
                        learnerProfile: profile,
                        independentType,
                        learningLevel: dto.learningLevel?.trim() ?? existing.learningLevel ?? "",
                        gradeId: null,
                        educationTypeId: "independent",
                        trackId: "independent",
                        grade: "",
                        major: "",
                    }
                    : {
                        learnerProfile: "school",
                        independentType: null,
                        learningLevel: "",
                    }),
            };
            manager.merge(student_entity_1.Student, student, studentUpdate);
            if (student.user &&
                (requestedPhoneNumber !== undefined || requestedStudentName)) {
                const phoneNumber = requestedPhoneNumber !== undefined
                    ? (0, phone_number_1.normalizeIranianMobile)(requestedPhoneNumber)
                    : student.user.phoneNumber;
                if (phoneNumber) {
                    const duplicate = await manager.findOne(user_entity_1.User, {
                        where: { phoneNumber },
                    });
                    if (duplicate && duplicate.id !== student.user.id) {
                        throw new api_exception_1.ApiException(409, "PHONE_NUMBER_EXISTS", "شماره همراه تکراری است.");
                    }
                }
                const [firstName = "", ...lastNameParts] = (requestedStudentName ?? student.name)
                    .trim()
                    .split(/\s+/);
                manager.merge(user_entity_1.User, student.user, {
                    ...(phoneNumber ? { phoneNumber, username: phoneNumber } : {}),
                    firstName,
                    lastName: lastNameParts.join(" "),
                });
                await manager.save(user_entity_1.User, student.user);
            }
            const saved = await manager.save(student_entity_1.Student, student);
            await this.syncSchoolProfile(manager, saved, student.organization ?? null, dto);
            await this.syncGuardians(manager, saved, student.organization ?? null, dto);
            return saved;
        });
        return this.project({ ...updated, user: updated.user ?? undefined });
    }
    async lifecycle(actor, id, action) {
        await this.get(actor, id, "students.update");
        return this.legacy.lifecycle(id, action);
    }
    async remove(actor, id) {
        await this.get(actor, id, "students.archive");
        return this.legacy.remove(id);
    }
    async resetPassword(actor, id, password) {
        await this.get(actor, id, "students.update");
        return this.legacy.resetPassword(id, password);
    }
    async learning(actor, id) {
        await this.get(actor, id, "learning.read");
        return this.legacy.learningForStudent(id);
    }
    async createLearning(actor, id, dto) {
        await this.get(actor, id, "learning.create");
        return this.legacy.createLearningItem(id, dto);
    }
    async updateLearning(actor, id, itemId, dto) {
        await this.get(actor, id, "learning.update");
        return this.legacy.updateLearningItem(id, itemId, dto);
    }
    async deleteLearning(actor, id, itemId) {
        await this.get(actor, id, "learning.update");
        return this.legacy.deleteLearningItem(id, itemId);
    }
    async reviewLearning(actor, id, itemId, rating) {
        await this.get(actor, id, "learning.review");
        return this.legacy.reviewLearningItem(id, itemId, rating);
    }
    async learningHistory(actor, id, itemId) {
        await this.get(actor, id, "learning.read");
        return this.legacy.learningReviewHistory(id, itemId);
    }
    async weekly(actor, id) {
        await this.get(actor, id, "student.progress.read");
        return this.legacy.weeklyForStudent(id);
    }
    async topics(actor, id, limit = 8) {
        await this.get(actor, id, "student.progress.read");
        return this.legacy.topicsForStudent(id, limit);
    }
    async advisorInbox(actor, id) {
        await this.get(actor, id, "students.read");
        const today = new Date().toISOString().slice(0, 10);
        const [issues, recoveryRequests, reviews, examRetryRequests] = await Promise.all([
            this.issues.find({
                where: { student: { id } },
                relations: { task: true },
                order: { createdAt: "DESC" },
                take: 50,
            }),
            this.recoveries.find({
                where: { student: { id } },
                order: { createdAt: "DESC" },
                take: 50,
            }),
            this.learningItems.find({
                where: { student: { id }, status: learning_item_entity_1.LearningStatus.PENDING },
                order: { dueDate: "ASC" },
                take: 50,
            }),
            this.retryRequests.find({
                where: { student: { id }, status: exam_retry_request_entity_1.RetryRequestStatus.PENDING },
                relations: { exam: true },
                order: { createdAt: "DESC" },
                take: 50,
            }),
        ]);
        return {
            issues: issues.map((x) => ({
                ...x,
                status: x.status.toLowerCase(),
                studentId: id,
                taskId: x.task?.id,
                issueType: x.type,
                note: x.description,
            })),
            recoveryRequests,
            reviews: reviews.filter((x) => x.dueDate <= today),
            missedTasks: [],
            examRetryRequests: examRetryRequests.map((x) => ({
                ...x,
                examTitle: x.exam?.title,
            })),
        };
    }
    async updateTaskIssue(actor, id, dto) {
        const issue = await this.issues.findOne({
            where: { id },
            relations: { student: true },
        });
        if (!issue)
            throw new api_exception_1.ApiException(404, "TASK_ISSUE_NOT_FOUND", "گزارش مشکل پیدا نشد.");
        await this.get(actor, issue.student.id, "tasks.update");
        issue.status = dto.status.toUpperCase();
        if (dto.advisorNote !== undefined)
            issue.advisorNote = dto.advisorNote.trim();
        return this.issues.save(issue);
    }
    jalaliToDate(value) {
        const match = value.trim().match(/^(1[34]\d\d)[/-](\d{1,2})[/-](\d{1,2})$/);
        if (!match)
            throw new api_exception_1.ApiException(422, "INVALID_BIRTH_DATE", "تاریخ تولد شمسی نامعتبر است.");
        const jy = Number(match[1]), jm = Number(match[2]), jd = Number(match[3]);
        if (jm < 1 || jm > 12 || jd < 1 || jd > 31)
            throw new api_exception_1.ApiException(422, "INVALID_BIRTH_DATE", "تاریخ تولد شمسی نامعتبر است.");
        const jDayNo = 365 * (jy - 979) + Math.floor((jy - 979) / 33) * 8 + Math.floor(((jy - 979) % 33 + 3) / 4) + (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186) + jd - 1;
        let gDayNo = jDayNo + 79;
        let gy = 1600 + 400 * Math.floor(gDayNo / 146097);
        gDayNo %= 146097;
        let leap = true;
        if (gDayNo >= 36525) {
            gDayNo--;
            gy += 100 * Math.floor(gDayNo / 36524);
            gDayNo %= 36524;
            if (gDayNo >= 365)
                gDayNo++;
            else
                leap = false;
        }
        gy += 4 * Math.floor(gDayNo / 1461);
        gDayNo %= 1461;
        if (gDayNo >= 366) {
            leap = false;
            gDayNo--;
            gy += Math.floor(gDayNo / 365);
            gDayNo %= 365;
        }
        const days = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        let gm = 0;
        while (gDayNo >= days[gm])
            gDayNo -= days[gm++];
        return new Date(Date.UTC(gy, gm, gDayNo + 1));
    }
    async syncSchoolProfile(manager, student, organization, dto) {
        if (dto.nationalCode !== undefined) {
            const nationalCode = (0, onboarding_1.normalizeNationalCode)(dto.nationalCode);
            if (!(0, onboarding_1.isValidIranianNationalCode)(nationalCode))
                throw new api_exception_1.ApiException(422, "INVALID_NATIONAL_CODE", "کد ملی معتبر نیست.");
            const duplicate = await manager.findOne(student_entity_1.Student, { where: { nationalCode } });
            if (duplicate && duplicate.id !== student.id)
                throw new api_exception_1.ApiException(409, "NATIONAL_CODE_EXISTS", "برای این کد ملی پرونده دانش‌آموزی وجود دارد.");
            student.nationalCode = nationalCode;
            await manager.save(student_entity_1.Student, student);
        }
        if (dto.birthDateJalali !== undefined || dto.governmentSchool !== undefined) {
            let profile = await manager.findOne(student_profile_entity_1.StudentProfile, { where: { student: { id: student.id } } });
            profile ??= manager.create(student_profile_entity_1.StudentProfile, { student });
            if (dto.birthDateJalali !== undefined)
                profile.birthDate = this.jalaliToDate(dto.birthDateJalali);
            if (dto.governmentSchool !== undefined)
                profile.previousSchool = dto.governmentSchool.trim() || null;
            await manager.save(student_profile_entity_1.StudentProfile, profile);
        }
        if (dto.classId !== undefined || ("clearClass" in dto && dto.clearClass)) {
            if (!organization)
                throw new api_exception_1.ApiException(422, "ORGANIZATION_REQUIRED", "برای ثبت کلاس، سازمان دانش‌آموز الزامی است.");
            if ("clearClass" in dto && dto.clearClass)
                await manager.delete(education_class_enrollment_entity_1.EducationClassEnrollment, { student: { id: student.id } });
            if (dto.classId) {
                const classroom = await manager.findOne(education_class_entity_1.EducationClass, { where: { id: dto.classId }, relations: { organization: true, enrollments: true } });
                if (!classroom || classroom.organization.id !== organization.id)
                    throw new api_exception_1.ApiException(404, "CLASS_NOT_FOUND", "کلاس در سازمان دانش‌آموز یافت نشد.");
                if (classroom.status !== "ACTIVE")
                    throw new api_exception_1.ApiException(422, "CLASS_INACTIVE", "کلاس انتخاب‌شده فعال نیست.");
                const existing = await manager.findOne(education_class_enrollment_entity_1.EducationClassEnrollment, { where: { classroom: { id: classroom.id }, student: { id: student.id } } });
                if (!existing) {
                    if (classroom.enrollments.length >= classroom.capacity)
                        throw new api_exception_1.ApiException(422, "CLASS_CAPACITY_EXCEEDED", "ظرفیت کلاس تکمیل است.");
                    await manager.delete(education_class_enrollment_entity_1.EducationClassEnrollment, { student: { id: student.id } });
                    await manager.save(education_class_enrollment_entity_1.EducationClassEnrollment, manager.create(education_class_enrollment_entity_1.EducationClassEnrollment, { classroom, student }));
                }
            }
        }
        const [profile, enrollment] = await Promise.all([
            manager.findOne(student_profile_entity_1.StudentProfile, { where: { student: { id: student.id } } }),
            manager.findOne(education_class_enrollment_entity_1.EducationClassEnrollment, { where: { student: { id: student.id } } }),
        ]);
        const complete = Boolean(student.nationalCode &&
            profile?.birthDate &&
            profile.previousSchool?.trim() &&
            enrollment);
        student.registrationStatus = complete ? "ACTIVE" : "ACCOUNT_CREATED";
        await manager.save(student_entity_1.Student, student);
    }
    async syncGuardians(manager, student, organization, dto) {
        const requested = [dto.mother, dto.father].filter(Boolean);
        if (!requested.length)
            return;
        if (!organization)
            throw new api_exception_1.ApiException(422, "ORGANIZATION_REQUIRED", "برای ثبت سرپرست، سازمان دانش‌آموز الزامی است.");
        const guardianRole = await manager.findOneByOrFail(role_entity_1.Role, { code: "GUARDIAN" });
        for (const input of requested) {
            const phoneNumber = (0, phone_number_1.normalizeIranianMobile)(input.phoneNumber);
            let guardian = await manager.findOne(user_entity_1.User, { where: { phoneNumber } });
            if (!guardian)
                guardian = await manager.save(user_entity_1.User, manager.create(user_entity_1.User, { username: phoneNumber, phoneNumber, passwordHash: await bcryptjs_1.default.hash(input.password, 12), firstName: "", lastName: "", role: user_entity_1.UserRole.GUARDIAN, status: user_entity_1.UserStatus.ACTIVE }));
            let membership = await manager.findOne(organization_membership_entity_1.OrganizationMembership, { where: { user: { id: guardian.id }, organization: { id: organization.id } } });
            if (!membership)
                membership = await manager.save(organization_membership_entity_1.OrganizationMembership, manager.create(organization_membership_entity_1.OrganizationMembership, { user: guardian, organization, status: organization_membership_entity_1.MembershipStatus.ACTIVE }));
            else if (membership.status !== organization_membership_entity_1.MembershipStatus.ACTIVE) {
                membership.status = organization_membership_entity_1.MembershipStatus.ACTIVE;
                membership = await manager.save(organization_membership_entity_1.OrganizationMembership, membership);
            }
            const assignment = await manager.findOne(user_role_assignment_entity_1.UserRoleAssignment, { where: { user: { id: guardian.id }, role: { id: guardianRole.id }, ...(guardianRole.organizationScoped ? { membership: { id: membership.id } } : {}) } });
            if (!assignment)
                await manager.save(user_role_assignment_entity_1.UserRoleAssignment, manager.create(user_role_assignment_entity_1.UserRoleAssignment, { user: guardian, role: guardianRole, membership: guardianRole.organizationScoped ? membership : null }));
            let relationship = await manager.findOne(user_relationship_entity_1.UserRelationship, { where: { fromUser: { id: guardian.id }, toStudent: { id: student.id }, organization: { id: organization.id }, type: "GUARDIAN_OF" } });
            relationship ??= manager.create(user_relationship_entity_1.UserRelationship, { fromUser: guardian, toStudent: student, organization, type: "GUARDIAN_OF" });
            relationship.status = user_relationship_entity_1.RelationshipStatus.ACTIVE;
            relationship.acceptedAt = new Date();
            await manager.save(user_relationship_entity_1.UserRelationship, relationship);
        }
    }
    project(student) {
        return {
            id: student.id,
            name: student.name,
            gradeId: student.gradeId,
            learnerProfile: student.learnerProfile,
            independentType: student.independentType,
            learningLevel: student.learningLevel,
            educationTypeId: student.educationTypeId,
            trackId: student.trackId,
            grade: student.grade,
            major: student.major,
            targetUniversity: student.targetUniversity,
            targetField: student.targetField,
            targetRank: student.targetRank,
            dailyCapacity: student.dailyCapacity,
            nationalCode: student.nationalCode ?? null,
            birthDate: student.profile?.birthDate?.toISOString() ?? null,
            governmentSchool: student.profile?.previousSchool ?? null,
            classId: student.enrollments?.[0]?.classroom.id ?? null,
            className: student.enrollments?.[0]?.classroom.name ?? null,
            accountStatus: student.accountStatus,
            registrationStatus: student.registrationStatus,
            profileComplete: student.registrationStatus === "ACTIVE",
            organization: student.organization
                ? { id: student.organization.id, name: student.organization.name }
                : null,
            phoneNumber: student.user?.phoneNumber ?? null,
            user: student.user
                ? {
                    id: student.user.id,
                    username: student.user.username,
                    phoneNumber: student.user.phoneNumber ?? null,
                    status: student.user.status,
                }
                : null,
            createdAt: student.createdAt,
            updatedAt: student.updatedAt,
        };
    }
};
exports.StudentAdministrationService = StudentAdministrationService;
exports.StudentAdministrationService = StudentAdministrationService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(1, (0, typeorm_1.InjectRepository)(student_profile_entity_1.StudentProfile)),
    __param(2, (0, typeorm_1.InjectRepository)(education_class_entity_1.EducationClass)),
    __param(3, (0, typeorm_1.InjectRepository)(education_class_enrollment_entity_1.EducationClassEnrollment)),
    __param(4, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(5, (0, typeorm_1.InjectRepository)(attendance_record_entity_1.AttendanceRecord)),
    __param(6, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(7, (0, typeorm_1.InjectRepository)(user_relationship_entity_1.UserRelationship)),
    __param(8, (0, typeorm_1.InjectRepository)(task_issue_entity_1.TaskIssue)),
    __param(9, (0, typeorm_1.InjectRepository)(recovery_request_entity_1.RecoveryRequest)),
    __param(10, (0, typeorm_1.InjectRepository)(learning_item_entity_1.LearningItem)),
    __param(11, (0, typeorm_1.InjectRepository)(exam_retry_request_entity_1.ExamRetryRequest)),
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
        authorization_1.AuthorizationService,
        students_service_1.StudentsService,
        typeorm_2.DataSource,
        education_catalog_1.EducationCatalogService])
], StudentAdministrationService);
//# sourceMappingURL=student-administration.service.js.map