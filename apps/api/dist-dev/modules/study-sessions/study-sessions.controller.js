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
exports.StudySessionsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const roles_decorator_1 = require("../../common/decorators/roles.decorator");
const envelope_1 = require("../../common/utils/envelope");
const user_entity_1 = require("../../database/entities/user.entity");
const finish_study_session_dto_1 = require("./dto/finish-study-session.dto");
const start_study_session_dto_1 = require("./dto/start-study-session.dto");
const study_sessions_service_1 = require("./study-sessions.service");
let StudySessionsController = class StudySessionsController {
    studySessions;
    constructor(studySessions) {
        this.studySessions = studySessions;
    }
    start(user, dto) {
        return this.studySessions.start(user.id, dto.taskId).then(envelope_1.ok);
    }
    active(user) {
        return this.studySessions.active(user.id).then(envelope_1.ok);
    }
    heartbeat(user, id) {
        return this.studySessions.heartbeat(user.id, id).then(envelope_1.ok);
    }
    pause(user, id) {
        return this.studySessions.pause(user.id, id).then(envelope_1.ok);
    }
    resume(user, id) {
        return this.studySessions.resume(user.id, id).then(envelope_1.ok);
    }
    finish(user, id, dto) {
        return this.studySessions.finish(user.id, id, dto).then(envelope_1.ok);
    }
};
exports.StudySessionsController = StudySessionsController;
__decorate([
    (0, common_1.Post)(),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, start_study_session_dto_1.StartStudySessionDto]),
    __metadata("design:returntype", void 0)
], StudySessionsController.prototype, "start", null);
__decorate([
    (0, common_1.Get)("active"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], StudySessionsController.prototype, "active", null);
__decorate([
    (0, common_1.Post)(":id/heartbeat"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudySessionsController.prototype, "heartbeat", null);
__decorate([
    (0, common_1.Post)(":id/pause"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudySessionsController.prototype, "pause", null);
__decorate([
    (0, common_1.Post)(":id/resume"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], StudySessionsController.prototype, "resume", null);
__decorate([
    (0, common_1.Post)(":id/finish"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, finish_study_session_dto_1.FinishStudySessionDto]),
    __metadata("design:returntype", void 0)
], StudySessionsController.prototype, "finish", null);
exports.StudySessionsController = StudySessionsController = __decorate([
    (0, common_1.Controller)("student/study-sessions"),
    (0, roles_decorator_1.Roles)(user_entity_1.UserRole.STUDENT),
    __metadata("design:paramtypes", [study_sessions_service_1.StudySessionsService])
], StudySessionsController);
//# sourceMappingURL=study-sessions.controller.js.map