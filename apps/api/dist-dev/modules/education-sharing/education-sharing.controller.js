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
exports.EducationSharingController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const education_sharing_dto_1 = require("./education-sharing.dto");
const education_sharing_service_1 = require("./education-sharing.service");
let EducationSharingController = class EducationSharingController {
    sharing;
    constructor(sharing) {
        this.sharing = sharing;
    }
    peers(user) {
        return this.sharing.peers(user).then(envelope_1.ok);
    }
    sharePlan(user, id, dto) {
        return this.sharing
            .sharePlan(user, id, dto.targetStudentId, dto.date)
            .then(envelope_1.ok);
    }
    sharePlanRange(user, id, dto) {
        return this.sharing.sharePlanRange(user, id, dto).then(envelope_1.ok);
    }
    previewPlanRange(user, id, dto) {
        return this.sharing.previewPlanRange(user, id, dto).then(envelope_1.ok);
    }
    planHistory(user) {
        return this.sharing.planHistory(user).then(envelope_1.ok);
    }
    shareResource(user, id, dto) {
        return this.sharing.shareResource(user, id, dto.targetStudentId).then(envelope_1.ok);
    }
};
exports.EducationSharingController = EducationSharingController;
__decorate([
    (0, common_1.Get)("peers"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.share"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EducationSharingController.prototype, "peers", null);
__decorate([
    (0, common_1.Post)("plans/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.share"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, education_sharing_dto_1.ShareEducationDto]),
    __metadata("design:returntype", void 0)
], EducationSharingController.prototype, "sharePlan", null);
__decorate([
    (0, common_1.Post)("plans/:id/range"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.share"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, education_sharing_dto_1.SharePlanRangeDto]),
    __metadata("design:returntype", void 0)
], EducationSharingController.prototype, "sharePlanRange", null);
__decorate([
    (0, common_1.Post)("plans/:id/range/preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.share"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, education_sharing_dto_1.SharePlanRangeDto]),
    __metadata("design:returntype", void 0)
], EducationSharingController.prototype, "previewPlanRange", null);
__decorate([
    (0, common_1.Get)("plan-history"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.share"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], EducationSharingController.prototype, "planHistory", null);
__decorate([
    (0, common_1.Post)("learning-resources/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("education.share"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, education_sharing_dto_1.ShareEducationDto]),
    __metadata("design:returntype", void 0)
], EducationSharingController.prototype, "shareResource", null);
exports.EducationSharingController = EducationSharingController = __decorate([
    (0, common_1.Controller)("education-sharing"),
    __metadata("design:paramtypes", [education_sharing_service_1.EducationSharingService])
], EducationSharingController);
//# sourceMappingURL=education-sharing.controller.js.map