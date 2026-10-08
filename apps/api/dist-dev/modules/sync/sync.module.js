"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SyncModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const exam_attempt_entity_1 = require("../../database/entities/exam-attempt.entity");
const notification_entity_1 = require("../../database/entities/notification.entity");
const plan_entity_1 = require("../../database/entities/plan.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const study_session_entity_1 = require("../../database/entities/study-session.entity");
const sync_mutation_entity_1 = require("../../database/entities/sync-mutation.entity");
const tasks_module_1 = require("../tasks/tasks.module");
const study_sessions_module_1 = require("../study-sessions/study-sessions.module");
const sync_controller_1 = require("./sync.controller");
const sync_service_1 = require("./sync.service");
const exam_entity_1 = require("../../database/entities/exam.entity");
const exam_assignment_entity_1 = require("../../database/entities/exam-assignment.entity");
const learning_item_entity_1 = require("../../database/entities/learning-item.entity");
const learning_review_entity_1 = require("../../database/entities/learning-review.entity");
const task_entity_1 = require("../../database/entities/task.entity");
const reports_module_1 = require("../reports/reports.module");
const students_module_1 = require("../students/students.module");
const exams_module_1 = require("../exams/exams.module");
let SyncModule = class SyncModule {
};
exports.SyncModule = SyncModule;
exports.SyncModule = SyncModule = __decorate([
    (0, common_1.Module)({ imports: [typeorm_1.TypeOrmModule.forFeature([student_entity_1.Student, plan_entity_1.Plan, study_session_entity_1.StudySession, exam_attempt_entity_1.ExamAttempt, notification_entity_1.Notification, sync_mutation_entity_1.SyncMutation, task_entity_1.Task, exam_entity_1.Exam, exam_assignment_entity_1.ExamAssignment, learning_item_entity_1.LearningItem, learning_review_entity_1.LearningReview]), tasks_module_1.TasksModule, study_sessions_module_1.StudySessionsModule, reports_module_1.ReportsModule, students_module_1.StudentsModule, exams_module_1.ExamsModule], controllers: [sync_controller_1.SyncController], providers: [sync_service_1.SyncService] })
], SyncModule);
//# sourceMappingURL=sync.module.js.map