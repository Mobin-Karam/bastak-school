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
exports.RegistrationController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const registration_dto_1 = require("./registration.dto");
const registration_service_1 = require("./registration.service");
let RegistrationController = class RegistrationController {
    registration;
    constructor(registration) {
        this.registration = registration;
    }
    self(user) { return this.registration.self(user).then(envelope_1.ok); }
    profile(user, dto) { return this.registration.updateProfile(user, dto).then(envelope_1.ok); }
    contacts(user, dto) { return this.registration.setContacts(user, dto.contacts).then(envelope_1.ok); }
    submit(user, sectionCode, dto) { return this.registration.submitSection(user, sectionCode, dto.status).then(envelope_1.ok); }
    requirements(user, organizationId) { return this.registration.requirements(user, organizationId).then(envelope_1.ok); }
    setRequirements(user, organizationId, dto) { return this.registration.setRequirements(user, organizationId, dto.requirements).then(envelope_1.ok); }
    students(user, organizationId) { return this.registration.students(user, organizationId).then(envelope_1.ok); }
    review(user, studentId, sectionCode, dto) { return this.registration.reviewSection(user, studentId, sectionCode, dto).then(envelope_1.ok); }
};
exports.RegistrationController = RegistrationController;
__decorate([
    (0, common_1.Get)("self"),
    (0, capabilities_decorator_1.RequireCapabilities)("registration.self.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RegistrationController.prototype, "self", null);
__decorate([
    (0, common_1.Patch)("self/profile"),
    (0, capabilities_decorator_1.RequireCapabilities)("registration.self.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, registration_dto_1.UpdateRegistrationProfileDto]),
    __metadata("design:returntype", void 0)
], RegistrationController.prototype, "profile", null);
__decorate([
    (0, common_1.Put)("self/contacts"),
    (0, capabilities_decorator_1.RequireCapabilities)("registration.self.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, registration_dto_1.SetStudentContactsDto]),
    __metadata("design:returntype", void 0)
], RegistrationController.prototype, "contacts", null);
__decorate([
    (0, common_1.Patch)("self/sections/:sectionCode"),
    (0, capabilities_decorator_1.RequireCapabilities)("registration.self.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("sectionCode")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, registration_dto_1.SubmitRegistrationSectionDto]),
    __metadata("design:returntype", void 0)
], RegistrationController.prototype, "submit", null);
__decorate([
    (0, common_1.Get)("requirements"),
    (0, capabilities_decorator_1.RequireCapabilities)("registration.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RegistrationController.prototype, "requirements", null);
__decorate([
    (0, common_1.Put)("requirements/:organizationId"),
    (0, capabilities_decorator_1.RequireCapabilities)("registration.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, registration_dto_1.SetRegistrationRequirementsDto]),
    __metadata("design:returntype", void 0)
], RegistrationController.prototype, "setRequirements", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("students"),
    (0, capabilities_decorator_1.RequireCapabilities)("registration.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], RegistrationController.prototype, "students", null);
__decorate([
    (0, common_1.Patch)("students/:studentId/sections/:sectionCode"),
    (0, capabilities_decorator_1.RequireCapabilities)("registration.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __param(2, (0, common_1.Param)("sectionCode")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, registration_dto_1.ReviewRegistrationSectionDto]),
    __metadata("design:returntype", void 0)
], RegistrationController.prototype, "review", null);
exports.RegistrationController = RegistrationController = __decorate([
    (0, common_1.Controller)("registration"),
    __metadata("design:paramtypes", [registration_service_1.RegistrationService])
], RegistrationController);
//# sourceMappingURL=registration.controller.js.map