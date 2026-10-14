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
exports.GuardianController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const class_validator_1 = require("class-validator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const guardian_service_1 = require("./guardian.service");
class EncouragementDto {
    message;
    kind;
}
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], EncouragementDto.prototype, "message", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["SUPPORT", "PROUD", "KEEP_GOING", "CELEBRATE"]),
    __metadata("design:type", String)
], EncouragementDto.prototype, "kind", void 0);
let GuardianController = class GuardianController {
    guardian;
    constructor(guardian) {
        this.guardian = guardian;
    }
    students(u) {
        return this.guardian.students(u).then(envelope_1.ok);
    }
    dashboard(u, id) {
        return this.guardian.dashboard(u, id).then(envelope_1.ok);
    }
    progress(u, id) {
        return this.guardian.progress(u, id).then(envelope_1.ok);
    }
    schedule(u, id) {
        return this.guardian.schedule(u, id).then(envelope_1.ok);
    }
    attendance(u, id) {
        return this.guardian.attendance(u, id).then(envelope_1.ok);
    }
    exams(u, id) {
        return this.guardian.exams(u, id).then(envelope_1.ok);
    }
    reports(u, id) {
        return this.guardian.reports(u, id).then(envelope_1.ok);
    }
    encourage(u, id, body) {
        return this.guardian.encourage(u, id, body).then(envelope_1.ok);
    }
};
exports.GuardianController = GuardianController;
__decorate([
    (0, common_1.Get)("students"),
    (0, capabilities_decorator_1.RequireCapabilities)("guardian.students.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GuardianController.prototype, "students", null);
__decorate([
    (0, common_1.Get)("students/:id/dashboard"),
    (0, capabilities_decorator_1.RequireCapabilities)("guardian.dashboard.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GuardianController.prototype, "dashboard", null);
__decorate([
    (0, common_1.Get)("students/:id/progress"),
    (0, capabilities_decorator_1.RequireCapabilities)("guardian.progress.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GuardianController.prototype, "progress", null);
__decorate([
    (0, common_1.Get)("students/:id/schedule"),
    (0, capabilities_decorator_1.RequireCapabilities)("guardian.schedule.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GuardianController.prototype, "schedule", null);
__decorate([
    (0, common_1.Get)("students/:id/attendance"),
    (0, capabilities_decorator_1.RequireCapabilities)("guardian.dashboard.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GuardianController.prototype, "attendance", null);
__decorate([
    (0, common_1.Get)("students/:id/exams"),
    (0, capabilities_decorator_1.RequireCapabilities)("guardian.exams.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GuardianController.prototype, "exams", null);
__decorate([
    (0, common_1.Get)("students/:id/reports"),
    (0, capabilities_decorator_1.RequireCapabilities)("guardian.reports.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], GuardianController.prototype, "reports", null);
__decorate([
    (0, common_1.Post)("students/:id/encouragement"),
    (0, capabilities_decorator_1.RequireCapabilities)("guardian.encouragement.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, EncouragementDto]),
    __metadata("design:returntype", void 0)
], GuardianController.prototype, "encourage", null);
exports.GuardianController = GuardianController = __decorate([
    (0, common_1.Controller)("guardian"),
    __metadata("design:paramtypes", [guardian_service_1.GuardianService])
], GuardianController);
//# sourceMappingURL=guardian.controller.js.map