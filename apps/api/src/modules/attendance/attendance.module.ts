import { AttendanceOperationsService } from "./attendance-operations.service";
import { AttendanceOperationsController } from "./attendance-operations.controller";
import { DormAttendanceDelegate } from "../../database/entities/dorm-attendance-delegate.entity";
import { AttendancePool } from "../../database/entities/attendance-pool.entity";
import { AttendanceWriteReceipt } from "../../database/entities/attendance-write-receipt.entity";
import { AttendancePolicy } from "../../database/entities/attendance-policy.entity";
import { AttendanceCorrection } from "../../database/entities/attendance-correction.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttendanceRecord } from "../../database/entities/attendance-record.entity";
import { AttendanceSession } from "../../database/entities/attendance-session.entity";
import { AttendanceSupervisorCheck } from "../../database/entities/attendance-supervisor-check.entity";
import { TeacherLeaveRequest } from "../../database/entities/teacher-leave-request.entity";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { Student } from "../../database/entities/student.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { SchoolAccessModule } from "../school-access";
import { RealtimeModule } from "../realtime";
import { RewardsModule } from "../rewards";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DormAttendanceDelegate,
      AttendancePool,
      AttendanceSession,
      AttendanceSupervisorCheck,
      TeacherLeaveRequest,
      AttendanceRecord,
      AttendanceWriteReceipt,
      AttendancePolicy,
      AttendanceCorrection,
      AuditLog,
      Student,
      EducationClass,
      EducationClassEnrollment,
      StudyGroup,
      StudyGroupMembership,
      DormRoom,
      DormRoomAssignment,
      OrganizationMembership,
    ]),
    SchoolAccessModule,
    AuthorizationModule,
    RealtimeModule,
    RewardsModule,
  ],
  controllers: [AttendanceController, AttendanceOperationsController],
  providers: [AttendanceService, AttendanceOperationsService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
