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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OnboardingService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("typeorm");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const role_entity_1 = require("../../database/entities/role.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const conversation_entity_1 = require("../../database/entities/conversation.entity");
const conversation_member_entity_1 = require("../../database/entities/conversation-member.entity");
const conversation_entity_2 = require("../../database/entities/conversation.entity");
const education_catalog_1 = require("../education-catalog");
let OnboardingService = class OnboardingService {
    dataSource;
    catalog;
    constructor(dataSource, catalog) {
        this.dataSource = dataSource;
        this.catalog = catalog;
    }
    async signup(dto) {
        try {
            return await this.dataSource.transaction(async (manager) => {
                const policy = await this.platformSignupPolicy(manager);
                if (!policy.enabled)
                    throw new api_exception_1.ApiException(403, "STUDENT_SIGNUP_DISABLED", "ثبت‌نام مستقیم دانش‌آموز توسط پلتفرم غیرفعال است.");
                const organization = await manager.findOne(organization_entity_1.Organization, {
                    where: { id: dto.organizationId, status: organization_entity_1.OrganizationStatus.ACTIVE },
                });
                if (!organization || !organization.studentSignupEnabled || organization.studentSignupLimit < 1)
                    throw new api_exception_1.ApiException(403, "ORGANIZATION_SIGNUP_DISABLED", "این سازمان ثبت‌نام مستقیم دانش‌آموز را فعال نکرده است.");
                await manager.query(`UPDATE organizations SET studentSignupCount=studentSignupCount+1
           WHERE id=? AND status='ACTIVE' AND studentSignupEnabled=1
             AND studentSignupCount<studentSignupLimit`, [organization.id]);
                const [reservation] = await manager.query(`SELECT changes() AS changes`);
                if (!Number(reservation?.changes))
                    throw new api_exception_1.ApiException(409, "ORGANIZATION_SIGNUP_LIMIT_REACHED", "ظرفیت ثبت‌نام مستقیم این سازمان تکمیل شده است.");
                const phoneNumber = dto.phoneNumber;
                if (await manager.findOne(user_entity_1.User, { where: { phoneNumber } }))
                    throw new api_exception_1.ApiException(409, "PHONE_NUMBER_EXISTS", "برای این شماره همراه قبلاً حساب ساخته شده است.");
                const firstName = dto.firstName.trim();
                const lastName = dto.lastName.trim();
                const user = await manager.save(user_entity_1.User, manager.create(user_entity_1.User, {
                    username: phoneNumber,
                    phoneNumber,
                    firstName,
                    lastName,
                    passwordHash: await bcryptjs_1.default.hash(dto.password, 12),
                    role: user_entity_1.UserRole.STUDENT,
                    status: user_entity_1.UserStatus.ACTIVE,
                }));
                const student = await manager.save(student_entity_1.Student, manager.create(student_entity_1.Student, {
                    user,
                    organization,
                    name: `${firstName} ${lastName}`.trim(),
                    nationalCode: null,
                    gradeId: null,
                    grade: "",
                    educationTypeId: "general",
                    trackId: "general",
                    major: "",
                    targetUniversity: "",
                    targetField: "",
                    targetRank: "",
                    dailyCapacity: "",
                    accountStatus: "active",
                    onboardingStatus: "PENDING_ASSIGNMENT",
                    registrationStatus: "ACCOUNT_CREATED",
                }));
                const role = await manager.findOneByOrFail(role_entity_1.Role, { code: "STUDENT" });
                const membership = await manager.save(organization_membership_entity_1.OrganizationMembership, manager.create(organization_membership_entity_1.OrganizationMembership, {
                    organization,
                    user,
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                }));
                await manager.save(user_role_assignment_entity_1.UserRoleAssignment, manager.create(user_role_assignment_entity_1.UserRoleAssignment, { user, role, membership: role.organizationScoped ? membership : null }));
                return {
                    id: student.id,
                    phoneNumber,
                    name: student.name,
                    registrationStatus: student.registrationStatus,
                    organization: { id: organization.id, name: organization.name },
                };
            });
        }
        catch (error) {
            throw error;
        }
    }
    async publicSignupOptions() {
        const policy = await this.platformSignupPolicy(this.dataSource.manager);
        if (!policy.enabled)
            return { enabled: false, organizations: [] };
        const organizations = await this.dataSource.getRepository(organization_entity_1.Organization).find({
            where: { status: organization_entity_1.OrganizationStatus.ACTIVE, studentSignupEnabled: true },
            order: { name: "ASC" },
        });
        return {
            enabled: true,
            organizations: organizations
                .filter((organization) => organization.studentSignupLimit > organization.studentSignupCount)
                .map((organization) => ({ id: organization.id, name: organization.name, type: organization.type, remaining: organization.studentSignupLimit - organization.studentSignupCount })),
        };
    }
    async setPlatformSignupPolicy(user, enabled) {
        if (!(user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN"))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند ثبت‌نام مستقیم را کنترل کند.");
        await this.dataSource.query(`UPDATE platform_enrollment_settings SET publicStudentSignupEnabled=?, updatedAt=datetime('now') WHERE id=1`, [enabled ? 1 : 0]);
        return this.publicSignupOptions();
    }
    async getPlatformSignupPolicy(user) {
        if (!(user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN"))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند تنظیمات سراسری ثبت‌نام را ببیند.");
        return this.platformSignupPolicy(this.dataSource.manager);
    }
    async setOrganizationSignupPolicy(user, organizationId, dto) {
        const platform = Boolean(user.roles?.includes("PLATFORM_ADMIN") || user.role === "PLATFORM_ADMIN");
        if (!platform && !user.organizationIds?.includes(organizationId))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        const organization = await this.dataSource.getRepository(organization_entity_1.Organization).findOneBy({ id: organizationId });
        if (!organization)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
        if (!platform && !organization.studentSignupManagedByOrganization)
            throw new api_exception_1.ApiException(403, "SIGNUP_POLICY_DELEGATION_REQUIRED", "مدیر پلتفرم هنوز مدیریت ثبت‌نام دانش‌آموز را به این سازمان واگذار نکرده است.");
        if (!platform && dto.managedByOrganization !== undefined)
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "تنها مدیر پلتفرم می‌تواند واگذاری مدیریت ثبت‌نام را تغییر دهد.");
        if (dto.managedByOrganization !== undefined)
            organization.studentSignupManagedByOrganization = dto.managedByOrganization;
        if (dto.enabled !== undefined)
            organization.studentSignupEnabled = dto.enabled;
        if (dto.limit !== undefined)
            organization.studentSignupLimit = dto.limit;
        await this.dataSource.getRepository(organization_entity_1.Organization).save(organization);
        return {
            id: organization.id,
            managedByOrganization: organization.studentSignupManagedByOrganization,
            enabled: organization.studentSignupEnabled,
            limit: organization.studentSignupLimit,
            used: organization.studentSignupCount,
        };
    }
    async platformSignupPolicy(manager) {
        const [row] = await manager.query(`SELECT publicStudentSignupEnabled enabled FROM platform_enrollment_settings WHERE id=1`);
        return { enabled: Boolean(row?.enabled) };
    }
    async platformBootstrapStatus() {
        const owner = await this.dataSource.getRepository(user_entity_1.User).findOne({ where: { isPlatformOwner: true } });
        return { setupRequired: !owner };
    }
    async bootstrapPlatformAdmin(dto) {
        const phoneNumber = dto.phoneNumber;
        const username = phoneNumber;
        const email = dto.email.trim().toLowerCase();
        return this.dataSource.transaction(async (manager) => {
            const assignments = manager.getRepository(user_role_assignment_entity_1.UserRoleAssignment);
            if (await manager.findOne(user_entity_1.User, { where: { isPlatformOwner: true } })) {
                throw new api_exception_1.ApiException(409, "PLATFORM_ALREADY_BOOTSTRAPPED", "مدیر پلتفرم قبلاً ایجاد شده است.");
            }
            const users = manager.getRepository(user_entity_1.User);
            if (await users.findOne({ where: [{ phoneNumber }, { email }] })) {
                throw new api_exception_1.ApiException(409, "ACCOUNT_EXISTS", "شماره همراه یا ایمیل قبلاً استفاده شده است.");
            }
            const role = await manager.findOne(role_entity_1.Role, { where: { code: "PLATFORM_ADMIN" } });
            if (!role)
                throw new api_exception_1.ApiException(503, "PLATFORM_BOOTSTRAP_UNAVAILABLE", "راه‌اندازی پایگاه داده کامل نشده است.");
            const user = await manager.save(user_entity_1.User, manager.create(user_entity_1.User, {
                username,
                phoneNumber,
                email,
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                passwordHash: await bcryptjs_1.default.hash(dto.password, 12),
                role: user_entity_1.UserRole.PLATFORM_ADMIN,
                status: user_entity_1.UserStatus.ACTIVE,
                isPlatformOwner: true,
            }));
            await manager.save(user_role_assignment_entity_1.UserRoleAssignment, assignments.create({ user, role, membership: null }));
            return { id: user.id, phoneNumber: user.phoneNumber, email: user.email, firstName: user.firstName, lastName: user.lastName };
        });
    }
    async pending() {
        const rows = await this.dataSource.getRepository(student_entity_1.Student).find({ where: { onboardingStatus: "PENDING_ASSIGNMENT" }, relations: { user: true }, order: { createdAt: "ASC" } });
        return rows.map((student) => ({ id: student.id, name: student.name, nationalCode: student.nationalCode, grade: student.grade, major: student.major, username: student.user?.username, createdAt: student.createdAt }));
    }
    async assign(studentId, dto) {
        return this.dataSource.transaction(async (manager) => {
            const choice = dto.mode === "AUTO" ? await this.automaticAssignment(manager) : { organizationId: dto.organizationId, advisorUserId: dto.advisorUserId };
            const [student, organization, advisor, advisorRole, advisorMembership] = await Promise.all([
                manager.findOne(student_entity_1.Student, { where: { id: studentId }, relations: { user: true } }),
                manager.findOne(organization_entity_1.Organization, { where: { id: choice.organizationId, status: organization_entity_1.OrganizationStatus.ACTIVE } }),
                manager.findOne(user_entity_1.User, { where: { id: choice.advisorUserId, status: user_entity_1.UserStatus.ACTIVE } }),
                manager.findOne(user_role_assignment_entity_1.UserRoleAssignment, { where: { user: { id: choice.advisorUserId }, role: { code: "ADVISOR" }, membership: { organization: { id: choice.organizationId }, status: organization_membership_entity_1.MembershipStatus.ACTIVE } }, relations: { role: true, user: true, membership: { organization: true } } }),
                manager.findOne(organization_membership_entity_1.OrganizationMembership, { where: { user: { id: choice.advisorUserId }, organization: { id: choice.organizationId }, status: organization_membership_entity_1.MembershipStatus.ACTIVE } }),
            ]);
            if (!student?.user || !organization)
                throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یا سازمان پیدا نشد.");
            const studentUser = student.user;
            if (!advisor || !advisorRole || !advisorMembership)
                throw new api_exception_1.ApiException(400, "INVALID_ADVISOR", "مشاور باید عضو فعال سازمان انتخاب‌شده باشد.");
            let membership = await manager.findOne(organization_membership_entity_1.OrganizationMembership, { where: { organization: { id: organization.id }, user: { id: studentUser.id } } });
            membership = await manager.save(organization_membership_entity_1.OrganizationMembership, membership ? Object.assign(membership, { status: organization_membership_entity_1.MembershipStatus.ACTIVE }) : manager.create(organization_membership_entity_1.OrganizationMembership, { organization, user: studentUser, status: organization_membership_entity_1.MembershipStatus.ACTIVE }));
            let relationship = await manager.findOne(user_relationship_entity_1.UserRelationship, { where: { fromUser: { id: advisor.id }, toStudent: { id: student.id }, organization: { id: organization.id }, type: user_relationship_entity_1.RelationshipType.ADVISOR_OF } });
            relationship = await manager.save(user_relationship_entity_1.UserRelationship, relationship ? Object.assign(relationship, { status: user_relationship_entity_1.RelationshipStatus.ACTIVE, acceptedAt: new Date(), revokedAt: null }) : manager.create(user_relationship_entity_1.UserRelationship, { fromUser: advisor, toStudent: student, organization, type: user_relationship_entity_1.RelationshipType.ADVISOR_OF, status: user_relationship_entity_1.RelationshipStatus.ACTIVE, acceptedAt: new Date() }));
            const advisorConversations = await manager.find(conversation_member_entity_1.ConversationMember, { where: { user: { id: advisor.id } }, relations: { conversation: { members: { user: true } } } });
            let conversation = advisorConversations.find((item) => item.conversation.type === conversation_entity_2.ConversationType.DIRECT && !item.leftAt && item.conversation.members.some((member) => member.user.id === studentUser.id && !member.leftAt))?.conversation;
            if (!conversation) {
                conversation = await manager.save(conversation_entity_1.Conversation, manager.create(conversation_entity_1.Conversation, { type: conversation_entity_2.ConversationType.DIRECT, title: "", owner: advisor }));
                await manager.save(conversation_member_entity_1.ConversationMember, [manager.create(conversation_member_entity_1.ConversationMember, { conversation, user: advisor }), manager.create(conversation_member_entity_1.ConversationMember, { conversation, user: studentUser })]);
            }
            student.onboardingStatus = "ASSIGNED";
            await manager.save(student_entity_1.Student, student);
            return { studentId: student.id, organization: { id: organization.id, name: organization.name }, advisor: { id: advisor.id, username: advisor.username, firstName: advisor.firstName, lastName: advisor.lastName }, membershipId: membership.id, relationshipId: relationship.id, conversationId: conversation.id, onboardingStatus: student.onboardingStatus };
        });
    }
    async automaticAssignment(manager) {
        const assignments = await manager.find(user_role_assignment_entity_1.UserRoleAssignment, {
            where: { role: { code: "ADVISOR" }, membership: { status: organization_membership_entity_1.MembershipStatus.ACTIVE, organization: { status: organization_entity_1.OrganizationStatus.ACTIVE } }, user: { status: user_entity_1.UserStatus.ACTIVE } },
            relations: { role: true, user: true, membership: { organization: true } },
        });
        if (!assignments.length)
            throw new api_exception_1.ApiException(409, "NO_ELIGIBLE_ADVISOR", "هیچ مشاور فعالی در سازمان‌های فعال وجود ندارد. ابتدا یک مشاور به سازمان اضافه کنید.");
        const activeRelationships = await manager.find(user_relationship_entity_1.UserRelationship, { where: { type: user_relationship_entity_1.RelationshipType.ADVISOR_OF, status: user_relationship_entity_1.RelationshipStatus.ACTIVE }, relations: { fromUser: true, organization: true } });
        const load = new Map();
        for (const relationship of activeRelationships)
            load.set(`${relationship.organization?.id}:${relationship.fromUser.id}`, (load.get(`${relationship.organization?.id}:${relationship.fromUser.id}`) || 0) + 1);
        const selected = [...assignments].sort((left, right) => {
            const leftKey = `${left.membership?.organization.id}:${left.user.id}`;
            const rightKey = `${right.membership?.organization.id}:${right.user.id}`;
            return (load.get(leftKey) || 0) - (load.get(rightKey) || 0) || left.membership.organization.name.localeCompare(right.membership.organization.name, "fa") || left.user.username.localeCompare(right.user.username);
        })[0];
        return { organizationId: selected.membership.organization.id, advisorUserId: selected.user.id };
    }
};
exports.OnboardingService = OnboardingService;
exports.OnboardingService = OnboardingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [typeorm_1.DataSource, education_catalog_1.EducationCatalogService])
], OnboardingService);
//# sourceMappingURL=onboarding.service.js.map