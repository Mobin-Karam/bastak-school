"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkflowsModule = void 0;
const school_access_1 = require("../school-access");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const attendance_session_entity_1 = require("../../database/entities/attendance-session.entity");
const exit_permission_entity_1 = require("../../database/entities/exit-permission.entity");
const leave_request_entity_1 = require("../../database/entities/leave-request.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const request_letter_entity_1 = require("../../database/entities/request-letter.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const user_entity_1 = require("../../database/entities/user.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const dorm_room_entity_1 = require("../../database/entities/dorm-room.entity");
const dorm_room_assignment_entity_1 = require("../../database/entities/dorm-room-assignment.entity");
const study_group_entity_1 = require("../../database/entities/study-group.entity");
const study_group_membership_entity_1 = require("../../database/entities/study-group-membership.entity");
const workflows_controller_1 = require("./workflows.controller");
const workflows_service_1 = require("./workflows.service");
const realtime_module_1 = require("../realtime/realtime.module");
const notifications_module_1 = require("../notifications/notifications.module");
let WorkflowsModule = class WorkflowsModule {
};
exports.WorkflowsModule = WorkflowsModule;
exports.WorkflowsModule = WorkflowsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            school_access_1.SchoolAccessModule,
            realtime_module_1.RealtimeModule,
            notifications_module_1.NotificationsModule,
            typeorm_1.TypeOrmModule.forFeature([
                attendance_session_entity_1.AttendanceSession,
                attendance_record_entity_1.AttendanceRecord,
                leave_request_entity_1.LeaveRequest,
                exit_permission_entity_1.ExitPermission,
                request_letter_entity_1.RequestLetter,
                student_entity_1.Student,
                organization_membership_entity_1.OrganizationMembership,
                user_entity_1.User,
                education_class_entity_1.EducationClass,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                study_group_entity_1.StudyGroup,
                study_group_membership_entity_1.StudyGroupMembership,
                dorm_room_entity_1.DormRoom,
                dorm_room_assignment_entity_1.DormRoomAssignment,
            ]),
        ],
        controllers: [workflows_controller_1.WorkflowsController],
        providers: [workflows_service_1.WorkflowsService],
    })
], WorkflowsModule);
//# sourceMappingURL=workflows.module.js.map