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
exports.RelationshipsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_entity_1 = require("../../database/entities/organization.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const authorization_1 = require("../authorization");
const notifications_1 = require("../notifications");
let RelationshipsService = class RelationshipsService {
    relationships;
    users;
    students;
    organizations;
    memberships;
    assignments;
    notifications;
    constructor(relationships, users, students, organizations, memberships, assignments, notifications) {
        this.relationships = relationships;
        this.users = users;
        this.students = students;
        this.organizations = organizations;
        this.memberships = memberships;
        this.assignments = assignments;
        this.notifications = notifications;
    }
    platform(user) {
        return user.roles?.includes("PLATFORM_ADMIN");
    }
    canManage(user, organizationId) {
        return (this.platform(user) ||
            Boolean(organizationId &&
                user.organizationIds?.includes(organizationId) &&
                (user.capabilities?.includes("organization.members.manage") ||
                    user.capabilities?.includes("relationships.manage"))));
    }
    async list(user) {
        const canManageOrganizations = (user.capabilities?.includes("organization.members.manage") ||
            user.capabilities?.includes("relationships.manage")) &&
            user.organizationIds?.length;
        const where = this.platform(user)
            ? {}
            : canManageOrganizations
                ? { organization: { id: (0, typeorm_2.In)(user.organizationIds) } }
                : {
                    fromUser: { id: user.id },
                    organization: user.organizationIds?.length
                        ? { id: (0, typeorm_2.In)(user.organizationIds) }
                        : (0, typeorm_2.IsNull)(),
                };
        return this.relationships
            .find({
            where,
            relations: { fromUser: true, toStudent: true, organization: true },
            order: { createdAt: "DESC" },
        })
            .then((items) => items.map(this.project));
    }
    async get(user, id) {
        const item = await this.relationships.findOne({
            where: { id },
            relations: { fromUser: true, toStudent: true, organization: true },
        });
        if (!item)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "رابطه یافت نشد.");
        if ((item.fromUser.id !== user.id ||
            !this.inWorkScope(user, item.organization?.id)) &&
            !this.canManage(user, item.organization?.id))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "رابطه یافت نشد.");
        return this.project(item);
    }
    async create(user, dto) {
        if (!this.canManage(user, dto.organizationId))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "ایجاد این رابطه مجاز نیست.");
        const [fromUser, student, organization, sourceMembership] = await Promise.all([
            this.users.findOne({ where: { id: dto.fromUserId } }),
            this.students.findOne({
                where: { id: dto.toStudentId },
                relations: { organization: true, user: true },
            }),
            dto.organizationId
                ? this.organizations.findOne({ where: { id: dto.organizationId } })
                : Promise.resolve(null),
            dto.organizationId
                ? this.memberships.findOne({
                    where: {
                        user: { id: dto.fromUserId },
                        organization: { id: dto.organizationId },
                        status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                    },
                })
                : Promise.resolve(null),
        ]);
        if (!fromUser || !student || (dto.organizationId && !organization))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "کاربر، دانش‌آموز یا سازمان یافت نشد.");
        if (dto.organizationId && !sourceMembership)
            throw new api_exception_1.ApiException(403, "USER_NOT_IN_ORGANIZATION", "کاربر انتخاب‌شده عضو فعال این سازمان نیست.");
        await this.assertEligible({
            fromUser,
            toStudent: student,
            organization,
            type: dto.type,
        });
        const existing = await this.relationships.findOne({
            where: {
                fromUser: { id: dto.fromUserId },
                toStudent: { id: dto.toStudentId },
                organization: dto.organizationId
                    ? { id: dto.organizationId }
                    : (0, typeorm_2.IsNull)(),
                type: dto.type,
            },
        });
        if (existing &&
            ![user_relationship_entity_1.RelationshipStatus.REJECTED, user_relationship_entity_1.RelationshipStatus.REVOKED].includes(existing.status))
            throw new api_exception_1.ApiException(409, "RELATIONSHIP_EXISTS", "این رابطه از قبل وجود دارد.");
        const item = existing ??
            this.relationships.create({
                fromUser,
                toStudent: student,
                organization,
                type: dto.type,
            });
        item.status = user_relationship_entity_1.RelationshipStatus.PENDING;
        item.acceptedAt = null;
        item.revokedAt = null;
        return this.relationships.save(item).then(this.project);
    }
    async update(user, id, dto) {
        const item = await this.relationships.findOne({
            where: { id },
            relations: {
                fromUser: true,
                toStudent: { user: true, organization: true },
                organization: true,
            },
        });
        if (!item)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "رابطه یافت نشد.");
        const selfDecision = item.fromUser.id === user.id &&
            this.inWorkScope(user, item.organization?.id) &&
            item.status === user_relationship_entity_1.RelationshipStatus.PENDING &&
            [user_relationship_entity_1.RelationshipStatus.ACTIVE, user_relationship_entity_1.RelationshipStatus.REJECTED].includes(dto.status);
        if (!selfDecision && !this.canManage(user, item.organization?.id))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "تغییر این رابطه مجاز نیست.");
        if (dto.status === user_relationship_entity_1.RelationshipStatus.ACTIVE)
            await this.assertEligible(item);
        const previousStatus = item.status;
        item.status = dto.status;
        item.acceptedAt =
            dto.status === user_relationship_entity_1.RelationshipStatus.ACTIVE ? new Date() : item.acceptedAt;
        item.revokedAt =
            dto.status === user_relationship_entity_1.RelationshipStatus.REVOKED ? new Date() : null;
        if (item.type === user_relationship_entity_1.RelationshipType.GUARDIAN_OF &&
            previousStatus !== user_relationship_entity_1.RelationshipStatus.ACTIVE &&
            dto.status === user_relationship_entity_1.RelationshipStatus.ACTIVE) {
            item.toStudent.guardianChangedAt = new Date();
            await this.students.save(item.toStudent);
        }
        return this.relationships.save(item).then(this.project);
    }
    remove(user, id) {
        return this.update(user, id, { status: user_relationship_entity_1.RelationshipStatus.REVOKED });
    }
    async forStudent(user, studentId) {
        const self = await this.students.findOne({
            where: { id: studentId, user: { id: user.id } },
        });
        const targetStudent = await this.students.findOne({
            where: { id: studentId },
            relations: { organization: true },
        });
        const links = await this.relationships.find({
            where: {
                fromUser: { id: user.id },
                toStudent: { id: studentId },
                status: user_relationship_entity_1.RelationshipStatus.ACTIVE,
            },
            relations: {
                fromUser: true,
                toStudent: { user: true, organization: true },
                organization: true,
            },
        });
        let linked = false;
        for (const link of links) {
            if ((0, authorization_1.relationshipTypesForRoles)(user.roles ?? []).includes(link.type) &&
                (!link.organization ||
                    user.organizationIds?.includes(link.organization.id)) &&
                (await this.isEligible(link)))
                linked = true;
        }
        const allowed = Boolean(self) ||
            this.platform(user) ||
            Boolean(targetStudent?.organization?.id &&
                this.canManage(user, targetStudent.organization.id)) ||
            linked;
        if (!allowed)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز یافت نشد.");
        return this.relationships
            .find({
            where: {
                toStudent: { id: studentId },
                status: user_relationship_entity_1.RelationshipStatus.ACTIVE,
            },
            relations: { fromUser: true, organization: true },
        })
            .then((items) => items.map(this.project));
    }
    async myStudents(user) {
        const own = user.roles?.includes("STUDENT")
            ? await this.students.find({ where: { user: { id: user.id } } })
            : [];
        const links = await this.relationships.find({
            where: { fromUser: { id: user.id }, status: user_relationship_entity_1.RelationshipStatus.ACTIVE },
            relations: {
                fromUser: true,
                toStudent: { user: true, organization: true },
                organization: true,
            },
        });
        const eligibleLinks = [];
        for (const link of links)
            if ((0, authorization_1.relationshipTypesForRoles)(user.roles ?? []).includes(link.type) &&
                (!link.organization ||
                    user.organizationIds?.includes(link.organization.id)) &&
                (await this.isEligible(link)))
                eligibleLinks.push(link);
        return [
            ...own.map((student) => ({
                student: { id: student.id, name: student.name },
                relationship: { type: "SELF", status: "ACTIVE" },
            })),
            ...eligibleLinks.map((link) => ({
                student: { id: link.toStudent.id, name: link.toStudent.name },
                relationship: {
                    id: link.id,
                    type: link.type,
                    status: link.status,
                    organizationId: link.organization?.id ?? null,
                },
            })),
        ];
    }
    async guardianSelection(user) {
        const student = await this.selfStudent(user);
        const rows = await this.relationships.find({
            where: {
                toStudent: { id: student.id },
                type: user_relationship_entity_1.RelationshipType.GUARDIAN_OF,
            },
            relations: { fromUser: true, toStudent: true, organization: true },
            order: { createdAt: "DESC" },
        });
        const nextAllowedAt = student.guardianChangedAt
            ? new Date(student.guardianChangedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
            : null;
        return {
            relationships: rows
                .filter((row) => row.status !== user_relationship_entity_1.RelationshipStatus.REVOKED)
                .map(this.project),
            change: {
                allowed: !nextAllowedAt || nextAllowedAt.getTime() <= Date.now(),
                nextAllowedAt,
            },
        };
    }
    async guardianCandidates(user, search = "") {
        const student = await this.selfStudent(user);
        const memberships = await this.memberships.find({
            where: {
                user: { id: user.id },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            },
            relations: { organization: true },
        });
        const organizationIds = memberships.map((item) => item.organization.id);
        if (!organizationIds.length)
            return [];
        const rows = await this.assignments.find({
            where: {
                role: { code: "GUARDIAN" },
                membership: {
                    organization: { id: (0, typeorm_2.In)(organizationIds) },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                },
            },
            relations: { user: true, membership: { organization: true } },
        });
        const query = search.trim().toLowerCase();
        return [
            ...new Map(rows
                .filter((row) => row.user.id !== student.user?.id &&
                (!query ||
                    `${row.user.username} ${row.user.firstName} ${row.user.lastName}`
                        .toLowerCase()
                        .includes(query)))
                .map((row) => [
                row.user.id,
                {
                    id: row.user.id,
                    username: row.user.username,
                    name: [row.user.firstName, row.user.lastName]
                        .filter(Boolean)
                        .join(" ") || row.user.username,
                    organization: row.membership?.organization
                        ? {
                            id: row.membership.organization.id,
                            name: row.membership.organization.name,
                        }
                        : null,
                },
            ])).values(),
        ].slice(0, 20);
    }
    async requestGuardian(user, guardianUserId) {
        const student = await this.selfStudent(user);
        const selection = await this.guardianSelection(user);
        if (!selection.change.allowed)
            throw new api_exception_1.ApiException(429, "GUARDIAN_CHANGE_COOLDOWN", "تغییر سرپرست تا ۳۰ روز پس از آخرین تأیید ممکن نیست.");
        const candidates = await this.guardianCandidates(user, "");
        const guardian = candidates.find((item) => item.id === guardianUserId);
        if (!guardian)
            throw new api_exception_1.ApiException(404, "GUARDIAN_NOT_AVAILABLE", "سرپرست قابل انتخاب نیست.");
        const account = await this.users.findOneByOrFail({ id: guardianUserId });
        const organization = guardian.organization
            ? await this.organizations.findOneByOrFail({
                id: guardian.organization.id,
            })
            : null;
        let item = await this.relationships.findOne({
            where: {
                fromUser: { id: guardianUserId },
                toStudent: { id: student.id },
                organization: organization ? { id: organization.id } : undefined,
                type: user_relationship_entity_1.RelationshipType.GUARDIAN_OF,
            },
        });
        if (item &&
            ![user_relationship_entity_1.RelationshipStatus.REJECTED, user_relationship_entity_1.RelationshipStatus.REVOKED].includes(item.status))
            throw new api_exception_1.ApiException(409, "RELATIONSHIP_EXISTS", "درخواست این سرپرست از قبل ثبت شده است.");
        item ??= this.relationships.create({
            fromUser: account,
            toStudent: student,
            organization,
            type: user_relationship_entity_1.RelationshipType.GUARDIAN_OF,
        });
        item.status = user_relationship_entity_1.RelationshipStatus.PENDING;
        item.acceptedAt = null;
        item.revokedAt = null;
        const saved = await this.relationships.save(item);
        const advisors = await this.relationships.find({
            where: {
                toStudent: { id: student.id },
                type: user_relationship_entity_1.RelationshipType.ADVISOR_OF,
                status: user_relationship_entity_1.RelationshipStatus.ACTIVE,
            },
            relations: { fromUser: true },
        });
        await this.notifications.createForUsers([guardianUserId, ...advisors.map((row) => row.fromUser.id)], {
            type: "GUARDIAN_SELECTION",
            category: "relationships",
            title: "درخواست انتخاب سرپرست",
            body: `${student.name} درخواست انتخاب سرپرست ثبت کرد.`,
            url: "/admin/access",
            data: { studentId: student.id, relationshipId: saved.id },
        });
        return this.project(Object.assign(saved, {
            fromUser: account,
            toStudent: student,
            organization,
        }));
    }
    async cancelGuardianRequest(user, id) {
        const student = await this.selfStudent(user);
        const item = await this.relationships.findOne({
            where: {
                id,
                toStudent: { id: student.id },
                type: user_relationship_entity_1.RelationshipType.GUARDIAN_OF,
                status: user_relationship_entity_1.RelationshipStatus.PENDING,
            },
        });
        if (!item)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "درخواست سرپرست پیدا نشد.");
        item.status = user_relationship_entity_1.RelationshipStatus.REVOKED;
        item.revokedAt = new Date();
        await this.relationships.save(item);
        return { id, cancelled: true };
    }
    async allowGuardianChange(user, studentId) {
        if (!this.platform(user))
            throw new api_exception_1.ApiException(403, "PLATFORM_ADMIN_REQUIRED", "فقط مدیر پلتفرم می‌تواند محدودیت تغییر سرپرست را بردارد.");
        const student = await this.students.findOneBy({ id: studentId });
        if (!student)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز پیدا نشد.");
        student.guardianChangedAt = null;
        await this.students.save(student);
        return { studentId, guardianChangeAllowed: true };
    }
    inWorkScope(user, organizationId) {
        return organizationId
            ? Boolean(user.organizationIds?.includes(organizationId))
            : !user.activeOrganizationId;
    }
    async isEligible(item) {
        if (item.fromUser.status !== user_entity_1.UserStatus.ACTIVE)
            return false;
        const organizationId = item.organization?.id;
        if (!organizationId) {
            if (item.toStudent.organization)
                return false;
            return Boolean(await this.assignments.findOne({
                where: {
                    user: { id: item.fromUser.id },
                    role: {
                        code: (0, typeorm_2.In)([...authorization_1.relationshipRoleCodes[item.type]]),
                        organizationScoped: false,
                    },
                    membership: (0, typeorm_2.IsNull)(),
                },
            }));
        }
        if (item.organization?.status !== organization_entity_1.OrganizationStatus.ACTIVE)
            return false;
        if (item.toStudent.organization &&
            item.toStudent.organization.id !== organizationId)
            return false;
        if (!item.toStudent.organization &&
            (!item.toStudent.user ||
                !(await this.memberships.findOne({
                    where: {
                        user: { id: item.toStudent.user.id },
                        organization: { id: organizationId },
                        status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                    },
                }))))
            return false;
        return Boolean(await this.assignments.findOne({
            where: {
                user: { id: item.fromUser.id },
                role: { code: (0, typeorm_2.In)([...authorization_1.relationshipRoleCodes[item.type]]) },
                membership: {
                    user: { id: item.fromUser.id },
                    organization: { id: organizationId },
                    status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                },
            },
        }));
    }
    async assertEligible(item) {
        if (!(await this.isEligible(item)))
            throw new api_exception_1.ApiException(403, "RELATIONSHIP_SCOPE_FORBIDDEN", "کاربر و دانش‌آموز باید در محدوده و نقش معتبر این رابطه باشند.");
    }
    async selfStudent(user) {
        if (!(user.roles || [user.role]).includes("STUDENT"))
            throw new api_exception_1.ApiException(403, "STUDENT_REQUIRED", "این عملیات ویژه دانش‌آموز است.");
        const student = await this.students.findOne({
            where: { user: { id: user.id } },
            relations: { user: true },
        });
        if (!student)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "دانش‌آموز پیدا نشد.");
        return student;
    }
    project(item) {
        return {
            id: item.id,
            type: item.type,
            status: item.status,
            fromUser: {
                id: item.fromUser.id,
                username: item.fromUser.username,
                firstName: item.fromUser.firstName,
                lastName: item.fromUser.lastName,
            },
            student: item.toStudent
                ? { id: item.toStudent.id, name: item.toStudent.name }
                : undefined,
            organizationId: item.organization?.id ?? null,
            createdAt: item.createdAt,
            acceptedAt: item.acceptedAt,
            revokedAt: item.revokedAt,
        };
    }
};
exports.RelationshipsService = RelationshipsService;
exports.RelationshipsService = RelationshipsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_relationship_entity_1.UserRelationship)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(3, (0, typeorm_1.InjectRepository)(organization_entity_1.Organization)),
    __param(4, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(5, (0, typeorm_1.InjectRepository)(user_role_assignment_entity_1.UserRoleAssignment)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        notifications_1.NotificationsService])
], RelationshipsService);
//# sourceMappingURL=relationships.service.js.map