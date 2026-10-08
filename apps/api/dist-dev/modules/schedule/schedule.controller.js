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
exports.ScheduleController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const schedule_dto_1 = require("./schedule.dto");
const schedule_service_1 = require("./schedule.service");
let ScheduleController = class ScheduleController {
    schedule;
    constructor(schedule) {
        this.schedule = schedule;
    }
    list(user, organizationId) { return this.schedule.list(user, organizationId).then(envelope_1.ok); }
    export(user, organizationId) { return this.schedule.export(user, organizationId).then(envelope_1.ok); }
    create(user, dto) { return this.schedule.create(user, dto).then(envelope_1.ok); }
    preview(user, entries) { return this.schedule.previewImport(user, entries || []).then(envelope_1.ok); }
    commit(user, entries) { return this.schedule.commitImport(user, entries || []).then(envelope_1.ok); }
    update(user, id, dto) { return this.schedule.update(user, id, dto).then(envelope_1.ok); }
    archive(user, id, dto) { return this.schedule.archive(user, id, dto).then(envelope_1.ok); }
    remove(user, id) { return this.schedule.remove(user, id).then(envelope_1.ok); }
};
exports.ScheduleController = ScheduleController;
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)(),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "list", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("export"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.export"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "export", null);
__decorate([
    (0, common_1.Post)(),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, schedule_dto_1.SaveScheduleEntryDto]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("import/preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.import"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)("entries")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "preview", null);
__decorate([
    (0, common_1.Post)("import/commit"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.import"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)("entries")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Array]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "commit", null);
__decorate([
    (0, common_1.Patch)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, schedule_dto_1.SaveScheduleEntryDto]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "update", null);
__decorate([
    (0, common_1.Patch)(":id/archive"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.archive"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, schedule_dto_1.ArchiveScheduleEntryDto]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "archive", null);
__decorate([
    (0, common_1.Delete)(":id"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.delete"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ScheduleController.prototype, "remove", null);
exports.ScheduleController = ScheduleController = __decorate([
    (0, common_1.Controller)("schedule"),
    __metadata("design:paramtypes", [schedule_service_1.ScheduleService])
], ScheduleController);
//# sourceMappingURL=schedule.controller.js.map