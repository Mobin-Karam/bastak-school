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
exports.OnboardingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const onboarding_dto_1 = require("./onboarding.dto");
const onboarding_service_1 = require("./onboarding.service");
const signup_throttle_service_1 = require("./signup-throttle.service");
let OnboardingController = class OnboardingController {
    service;
    signupThrottle;
    constructor(service, signupThrottle) {
        this.service = service;
        this.signupThrottle = signupThrottle;
    }
    async signup(request, dto) {
        await this.signupThrottle.record(request.ip);
        return this.service.signup(dto).then(envelope_1.ok);
    }
    signupOptions() {
        return this.service.publicSignupOptions().then(envelope_1.ok);
    }
    platformSignupPolicy(user) {
        return this.service.getPlatformSignupPolicy(user).then(envelope_1.ok);
    }
    platformPolicy(user, dto) {
        return this.service.setPlatformSignupPolicy(user, dto.enabled).then(envelope_1.ok);
    }
    organizationPolicy(user, id, dto) {
        return this.service.setOrganizationSignupPolicy(user, id, dto).then(envelope_1.ok);
    }
    bootstrapStatus() {
        return this.service.platformBootstrapStatus().then(envelope_1.ok);
    }
    async bootstrap(request, dto) {
        await this.signupThrottle.record(request.ip);
        return this.service.bootstrapPlatformAdmin(dto).then(envelope_1.ok);
    }
    pending() {
        return this.service.pending().then(envelope_1.ok);
    }
    assign(id, dto) {
        return this.service.assign(id, dto).then(envelope_1.ok);
    }
};
exports.OnboardingController = OnboardingController;
__decorate([
    (0, common_1.Post)("student-signup"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboarding_dto_1.StudentSignupDto]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "signup", null);
__decorate([
    (0, common_1.Get)("student-signup-options"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "signupOptions", null);
__decorate([
    (0, common_1.Get)("student-signup-policy"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "platformSignupPolicy", null);
__decorate([
    (0, common_1.Patch)("student-signup-policy"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboarding_dto_1.SetPlatformStudentSignupDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "platformPolicy", null);
__decorate([
    (0, common_1.Patch)("organizations/:id/student-signup-policy"),
    (0, capabilities_decorator_1.RequireCapabilities)("organization.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, onboarding_dto_1.SetOrganizationStudentSignupDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "organizationPolicy", null);
__decorate([
    (0, common_1.Get)("platform-bootstrap"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "bootstrapStatus", null);
__decorate([
    (0, common_1.Post)("platform-bootstrap"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, onboarding_dto_1.PlatformBootstrapDto]),
    __metadata("design:returntype", Promise)
], OnboardingController.prototype, "bootstrap", null);
__decorate([
    (0, common_1.Get)("students/pending"),
    (0, capabilities_decorator_1.RequireCapabilities)("student_onboarding.manage"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "pending", null);
__decorate([
    (0, common_1.Post)("students/:id/assign"),
    (0, capabilities_decorator_1.RequireCapabilities)("student_onboarding.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, common_1.Param)("id")),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, onboarding_dto_1.AssignStudentOnboardingDto]),
    __metadata("design:returntype", void 0)
], OnboardingController.prototype, "assign", null);
exports.OnboardingController = OnboardingController = __decorate([
    (0, common_1.Controller)("onboarding"),
    __metadata("design:paramtypes", [onboarding_service_1.OnboardingService,
        signup_throttle_service_1.SignupThrottleService])
], OnboardingController);
//# sourceMappingURL=onboarding.controller.js.map