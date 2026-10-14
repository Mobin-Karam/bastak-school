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
exports.TimetableController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const timetable_service_1 = require("./timetable.service");
const timetable_dto_1 = require("./timetable.dto");
let TimetableController = class TimetableController {
    timetable;
    constructor(timetable) {
        this.timetable = timetable;
    }
    workspace(user, org, versionId, startsOn) {
        return this.timetable.workspace(user, org, versionId, startsOn).then(envelope_1.ok);
    }
    config(user, org, dto) {
        return this.timetable.config(user, org, dto).then(envelope_1.ok);
    }
    create(user, org, dto) {
        return this.timetable.createVersion(user, org, dto).then(envelope_1.ok);
    }
    lesson(user, id, dto) {
        return this.timetable.writeLesson(user, id, dto).then(envelope_1.ok);
    }
    preview(user, id, dto) {
        return this.timetable.writeLesson(user, id, dto, undefined, true).then(envelope_1.ok);
    }
    update(user, id, lessonId, dto) {
        return this.timetable.writeLesson(user, id, dto, lessonId).then(envelope_1.ok);
    }
    previewUpdate(user, id, lessonId, dto) {
        return this.timetable.writeLesson(user, id, dto, lessonId, true).then(envelope_1.ok);
    }
    remove(user, id, lessonId, dto) {
        return this.timetable
            .removeLesson(user, id, lessonId, dto.expectedRevision)
            .then(envelope_1.ok);
    }
    publish(user, id, dto) {
        return this.timetable.publish(user, id, dto).then(envelope_1.ok);
    }
    override(user, id, dto) {
        return this.timetable.override(user, id, dto).then(envelope_1.ok);
    }
    previewImport(user, id, dto) {
        return this.timetable.previewImport(user, id, dto).then(envelope_1.ok);
    }
    import(user, id, dto) {
        return this.timetable.commitImport(user, id, dto).then(envelope_1.ok);
    }
    attendance(user, id, dto) {
        return this.timetable.openAttendance(user, id, dto.date).then(envelope_1.ok);
    }
};
exports.TimetableController = TimetableController;
__decorate([
    openapi.ApiQuery({ name: "versionId", required: false }),
    openapi.ApiQuery({ name: "startsOn", required: false }),
    (0, common_1.Get)(":organizationId"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Query)("versionId")),
    __param(3, (0, common_1.Query)("startsOn")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "workspace", null);
__decorate([
    (0, common_1.Post)(":organizationId/config"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.update"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetableConfigDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "config", null);
__decorate([
    (0, common_1.Post)(":organizationId/versions"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetableVersionDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("versions/:id/lessons"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetableLessonWriteDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "lesson", null);
__decorate([
    (0, common_1.Post)("versions/:id/lessons/preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetableLessonWriteDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "preview", null);
__decorate([
    (0, common_1.Patch)("versions/:id/lessons/:lessonId"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.update"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)("lessonId", common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, timetable_dto_1.TimetableLessonWriteDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "update", null);
__decorate([
    (0, common_1.Post)("versions/:id/lessons/:lessonId/preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.update"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)("lessonId", common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, timetable_dto_1.TimetableLessonWriteDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "previewUpdate", null);
__decorate([
    (0, common_1.Delete)("versions/:id/lessons/:lessonId"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.delete"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Param)("lessonId", common_1.ParseUUIDPipe)),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, timetable_dto_1.TimetableRevisionDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)("versions/:id/publish"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.publish"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetablePublishDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "publish", null);
__decorate([
    (0, common_1.Post)("versions/:id/overrides"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.publish"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetableOverrideDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "override", null);
__decorate([
    (0, common_1.Post)("versions/:id/import/preview"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.import"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetableImportDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "previewImport", null);
__decorate([
    (0, common_1.Post)("versions/:id/import/commit"),
    (0, capabilities_decorator_1.RequireCapabilities)("schedule.import"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetableImportDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "import", null);
__decorate([
    (0, common_1.Post)("lessons/:id/attendance"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.class.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id", common_1.ParseUUIDPipe)),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, timetable_dto_1.TimetableAttendanceDto]),
    __metadata("design:returntype", void 0)
], TimetableController.prototype, "attendance", null);
exports.TimetableController = TimetableController = __decorate([
    (0, common_1.Controller)("schedule/timetable"),
    __metadata("design:paramtypes", [timetable_service_1.TimetableService])
], TimetableController);
//# sourceMappingURL=timetable.controller.js.map