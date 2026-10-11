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
exports.UsersService = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const cmb_identity_1 = require("@moshaver/cmb-identity");
const cmb_tenancy_1 = require("@moshaver/cmb-tenancy");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const role_entity_1 = require("../../database/entities/role.entity");
const session_entity_1 = require("../../database/entities/session.entity");
const user_role_assignment_entity_1 = require("../../database/entities/user-role-assignment.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const chat_1 = require("../chat");
const phone_number_1 = require("../../common/utils/phone-number");
const organizations_1 = require("../organizations");
let UsersService = class UsersService {
    users;
    assignments;
    sessions;
    dataSource;
    tenancy = new cmb_tenancy_1.TenancyPolicy();
    constructor(users, assignments, sessions, dataSource) {
        this.users = users;
        this.assignments = assignments;
        this.sessions = sessions;
        this.dataSource = dataSource;
    }
    platform(actor) {
        return this.tenancy.isPlatformActor(actor);
    }
    assertOrg(actor, organizationId) {
        if (!this.tenancy.canAccessOrganization(actor, organizationId))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
    }
    async assertRoles(actor, roles) {
        if (!this.tenancy.canAssignRoles(actor, roles))
            throw new api_exception_1.ApiException(403, "ROLE_ESCALATION", "تخصیص این نقش مجاز نیست.");
        (0, organizations_1.assertRoleCodesAssignableByActor)(actor, roles);
        if (roles.includes("PLATFORM_ADMIN"))
            await this.requirePlatformOwner(actor);
    }
    async requirePlatformOwner(actor, manager) {
        if (!this.platform(actor))
            throw new api_exception_1.ApiException(403, "PLATFORM_OWNER_REQUIRED", "فقط مالک پلتفرم می‌تواند این عملیات را انجام دهد.");
        const repository = manager ? manager.getRepository(user_entity_1.User) : this.users;
        const owner = await repository.findOne({
            where: { id: actor.id, isPlatformOwner: true, status: user_entity_1.UserStatus.ACTIVE },
        });
        if (!owner)
            throw new api_exception_1.ApiException(403, "PLATFORM_OWNER_REQUIRED", "فقط مالک فعال پلتفرم می‌تواند این عملیات را انجام دهد.");
        return owner;
    }
    assertProtectedAccount(actor, target) {
        if (target.id === actor.id)
            throw new api_exception_1.ApiException(400, "SELF_ACCOUNT_PROTECTED", "برای حفظ امکان ورود، نمی‌توانید حساب خودتان را غیرفعال، بایگانی یا تغییر نقش دهید.");
        if (target.isPlatformOwner)
            throw new api_exception_1.ApiException(400, "PLATFORM_OWNER_PROTECTED", "ابتدا مالکیت پلتفرم را واگذار کنید؛ حساب مالک قابل غیرفعال‌سازی، بایگانی یا تغییر نقش نیست.");
    }
    async ensureActiveMembership(manager, user, organizationId) {
        const organization = await manager.findOne(organization_entity_1.Organization, {
            where: { id: organizationId },
        });
        if (!organization)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "سازمان یافت نشد.");
        let membership = await manager.findOne(organization_membership_entity_1.OrganizationMembership, {
            where: {
                user: { id: user.id },
                organization: { id: organization.id },
            },
            relations: { organization: true },
        });
        if (membership) {
            membership.status = organization_membership_entity_1.MembershipStatus.ACTIVE;
            membership = await manager.save(organization_membership_entity_1.OrganizationMembership, membership);
        }
        else {
            membership = await manager.save(organization_membership_entity_1.OrganizationMembership, manager.create(organization_membership_entity_1.OrganizationMembership, {
                user,
                organization,
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
            }));
        }
        return membership;
    }
    async list(actor, organizationId, roleCode, status) {
        const scopedOrganizationId = organizationId ??
            (!this.platform(actor) ? actor.organizationIds?.[0] : undefined);
        if (scopedOrganizationId)
            this.assertOrg(actor, scopedOrganizationId);
        const rows = await this.assignments.find({
            where: {
                ...(roleCode ? { role: { code: roleCode } } : {}),
                ...(scopedOrganizationId
                    ? {
                        membership: {
                            organization: { id: scopedOrganizationId },
                            status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                        },
                    }
                    : {}),
            },
            relations: {
                user: true,
                role: { permissions: { permission: true } },
                membership: { organization: true },
            },
        });
        const users = [
            ...new Map(rows
                .filter((row) => !status || row.user.status === status)
                .map((row) => [row.user.id, row.user])).values(),
        ];
        return users.map((user) => this.project(user, rows.filter((row) => row.user.id === user.id)));
    }
    async get(actor, id) {
        const rows = await this.assignments.find({
            where: { user: { id } },
            relations: {
                user: true,
                role: { permissions: { permission: true } },
                membership: { organization: true },
            },
        });
        if (!rows.length)
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "کاربر یافت نشد.");
        if (!this.platform(actor) &&
            !rows.some((row) => row.membership &&
                actor.organizationIds?.includes(row.membership.organization.id)))
            throw new api_exception_1.ApiException(404, "NOT_FOUND", "کاربر یافت نشد.");
        return this.project(rows[0].user, rows);
    }
    async create(actor, dto) {
        await this.assertRoles(actor, dto.roleCodes);
        (0, organizations_1.assertPlatformRolesAreUnscoped)(dto.roleCodes, dto.organizationId);
        if (dto.organizationId)
            this.assertOrg(actor, dto.organizationId);
        if (!this.platform(actor) && !dto.organizationId)
            throw new api_exception_1.ApiException(400, "ORGANIZATION_REQUIRED", "سازمان الزامی است.");
        return this.dataSource.transaction(async (manager) => {
            const phoneNumber = (0, phone_number_1.normalizeIranianMobile)(dto.phoneNumber);
            if (await manager.findOne(user_entity_1.User, { where: { phoneNumber } }))
                throw new api_exception_1.ApiException(409, "PHONE_NUMBER_EXISTS", "شماره همراه تکراری است.");
            const user = await manager.save(user_entity_1.User, manager.create(user_entity_1.User, {
                username: phoneNumber,
                phoneNumber,
                passwordHash: await bcryptjs_1.default.hash(dto.password, 12),
                firstName: dto.firstName ?? "",
                lastName: dto.lastName ?? "",
                status: user_entity_1.UserStatus.ACTIVE,
                role: dto.roleCodes.includes("PLATFORM_ADMIN")
                    ? user_entity_1.UserRole.PLATFORM_ADMIN
                    : dto.roleCodes.includes("STUDENT")
                        ? user_entity_1.UserRole.STUDENT
                        : user_entity_1.UserRole.ADMIN,
            }));
            let membership = null;
            if (dto.organizationId)
                membership = await this.ensureActiveMembership(manager, user, dto.organizationId);
            if (membership)
                (0, organizations_1.assertRoleCodesCompatibleWithOrganization)(membership.organization.type, dto.roleCodes);
            const roles = await manager.find(role_entity_1.Role, {
                where: { code: (0, typeorm_2.In)((0, cmb_identity_1.uniqueValues)(dto.roleCodes)) },
            });
            if (roles.length !== new Set(dto.roleCodes).size)
                throw new api_exception_1.ApiException(400, "INVALID_ROLE", "نقش نامعتبر است.");
            for (const role of roles) {
                if (role.organizationScoped && !membership)
                    throw new api_exception_1.ApiException(400, "ORGANIZATION_REQUIRED", "نقش سازمانی به عضویت نیاز دارد.");
                await manager.save(user_role_assignment_entity_1.UserRoleAssignment, manager.create(user_role_assignment_entity_1.UserRoleAssignment, {
                    user,
                    role,
                    membership: role.organizationScoped ? membership : null,
                }));
            }
            if (membership)
                await (0, chat_1.ensureOrganizationChat)(manager, membership.organization, user);
            return {
                id: user.id,
                phoneNumber: user.phoneNumber,
                roles: roles.map((role) => role.code),
            };
        });
    }
    async update(actor, id, dto) {
        await this.get(actor, id);
        const patch = { ...dto };
        if (patch.phoneNumber) {
            patch.phoneNumber = (0, phone_number_1.normalizeIranianMobile)(patch.phoneNumber);
            const duplicate = await this.users.findOne({
                where: { phoneNumber: patch.phoneNumber },
            });
            if (duplicate && duplicate.id !== id)
                throw new api_exception_1.ApiException(409, "PHONE_NUMBER_EXISTS", "شماره همراه تکراری است.");
        }
        await this.users.update(id, patch);
        return this.get(actor, id);
    }
    async setActive(actor, id, active) {
        const target = await this.get(actor, id);
        this.assertProtectedAccount(actor, target);
        await this.users.update(id, {
            status: active ? user_entity_1.UserStatus.ACTIVE : user_entity_1.UserStatus.DISABLED,
        });
        if (!active)
            await this.sessions.delete({ user: { id } });
        return {
            userId: id,
            status: active ? user_entity_1.UserStatus.ACTIVE : user_entity_1.UserStatus.DISABLED,
        };
    }
    async setRoles(actor, id, dto) {
        await this.assertRoles(actor, dto.roleCodes);
        (0, organizations_1.assertPlatformRolesAreUnscoped)(dto.roleCodes, dto.organizationId);
        if (dto.organizationId)
            this.assertOrg(actor, dto.organizationId);
        const target = await this.get(actor, id);
        this.assertProtectedAccount(actor, target);
        return this.dataSource.transaction(async (manager) => {
            const user = await manager.findOneByOrFail(user_entity_1.User, { id });
            const roles = await manager.find(role_entity_1.Role, {
                where: { code: (0, typeorm_2.In)(dto.roleCodes) },
            });
            if (roles.length !== new Set(dto.roleCodes).size)
                throw new api_exception_1.ApiException(400, "INVALID_ROLE", "نقش نامعتبر است.");
            let membership = null;
            if (dto.organizationId)
                membership = await this.ensureActiveMembership(manager, user, dto.organizationId);
            if (membership)
                (0, organizations_1.assertRoleCodesCompatibleWithOrganization)(membership.organization.type, dto.roleCodes);
            if (roles.some((role) => role.organizationScoped) && !membership)
                throw new api_exception_1.ApiException(400, "ORGANIZATION_REQUIRED", "نقش سازمانی به عضویت نیاز دارد.");
            if (dto.organizationId)
                await manager.delete(user_role_assignment_entity_1.UserRoleAssignment, {
                    user: { id },
                    membership: { id: membership.id },
                });
            else
                await manager.delete(user_role_assignment_entity_1.UserRoleAssignment, {
                    user: { id },
                    membership: (0, typeorm_2.IsNull)(),
                });
            for (const role of roles)
                await manager.save(user_role_assignment_entity_1.UserRoleAssignment, manager.create(user_role_assignment_entity_1.UserRoleAssignment, {
                    user,
                    role,
                    membership: role.organizationScoped ? membership : null,
                }));
            if (membership)
                await (0, chat_1.ensureOrganizationChat)(manager, membership.organization, user);
            return {
                userId: id,
                roles: roles.map((role) => role.code),
                organizationId: dto.organizationId ?? null,
            };
        });
    }
    async archive(actor, id) {
        if (!this.platform(actor))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "فقط مدیر پلتفرم می‌تواند حساب را بایگانی کند.");
        const target = await this.get(actor, id);
        this.assertProtectedAccount(actor, target);
        await this.users.update(id, { status: user_entity_1.UserStatus.ARCHIVED });
        await this.sessions.delete({ user: { id } });
        return { userId: id, status: user_entity_1.UserStatus.ARCHIVED };
    }
    async transferPlatformOwnership(actor, targetUserId) {
        return this.dataSource.transaction(async (manager) => {
            const currentOwner = await this.requirePlatformOwner(actor, manager);
            if (targetUserId === currentOwner.id)
                throw new api_exception_1.ApiException(400, "OWNERSHIP_TARGET_INVALID", "حساب فعلی از قبل مالک پلتفرم است.");
            const target = await manager.findOne(user_entity_1.User, {
                where: { id: targetUserId, status: user_entity_1.UserStatus.ACTIVE },
            });
            if (!target)
                throw new api_exception_1.ApiException(404, "NOT_FOUND", "مدیر فعال انتخاب‌شده پیدا نشد.");
            const assignment = await manager.findOne(user_role_assignment_entity_1.UserRoleAssignment, {
                where: {
                    user: { id: target.id },
                    role: { code: "PLATFORM_ADMIN" },
                    membership: (0, typeorm_2.IsNull)(),
                },
            });
            if (!assignment)
                throw new api_exception_1.ApiException(400, "TARGET_NOT_PLATFORM_ADMIN", "برای واگذاری مالکیت، ابتدا این حساب را مدیر پلتفرم کنید.");
            await manager.update(user_entity_1.User, { id: currentOwner.id }, { isPlatformOwner: false });
            await manager.update(user_entity_1.User, { id: target.id }, { isPlatformOwner: true });
            return {
                previousOwnerId: currentOwner.id,
                ownerId: target.id,
                username: target.username,
            };
        });
    }
    async capabilities(actor, id) {
        const user = await this.get(actor, id);
        return { userId: id, capabilities: (0, cmb_identity_1.projectCapabilities)(user.assignments) };
    }
    project(user, rows) {
        return {
            id: user.id,
            username: user.username,
            phoneNumber: user.phoneNumber,
            firstName: user.firstName,
            lastName: user.lastName,
            status: user.status,
            isPlatformOwner: user.isPlatformOwner,
            assignments: rows.map((row) => ({
                role: row.role.code,
                organizationId: row.membership?.organization.id ?? null,
                capabilities: row.role.permissions?.map((rp) => rp.permission.code) ?? [],
            })),
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(user_role_assignment_entity_1.UserRoleAssignment)),
    __param(2, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], UsersService);
//# sourceMappingURL=users.service.js.map