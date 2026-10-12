"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceModule = void 0;
const attendance_operations_service_1 = require("./attendance-operations.service");
const attendance_operations_controller_1 = require("./attendance-operations.controller");
const dorm_attendance_delegate_entity_1 = require("../../database/entities/dorm-attendance-delegate.entity");
const attendance_pool_entity_1 = require("../../database/entities/attendance-pool.entity");
const attendance_write_receipt_entity_1 = require("../../database/entities/attendance-write-receipt.entity");
const audit_log_entity_1 = require("../../database/entities/audit-log.entity");
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const attendance_record_entity_1 = require("../../database/entities/attendance-record.entity");
const attendance_session_entity_1 = require("../../database/entities/attendance-session.entity");
const dorm_room_assignment_entity_1 = require("../../database/entities/dorm-room-assignment.entity");
const dorm_room_entity_1 = require("../../database/entities/dorm-room.entity");
const education_class_enrollment_entity_1 = require("../../database/entities/education-class-enrollment.entity");
const education_class_entity_1 = require("../../database/entities/education-class.entity");
const student_entity_1 = require("../../database/entities/student.entity");
const organization_membership_entity_1 = require("../../database/entities/organization-membership.entity");
const study_group_membership_entity_1 = require("../../database/entities/study-group-membership.entity");
const study_group_entity_1 = require("../../database/entities/study-group.entity");
const authorization_module_1 = require("../authorization/authorization.module");
const school_access_1 = require("../school-access");
const realtime_1 = require("../realtime");
const attendance_controller_1 = require("./attendance.controller");
const attendance_service_1 = require("./attendance.service");
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([
                dorm_attendance_delegate_entity_1.DormAttendanceDelegate,
                attendance_pool_entity_1.AttendancePool,
                attendance_session_entity_1.AttendanceSession,
                attendance_record_entity_1.AttendanceRecord,
                attendance_write_receipt_entity_1.AttendanceWriteReceipt,
                audit_log_entity_1.AuditLog,
                student_entity_1.Student,
                education_class_entity_1.EducationClass,
                education_class_enrollment_entity_1.EducationClassEnrollment,
                study_group_entity_1.StudyGroup,
                study_group_membership_entity_1.StudyGroupMembership,
                dorm_room_entity_1.DormRoom,
                dorm_room_assignment_entity_1.DormRoomAssignment,
                organization_membership_entity_1.OrganizationMembership,
            ]),
            school_access_1.SchoolAccessModule,
            authorization_module_1.AuthorizationModule,
            realtime_1.RealtimeModule,
        ],
        controllers: [attendance_controller_1.AttendanceController, attendance_operations_controller_1.AttendanceOperationsController],
        providers: [attendance_service_1.AttendanceService, attendance_operations_service_1.AttendanceOperationsService],
        exports: [attendance_service_1.AttendanceService],
    })
], AttendanceModule);
//# sourceMappingURL=attendance.module.js.map