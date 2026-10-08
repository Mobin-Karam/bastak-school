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
exports.StaffMistakesController = exports.MistakesController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const mistakes_service_1 = require("./mistakes.service");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
let MistakesController = class MistakesController {
    mistakes;
    constructor(mistakes) {
        this.mistakes = mistakes;
    }
    list(user, limit) {
        return this.mistakes.list(user.id, limit).then(envelope_1.ok);
    }
    detail(user, id) {
        return this.mistakes.detail(user.id, id).then(envelope_1.ok);
    }
    classifyQuestion(user, questionId, body) {
        return this.mistakes.updateByQuestion(user.id, questionId, body).then(envelope_1.ok);
    }
    update(user, id, body) {
        return this.mistakes.update(user.id, id, body).then(envelope_1.ok);
    }
};
exports.MistakesController = MistakesController;
__decorate([
    openapi.ApiQuery({ name: "limit", required: false }),
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MistakesController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MistakesController.prototype, "detail", null);
__decorate([
    (0, common_1.Patch)("question/:questionId"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("questionId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MistakesController.prototype, "classifyQuestion", null);
__decorate([
    (0, common_1.Patch)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], MistakesController.prototype, "update", null);
exports.MistakesController = MistakesController = __decorate([
    (0, common_1.Controller)(["mistakes", "student/mistakes"]),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    __metadata("design:paramtypes", [mistakes_service_1.MistakesService])
], MistakesController);
let StaffMistakesController = class StaffMistakesController {
    mistakes;
    constructor(mistakes) {
        this.mistakes = mistakes;
    }
    context(user) { return { ...user, roles: user.roles ?? [user.role], capabilities: user.capabilities ?? [], membershipIds: user.membershipIds ?? [], organizationIds: user.organizationIds ?? [] }; }
    list(user, studentId, limit) {
        return this.mistakes.listForStaff(this.context(user), studentId, limit).then(envelope_1.ok);
    }
};
exports.StaffMistakesController = StaffMistakesController;
__decorate([
    openapi.ApiQuery({ name: "limit", required: false }),
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("mistakes.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("studentId")),
    __param(2, (0, common_1.Query)("limit")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], StaffMistakesController.prototype, "list", null);
exports.StaffMistakesController = StaffMistakesController = __decorate([
    (0, common_1.Controller)("students/:studentId/mistakes"),
    __metadata("design:paramtypes", [mistakes_service_1.MistakesService])
], StaffMistakesController);
//# sourceMappingURL=mistakes.controller.js.map