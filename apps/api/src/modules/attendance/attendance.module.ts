import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttendanceRecord } from "../../database/entities/attendance-record.entity";
import { AttendanceSession } from "../../database/entities/attendance-session.entity";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { Student } from "../../database/entities/student.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { SchoolAccessModule } from "../school-access/school-access.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { AttendanceController } from "./attendance.controller";
import { AttendanceService } from "./attendance.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      AttendanceSession,
      AttendanceRecord,
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
  ],
  controllers: [AttendanceController],
  providers: [AttendanceService],
  exports: [AttendanceService],
})
export class AttendanceModule {}
