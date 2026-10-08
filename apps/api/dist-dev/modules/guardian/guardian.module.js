"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GuardianModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const daily_report_entity_1 = require("../../database/entities/daily-report.entity");
const encouragement_entity_1 = require("../../database/entities/encouragement.entity");
const exam_assignment_entity_1 = require("../../database/entities/exam-assignment.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const study_session_entity_1 = require("../../database/entities/study-session.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const user_relationship_entity_1 = require("../../database/entities/user-relationship.entity");
const exams_module_1 = require("../exams/exams.module");
const notifications_module_1 = require("../notifications/notifications.module");
const guardian_controller_1 = require("./guardian.controller");
const guardian_service_1 = require("./guardian.service");
let GuardianModule = class GuardianModule {
};
exports.GuardianModule = GuardianModule;
exports.GuardianModule = GuardianModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                user_relationship_entity_1.UserRelationship,
                student_entity_1.Student,
                plan_entity_1.Plan,
                study_session_entity_1.StudySession,
                exam_assignment_entity_1.ExamAssignment,
                daily_report_entity_1.DailyReport,
                encouragement_entity_1.Encouragement,
                user_entity_1.User,
                audit_log_entity_1.AuditLog,
                attendance_record_entity_1.AttendanceRecord,
            ]),
            notifications_module_1.NotificationsModule,
            exams_module_1.ExamsModule,
        ],
        controllers: [guardian_controller_1.GuardianController],
        providers: [guardian_service_1.GuardianService],
    })
], GuardianModule);
//# sourceMappingURL=guardian.module.js.map