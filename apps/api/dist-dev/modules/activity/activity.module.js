"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivityModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const activity_event_entity_1 = require("../../database/entities/activity-event.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const student_presence_entity_1 = require("../../database/entities/student-presence.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const student_sync_health_entity_1 = require("../../database/entities/student-sync-health.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const authorization_module_1 = require("../authorization/authorization.module");
const activity_controller_1 = require("./activity.controller");
const activity_service_1 = require("./activity.service");
let ActivityModule = class ActivityModule {
};
exports.ActivityModule = ActivityModule;
exports.ActivityModule = ActivityModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                student_presence_entity_1.StudentPresence,
                student_sync_health_entity_1.StudentSyncHealth,
                activity_event_entity_1.ActivityEvent,
                student_entity_1.Student,
                task_entity_1.Task,
                audit_log_entity_1.AuditLog,
            ]),
            authorization_module_1.AuthorizationModule,
        ],
        controllers: [activity_controller_1.ActivityController],
        providers: [activity_service_1.ActivityService],
        exports: [activity_service_1.ActivityService],
    })
], ActivityModule);
//# sourceMappingURL=activity.module.js.map