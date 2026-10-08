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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthSessionGuard = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const auth_service_1 = require("../../modules/auth/auth.service");
let AuthSessionGuard = class AuthSessionGuard {
    auth;
    config;
    constructor(auth, config) {
        this.auth = auth;
        this.config = config;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const cookieName = this.config.get("cookieName", "moshaver_v2_session");
        const token = request.cookies?.[cookieName] || this.cookieFromHeader(request.headers.cookie, cookieName);
        const workRole = this.singleHeader(request.headers["x-work-role"]);
        const organizationId = this.singleHeader(request.headers["x-organization-id"]);
        request.user = await this.auth.userFromToken(token, workRole, organizationId);
        return true;
    }
    singleHeader(value) {
        const candidate = Array.isArray(value) ? value[0] : value;
        return candidate?.trim() || undefined;
    }
    cookieFromHeader(header, name) {
        return (header || "")
            .split(";")
            .map((part) => part.trim())
            .map((part) => part.split("="))
            .find(([key]) => key === name)?.[1];
    }
};
exports.AuthSessionGuard = AuthSessionGuard;
exports.AuthSessionGuard = AuthSessionGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        config_1.ConfigService])
], AuthSessionGuard);
//# sourceMappingURL=auth-session.guard.js.map