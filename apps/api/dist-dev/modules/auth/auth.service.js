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
exports.AuthService = void 0;
const cmb_auth_1 = require("@moshaver/cmb-auth");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const api_exception_1 = require("../../common/exceptions/api.exception");
const session_entity_1 = require("../../database/entities/session.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_2 = require("../../database/entities/user.entity");
const authorization_1 = require("../authorization");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const organization_entity_1 = require("../../database/entities/organization.entity");
const organization_entity_2 = require("../../database/entities/organization.entity");
const account_change_request_entity_1 = require("../../database/entities/account-change-request.entity");
const login_throttle_service_1 = require("./login-throttle.service");
const phone_number_1 = require("../../common/utils/phone-number");
let AuthService = class AuthService {
    users;
    sessions;
    students;
    config;
    memberships;
    authorization;
    throttle;
    organizations;
    accountChangeRequests;
    credentials;
    constructor(users, sessions, students, config, memberships, authorization, throttle, organizations, accountChangeRequests) {
        this.users = users;
        this.sessions = sessions;
        this.students = students;
        this.config = config;
        this.memberships = memberships;
        this.authorization = authorization;
        this.throttle = throttle;
        this.organizations = organizations;
        this.accountChangeRequests = accountChangeRequests;
        this.credentials = new cmb_auth_1.SessionCredentialService({
            accessTokenTtlMinutes: this.config.get("accessTokenTtlMinutes", 15),
            refreshTokenTtlDays: this.config.get("refreshTokenTtlDays", 30),
        });
    }
    async checkPhone(phoneNumber, ip = "unknown") {
        const normalized = (0, phone_number_1.normalizeIranianMobile)(phoneNumber);
        if (!(0, phone_number_1.isIranianMobile)(normalized))
            throw new api_exception_1.ApiException(422, "INVALID_PHONE_NUMBER", "شماره همراه معتبر نیست.");
        const lookupKey = `phone-lookup:${ip}`;
        await this.throttle?.assertAllowed(lookupKey, lookupKey);
        await this.throttle?.failure(lookupKey, lookupKey);
        const exists = await this.users.existsBy({ phoneNumber: normalized });
        return { exists };
    }
    async login(phoneNumber, password, ip = "unknown") {
        const normalizedPhoneNumber = (0, phone_number_1.normalizeIranianMobile)(phoneNumber);
        if (!(0, phone_number_1.isIranianMobile)(normalizedPhoneNumber))
            throw new api_exception_1.ApiException(422, "INVALID_PHONE_NUMBER", "شماره همراه معتبر نیست.");
        await this.throttle?.assertAllowed(ip, normalizedPhoneNumber);
        const user = await this.users.findOne({
            where: { phoneNumber: normalizedPhoneNumber },
            select: { id: true, username: true, phoneNumber: true, role: true, status: true, passwordHash: true },
        });
        if (!user || !(await bcryptjs_1.default.compare(password, user.passwordHash))) {
            await this.throttle?.failure(ip, normalizedPhoneNumber);
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "رمز عبور نادرست است.");
        }
        if (user.status && user.status !== user_entity_2.UserStatus.ACTIVE)
            throw new api_exception_1.ApiException(403, "ACCOUNT_INACTIVE", "حساب کاربری غیرفعال یا بایگانی شده است.");
        if (!(await this.hasUsableWorkContext(user)))
            throw new api_exception_1.ApiException(403, "ACCOUNT_INACTIVE", "هیچ زمینه کاری فعال و معتبر برای این حساب وجود ندارد.");
        const credentials = this.newCredentials();
        const session = await this.sessions.save(this.sessions.create({
            user,
            tokenHash: this.credentials.hash(credentials.accessToken),
            refreshTokenHash: this.credentials.hash(credentials.refreshToken),
            csrfToken: credentials.csrfToken,
            expiresAt: credentials.expiresAt,
            refreshExpiresAt: credentials.refreshExpiresAt,
        }));
        await this.throttle?.success(ip, normalizedPhoneNumber);
        const now = new Date();
        await this.sessions.delete([
            { refreshExpiresAt: (0, typeorm_2.LessThan)(now) },
            { refreshExpiresAt: (0, typeorm_2.IsNull)(), expiresAt: (0, typeorm_2.LessThan)(now) },
        ]);
        return { ...credentials, session, user };
    }
    async refresh(refreshToken, csrfToken) {
        if (!refreshToken || !csrfToken)
            throw new api_exception_1.ApiException(401, "REFRESH_REQUIRED", "نشست شما منقضی شده است. دوباره وارد شوید.");
        const session = await this.sessions.findOne({
            where: { refreshTokenHash: this.credentials.hash(refreshToken) },
            relations: { user: true },
        });
        if (!session ||
            !session.refreshExpiresAt ||
            session.refreshExpiresAt.getTime() <= Date.now()) {
            throw new api_exception_1.ApiException(401, "REFRESH_EXPIRED", "نشست شما منقضی شده است. دوباره وارد شوید.");
        }
        if (!this.credentials.safeEqual(session.csrfToken, csrfToken))
            throw new api_exception_1.ApiException(403, "CSRF", "نشست امنیتی نامعتبر است.");
        if (session.user.status && session.user.status !== user_entity_2.UserStatus.ACTIVE) {
            await this.sessions.delete({ id: session.id });
            throw new api_exception_1.ApiException(403, "ACCOUNT_INACTIVE", "حساب کاربری غیرفعال یا بایگانی شده است.");
        }
        if (!(await this.hasUsableWorkContext(session.user))) {
            await this.sessions.delete({ id: session.id });
            throw new api_exception_1.ApiException(403, "ACCOUNT_INACTIVE", "حساب دانش‌آموز غیرفعال یا بایگانی شده است.");
        }
        const credentials = this.newCredentials();
        const oldRefreshTokenHash = session.refreshTokenHash;
        session.tokenHash = this.credentials.hash(credentials.accessToken);
        session.refreshTokenHash = this.credentials.hash(credentials.refreshToken);
        session.csrfToken = credentials.csrfToken;
        session.expiresAt = credentials.expiresAt;
        session.refreshExpiresAt = credentials.refreshExpiresAt;
        const rotation = await this.sessions.update({ id: session.id, refreshTokenHash: oldRefreshTokenHash }, { tokenHash: session.tokenHash, refreshTokenHash: session.refreshTokenHash,
            csrfToken: session.csrfToken, expiresAt: session.expiresAt, refreshExpiresAt: session.refreshExpiresAt });
        if (rotation.affected !== 1)
            throw new api_exception_1.ApiException(401, "REFRESH_EXPIRED", "نشست شما منقضی شده است. دوباره وارد شوید.");
        return { ...credentials, session, user: session.user };
    }
    async userFromToken(token, requestedRole, requestedOrganizationId) {
        if (!token)
            return null;
        const session = await this.sessions.findOne({
            where: { tokenHash: this.credentials.hash(token) },
            relations: { user: true },
        });
        if (!session || session.expiresAt.getTime() <= Date.now())
            return null;
        if (session.user.status && session.user.status !== user_entity_2.UserStatus.ACTIVE)
            return null;
        if (!(await this.hasUsableWorkContext(session.user))) {
            await this.sessions.delete({ id: session.id });
            return null;
        }
        const base = {
            id: session.user.id,
            username: session.user.username,
            role: session.user.role,
            sessionId: session.id,
        };
        return this.authorization
            ? this.authorization.enrich(base, requestedRole, requestedOrganizationId)
            : {
                ...base,
                roles: [session.user.role],
                capabilities: [],
                membershipIds: [],
                organizationIds: [],
            };
    }
    async logout(token, refreshToken, csrfToken) {
        const where = [
            ...(token ? [{ tokenHash: this.credentials.hash(token) }] : []),
            ...(refreshToken
                ? [{ refreshTokenHash: this.credentials.hash(refreshToken) }]
                : []),
        ];
        if (!where.length)
            return;
        const sessions = await this.sessions.find({ where });
        if (sessions.some((session) => !csrfToken || !this.credentials.safeEqual(session.csrfToken, csrfToken)))
            throw new api_exception_1.ApiException(403, "CSRF", "نشست امنیتی نامعتبر است.");
        for (const session of sessions)
            await this.sessions.delete({ id: session.id, tokenHash: session.tokenHash });
    }
    async me(user) {
        const [session, account] = await Promise.all([
            this.sessions.findOne({ where: { id: user.sessionId } }),
            this.users.findOneBy({ id: user.id }),
        ]);
        return {
            id: user.id,
            username: user.username,
            role: user.role,
            roles: user.roles,
            capabilities: user.capabilities,
            csrfToken: session?.csrfToken,
            phoneNumber: account?.phoneNumber ?? null,
            phoneNumberChangeAvailable: (account?.phoneNumberChangeCount ?? 0) === 0,
        };
    }
    async context(user, activeOrganizationId) {
        const catalog = this.authorization
            ? await this.authorization.enrich(user, undefined, activeOrganizationId)
            : null;
        const organizationIds = catalog?.organizationIds ?? user.organizationIds ?? [];
        const isPlatformAdmin = (catalog?.roles ?? user.roles ?? []).includes("PLATFORM_ADMIN");
        if (activeOrganizationId &&
            !organizationIds.includes(activeOrganizationId) &&
            !isPlatformAdmin)
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
        const account = await this.users.findOne({ where: { id: user.id } });
        if (!this.authorization || !this.memberships)
            throw new api_exception_1.ApiException(503, "CONTEXT_UNAVAILABLE", "اطلاعات دسترسی در دسترس نیست.");
        const memberships = await this.memberships.find({
            where: {
                user: { id: user.id },
                status: organization_membership_entity_1.MembershipStatus.ACTIVE,
                organization: { status: organization_entity_1.OrganizationStatus.ACTIVE },
            },
            relations: { organization: true },
            order: { joinedAt: "ASC", id: "ASC" },
        });
        const membershipsForContext = memberships.map((membership) => ({
            membershipId: membership.id,
            id: membership.organization.id,
            name: membership.organization.name,
            type: membership.organization.type,
        }));
        const selectableOrganizations = isPlatformAdmin
            ? ((await this.organizations?.find({
                where: { status: organization_entity_1.OrganizationStatus.ACTIVE },
                order: { name: "ASC" },
            }))?.map((organization) => ({
                membershipId: membershipsForContext.find((item) => item.id === organization.id)
                    ?.membershipId ?? "",
                id: organization.id,
                name: organization.name,
                type: organization.type,
            })) ?? [])
            : membershipsForContext;
        if (activeOrganizationId &&
            !selectableOrganizations.some((item) => item.id === activeOrganizationId))
            throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "سازمان فعال پیدا نشد.");
        const effectiveOrganizationId = activeOrganizationId ??
            (isPlatformAdmin
                ? undefined
                : (catalog?.activeOrganizationId ?? selectableOrganizations[0]?.id));
        const assignments = await this.authorization.enrich(user, undefined, effectiveOrganizationId);
        const workContexts = await Promise.all(assignments.roles.map(async (role) => {
            const scoped = await this.authorization.enrich(user, role, effectiveOrganizationId);
            return { role, capabilities: scoped.capabilities };
        }));
        return {
            user: {
                id: account.id,
                username: account.username,
                firstName: account.firstName,
                lastName: account.lastName,
                status: account.status,
                isPlatformOwner: account.isPlatformOwner,
                locale: account.locale,
                timezone: account.timezone,
            },
            roles: assignments.roles,
            capabilities: assignments.capabilities,
            workContexts,
            memberships: membershipsForContext,
            activeOrganization: selectableOrganizations.find((item) => item.id === effectiveOrganizationId) ?? null,
            availableOrganizations: selectableOrganizations,
        };
    }
    async changePassword(user, currentPassword, newPassword) {
        const account = await this.users.findOne({ where: { id: user.id }, select: { id: true, passwordHash: true } });
        if (!account ||
            !(await bcryptjs_1.default.compare(currentPassword, account.passwordHash))) {
            throw new api_exception_1.ApiException(401, "INVALID_CREDENTIALS", "رمز فعلی درست نیست.");
        }
        account.passwordHash = await bcryptjs_1.default.hash(newPassword, 12);
        await this.users.save(account);
        await this.sessions.delete({
            user: { id: user.id },
            id: (0, typeorm_2.Not)(user.sessionId),
        });
        return { changed: true, otherSessionsRevoked: true };
    }
    async changeOwnPhoneNumber(user, phoneNumber) {
        const account = await this.users.findOneBy({ id: user.id });
        if (!account)
            throw new api_exception_1.ApiException(404, "USER_NOT_FOUND", "حساب کاربری پیدا نشد.");
        if (!this.isStudentOrGuardian(user))
            throw new api_exception_1.ApiException(403, "PHONE_CHANGE_REVIEW_REQUIRED", "تغییر شماره این حساب باید توسط مدرسه بررسی شود.");
        if (account.phoneNumberChangeCount > 0)
            throw new api_exception_1.ApiException(409, "PHONE_CHANGE_REQUEST_REQUIRED", "برای تغییر دوباره شماره، درخواست ثبت کنید.");
        const normalized = (0, phone_number_1.normalizeIranianMobile)(phoneNumber);
        if (!(0, phone_number_1.isIranianMobile)(normalized))
            throw new api_exception_1.ApiException(422, "INVALID_PHONE_NUMBER", "شماره همراه معتبر نیست.");
        const existing = await this.users.findOne({
            where: { phoneNumber: normalized },
        });
        if (existing && existing.id !== account.id)
            throw new api_exception_1.ApiException(409, "PHONE_NUMBER_TAKEN", "این شماره همراه قبلاً استفاده شده است.");
        account.phoneNumber = normalized;
        account.username = normalized;
        account.phoneNumberChangeCount += 1;
        await this.users.save(account);
        await this.sessions.delete({
            user: { id: user.id },
            id: (0, typeorm_2.Not)(user.sessionId),
        });
        return {
            phoneNumber: account.phoneNumber,
            changed: true,
            otherSessionsRevoked: true,
            requiresReviewForNextChange: true,
        };
    }
    async createPhoneNumberChangeRequest(user, organizationId, phoneNumber, reason) {
        if (!this.accountChangeRequests || !this.organizations)
            throw new api_exception_1.ApiException(503, "ACCOUNT_CHANGE_UNAVAILABLE", "سامانه درخواست تغییر در دسترس نیست.");
        if (!this.isStudentOrGuardian(user))
            throw new api_exception_1.ApiException(403, "FORBIDDEN", "این درخواست فقط برای دانش‌آموز و سرپرست است.");
        if (!(user.organizationIds ?? []).includes(organizationId))
            throw new api_exception_1.ApiException(403, "ORGANIZATION_FORBIDDEN", "به این مدرسه دسترسی ندارید.");
        const normalized = (0, phone_number_1.normalizeIranianMobile)(phoneNumber);
        if (!(0, phone_number_1.isIranianMobile)(normalized))
            throw new api_exception_1.ApiException(422, "INVALID_PHONE_NUMBER", "شماره همراه معتبر نیست.");
        const existing = await this.users.findOne({
            where: { phoneNumber: normalized },
        });
        if (existing && existing.id !== user.id)
            throw new api_exception_1.ApiException(409, "PHONE_NUMBER_TAKEN", "این شماره همراه قبلاً استفاده شده است.");
        const pending = await this.accountChangeRequests.findOne({
            where: {
                organization: { id: organizationId },
                user: { id: user.id },
                kind: "PHONE_NUMBER",
                status: "PENDING",
            },
        });
        if (pending)
            throw new api_exception_1.ApiException(409, "PHONE_CHANGE_REQUEST_PENDING", "یک درخواست در انتظار بررسی دارید.");
        const organization = await this.organizations.findOneBy({
            id: organizationId,
        });
        if (!organization)
            throw new api_exception_1.ApiException(404, "ORGANIZATION_NOT_FOUND", "مدرسه پیدا نشد.");
        const request = await this.accountChangeRequests.save(this.accountChangeRequests.create({
            organization,
            user: { id: user.id },
            kind: "PHONE_NUMBER",
            requestedValue: normalized,
            reason: reason?.trim() || "",
        }));
        return {
            id: request.id,
            status: request.status,
            requestedValue: request.requestedValue,
            createdAt: request.createdAt,
        };
    }
    async listPhoneNumberChangeRequests(user, organizationId) {
        if (!this.accountChangeRequests || !this.authorization)
            throw new api_exception_1.ApiException(503, "ACCOUNT_CHANGE_UNAVAILABLE", "سامانه درخواست تغییر در دسترس نیست.");
        const context = await this.authorization.enrich(user, undefined, organizationId);
        this.authorization.requireCapability(context, "account_change_requests.read");
        const scope = organizationId ?? context.organizationIds[0];
        if (!scope)
            throw new api_exception_1.ApiException(422, "ORGANIZATION_REQUIRED", "مدرسه فعال را انتخاب کنید.");
        const requests = await this.accountChangeRequests.find({
            where: { organization: { id: scope }, kind: "PHONE_NUMBER" },
            relations: { user: true, organization: true },
            order: { createdAt: "DESC" },
        });
        return requests.map((request) => ({
            id: request.id, kind: request.kind, status: request.status,
            requestedValue: request.requestedValue, reason: request.reason, reviewNote: request.reviewNote,
            createdAt: request.createdAt, updatedAt: request.updatedAt, reviewedAt: request.reviewedAt,
            organization: { id: request.organization.id, name: request.organization.name },
            user: { id: request.user.id, username: request.user.username, firstName: request.user.firstName, lastName: request.user.lastName },
        }));
    }
    async reviewPhoneNumberChangeRequest(user, id, approved, reviewNote) {
        if (!this.accountChangeRequests || !this.authorization)
            throw new api_exception_1.ApiException(503, "ACCOUNT_CHANGE_UNAVAILABLE", "سامانه درخواست تغییر در دسترس نیست.");
        const request = await this.accountChangeRequests.findOne({
            where: { id, kind: "PHONE_NUMBER" },
            relations: { organization: true, user: true },
        });
        if (!request)
            throw new api_exception_1.ApiException(404, "PHONE_CHANGE_REQUEST_NOT_FOUND", "درخواست پیدا نشد.");
        const context = await this.authorization.enrich(user, undefined, request.organization.id);
        this.authorization.requireCapability(context, "account_change_requests.manage");
        if (request.status !== "PENDING")
            throw new api_exception_1.ApiException(409, "PHONE_CHANGE_REQUEST_REVIEWED", "این درخواست قبلاً بررسی شده است.");
        if (approved) {
            const existing = await this.users.findOne({
                where: { phoneNumber: request.requestedValue },
            });
            if (existing && existing.id !== request.user.id)
                throw new api_exception_1.ApiException(409, "PHONE_NUMBER_TAKEN", "این شماره همراه قبلاً استفاده شده است.");
            request.user.phoneNumber = request.requestedValue;
            request.user.username = request.requestedValue;
            request.user.phoneNumberChangeCount += 1;
            await this.users.save(request.user);
            await this.sessions.delete({ user: { id: request.user.id } });
        }
        request.status = approved ? "APPROVED" : "REJECTED";
        request.reviewNote = reviewNote?.trim() || "";
        request.reviewedBy = { id: user.id };
        request.reviewedAt = new Date();
        await this.accountChangeRequests.save(request);
        return {
            id: request.id,
            status: request.status,
            reviewedAt: request.reviewedAt,
        };
    }
    async listSessions(user) {
        const sessions = await this.sessions.find({
            where: { user: { id: user.id } },
            order: { createdAt: "DESC" },
        });
        return sessions.map((session) => ({
            id: session.id,
            createdAt: session.createdAt,
            expiresAt: session.refreshExpiresAt ?? session.expiresAt,
            current: session.id === user.sessionId,
        }));
    }
    async revokeSession(user, id) {
        if (id === user.sessionId) {
            throw new api_exception_1.ApiException(400, "CURRENT_SESSION", "برای خروج از نشست فعلی از دکمه خروج استفاده کنید.");
        }
        const result = await this.sessions.delete({ id, user: { id: user.id } });
        return { id, revoked: Boolean(result.affected) };
    }
    async verifyCsrf(sessionId, csrfToken) {
        const session = await this.sessions.findOne({ where: { id: sessionId } });
        if (!session)
            return false;
        return this.credentials.safeEqual(session.csrfToken, csrfToken);
    }
    newCredentials() {
        return this.credentials.issue();
    }
    async hasUsableWorkContext(user) {
        if (this.authorization) {
            const context = await this.authorization.enrich({
                id: user.id,
                username: user.username,
                role: user.role,
                sessionId: "",
            });
            return context.roles.length > 0;
        }
        if (user.role !== user_entity_1.UserRole.STUDENT)
            return true;
        const student = await this.students.findOne({
            where: { user: { id: user.id } },
        });
        return student?.accountStatus === "active";
    }
    isStudentOrGuardian(user) {
        return (user.roles ?? [user.role]).some((role) => role === "STUDENT" || role === "GUARDIAN");
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(session_entity_1.Session)),
    __param(2, (0, typeorm_1.InjectRepository)(student_entity_1.Student)),
    __param(4, (0, common_1.Optional)()),
    __param(4, (0, typeorm_1.InjectRepository)(organization_membership_entity_1.OrganizationMembership)),
    __param(5, (0, common_1.Optional)()),
    __param(6, (0, common_1.Optional)()),
    __param(7, (0, common_1.Optional)()),
    __param(7, (0, typeorm_1.InjectRepository)(organization_entity_2.Organization)),
    __param(8, (0, common_1.Optional)()),
    __param(8, (0, typeorm_1.InjectRepository)(account_change_request_entity_1.AccountChangeRequest)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        config_1.ConfigService,
        typeorm_2.Repository,
        authorization_1.AuthorizationService,
        login_throttle_service_1.LoginThrottleService,
        typeorm_2.Repository,
        typeorm_2.Repository])
], AuthService);
//# sourceMappingURL=auth.service.js.map