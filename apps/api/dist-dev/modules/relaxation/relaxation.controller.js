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
exports.RelaxationStudentController = exports.RelaxationAdminController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const relaxation_dto_1 = require("./relaxation.dto");
const relaxation_service_1 = require("./relaxation.service");
let RelaxationAdminController = class RelaxationAdminController {
    service;
    constructor(service) {
        this.service = service;
    }
    list() { return this.service.listManaged().then(envelope_1.ok); }
    audience(id) { return this.service.audience(id).then(envelope_1.ok); }
    create(user, dto) { return this.service.create(user, dto).then(envelope_1.ok); }
    update(user, id, dto) { return this.service.update(user, id, dto).then(envelope_1.ok); }
};
exports.RelaxationAdminController = RelaxationAdminController;
__decorate([
    (0, common_1.Get)(),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], RelaxationAdminController.prototype, "list", null);
__decorate([
    (0, common_1.Get)(":id/audience"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], RelaxationAdminController.prototype, "audience", null);
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, relaxation_dto_1.SaveRelaxationTrackDto]),
    __metadata("design:returntype", void 0)
], RelaxationAdminController.prototype, "create", null);
__decorate([
    (0, common_1.Patch)(":id"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, relaxation_dto_1.SaveRelaxationTrackDto]),
    __metadata("design:returntype", void 0)
], RelaxationAdminController.prototype, "update", null);
exports.RelaxationAdminController = RelaxationAdminController = __decorate([
    (0, common_1.Controller)("system/relaxation-tracks"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.PLATFORM_ADMIN),
    __metadata("design:paramtypes", [relaxation_service_1.RelaxationService])
], RelaxationAdminController);
let RelaxationStudentController = class RelaxationStudentController {
    service;
    constructor(service) {
        this.service = service;
    }
    today(user) { return this.service.today(user.id).then(envelope_1.ok); }
    select(user, dto) { return this.service.select(user.id, dto.trackId).then(envelope_1.ok); }
};
exports.RelaxationStudentController = RelaxationStudentController;
__decorate([
    (0, common_1.Get)("today"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], RelaxationStudentController.prototype, "today", null);
__decorate([
    (0, common_1.Put)("today"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, relaxation_dto_1.SelectRelaxationTrackDto]),
    __metadata("design:returntype", void 0)
], RelaxationStudentController.prototype, "select", null);
exports.RelaxationStudentController = RelaxationStudentController = __decorate([
    (0, common_1.Controller)("student/relaxation"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    __metadata("design:paramtypes", [relaxation_service_1.RelaxationService])
], RelaxationStudentController);
//# sourceMappingURL=relaxation.controller.js.map