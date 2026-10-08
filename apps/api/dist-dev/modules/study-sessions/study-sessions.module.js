"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StudySessionsModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const student_entity_1 = require("../../database/entities/student.entity");
const study_session_entity_1 = require("../../database/entities/study-session.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const notifications_module_1 = require("../notifications/notifications.module");
const study_sessions_controller_1 = require("./study-sessions.controller");
const study_sessions_service_1 = require("./study-sessions.service");
let StudySessionsModule = class StudySessionsModule {
};
exports.StudySessionsModule = StudySessionsModule;
exports.StudySessionsModule = StudySessionsModule = __decorate([
    (0, common_1.Module)({
        imports: [typeorm_1.TypeOrmModule.forFeature([study_session_entity_1.StudySession, student_entity_1.Student, task_entity_1.Task, user_relationship_entity_1.UserRelationship]), notifications_module_1.NotificationsModule],
        controllers: [study_sessions_controller_1.StudySessionsController],
        providers: [study_sessions_service_1.StudySessionsService],
        exports: [study_sessions_service_1.StudySessionsService],
    })
], StudySessionsModule);
//# sourceMappingURL=study-sessions.module.js.map