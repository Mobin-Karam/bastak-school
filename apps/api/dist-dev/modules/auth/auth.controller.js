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
exports.AuthController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_exception_1 = require("../../common/exceptions/api.exception");
const envelope_1 = require("../../common/utils/envelope");
const auth_service_1 = require("./auth.service");
const change_password_dto_1 = require("./dto/change-password.dto");
const check_phone_dto_1 = require("./dto/check-phone.dto");
const login_dto_1 = require("./dto/login.dto");
const phone_number_change_dto_1 = require("./dto/phone-number-change.dto");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
let AuthController = class AuthController {
    auth;
    config;
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    async checkPhone(dto, req) {
        return (0, envelope_1.ok)(await this.auth.checkPhone(dto.phoneNumber, req.ip));
    }
    async login(dto, req, res) {
        const result = await this.auth.login(dto.phoneNumber, dto.password, req.ip);
        this.setAuthCookies(res, result);
        return (0, envelope_1.ok)({
            user: {
                id: result.user.id,
                username: result.user.username,
                role: result.user.role,
            },
            csrfToken: result.csrfToken,
            expiresAt: result.expiresAt,
            refreshExpiresAt: result.refreshExpiresAt,
        });
    }
    async refresh(req, res) {
        const refreshCookieName = this.config.get("refreshCookieName", "moshaver_v2_refresh");
        const csrfToken = req.headers["x-csrf-token"];
        const result = await this.auth.refresh(req.cookies?.[refreshCookieName], typeof csrfToken === "string" ? csrfToken : undefined);
        this.setAuthCookies(res, result);
        return (0, envelope_1.ok)({
            csrfToken: result.csrfToken,
            expiresAt: result.expiresAt,
            refreshExpiresAt: result.refreshExpiresAt,
        });
    }
    async me(user) {
        if (!user)
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
        return (0, envelope_1.ok)(await this.auth.me(user));
    }
    async changePassword(user, dto) {
        if (!user)
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
        return this.auth
            .changePassword(user, dto.currentPassword, dto.newPassword)
            .then(envelope_1.ok);
    }
    async changeOwnPhoneNumber(user, dto) {
        if (!user)
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
        return this.auth.changeOwnPhoneNumber(user, dto.phoneNumber).then(envelope_1.ok);
    }
    async requestPhoneNumberChange(user, dto) {
        if (!user)
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
        return this.auth
            .createPhoneNumberChangeRequest(user, dto.organizationId, dto.phoneNumber, dto.reason)
            .then(envelope_1.ok);
    }
    phoneChangeRequests(user, req) {
        const organizationId = req.headers["x-organization-id"];
        return this.auth
            .listPhoneNumberChangeRequests(user, typeof organizationId === "string" ? organizationId : undefined)
            .then(envelope_1.ok);
    }
    approvePhoneChange(user, id, dto) {
        return this.auth
            .reviewPhoneNumberChangeRequest(user, id, true, dto.reviewNote)
            .then(envelope_1.ok);
    }
    rejectPhoneChange(user, id, dto) {
        return this.auth
            .reviewPhoneNumberChangeRequest(user, id, false, dto.reviewNote)
            .then(envelope_1.ok);
    }
    async logout(req, res) {
        const cookieName = this.config.get("cookieName", "moshaver_v2_session");
        const refreshCookieName = this.config.get("refreshCookieName", "moshaver_v2_refresh");
        await this.auth.logout(req.cookies?.[cookieName], req.cookies?.[refreshCookieName]);
        res.clearCookie(cookieName, { path: "/" });
        res.clearCookie(refreshCookieName, { path: "/" });
        return (0, envelope_1.ok)({ loggedOut: true });
    }
    async sessions(user) {
        if (!user)
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
        return this.auth.listSessions(user).then(envelope_1.ok);
    }
    async revokeSession(user, id) {
        if (!user)
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
        return this.auth.revokeSession(user, id).then(envelope_1.ok);
    }
    setAuthCookies(res, result) {
        const options = {
            path: "/",
            httpOnly: true,
            secure: this.config.get("cookieSecure", false),
            sameSite: this.config.get("cookieSameSite", "lax"),
        };
        res.setCookie(this.config.get("cookieName", "moshaver_v2_session"), result.accessToken, { ...options, expires: result.expiresAt });
        res.setCookie(this.config.get("refreshCookieName", "moshaver_v2_refresh"), result.refreshToken, { ...options, expires: result.refreshExpiresAt });
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Post)("check-phone"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [check_phone_dto_1.CheckPhoneDto, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "checkPhone", null);
__decorate([
    (0, common_1.Post)("login"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [login_dto_1.LoginDto, Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)("refresh"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "refresh", null);
__decorate([
    (0, common_1.Get)("me"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "me", null);
__decorate([
    (0, common_1.Post)("change-password"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, change_password_dto_1.ChangePasswordDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changePassword", null);
__decorate([
    (0, common_1.Post)("profile/phone"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, phone_number_change_dto_1.ChangeOwnPhoneNumberDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "changeOwnPhoneNumber", null);
__decorate([
    (0, common_1.Post)("profile/phone-requests"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, phone_number_change_dto_1.CreatePhoneNumberChangeRequestDto]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "requestPhoneNumberChange", null);
__decorate([
    (0, common_1.Get)("phone-change-requests"),
    (0, capabilities_decorator_1.RequireCapabilities)("account_change_requests.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "phoneChangeRequests", null);
__decorate([
    (0, common_1.Post)("phone-change-requests/:id/approve"),
    (0, capabilities_decorator_1.RequireCapabilities)("account_change_requests.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, phone_number_change_dto_1.ReviewPhoneNumberChangeRequestDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "approvePhoneChange", null);
__decorate([
    (0, common_1.Post)("phone-change-requests/:id/reject"),
    (0, capabilities_decorator_1.RequireCapabilities)("account_change_requests.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, phone_number_change_dto_1.ReviewPhoneNumberChangeRequestDto]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "rejectPhoneChange", null);
__decorate([
    (0, common_1.Post)("logout"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)({ passthrough: true })),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)("sessions"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "sessions", null);
__decorate([
    (0, common_1.Delete)("sessions/:id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "revokeSession", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)("auth"),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map