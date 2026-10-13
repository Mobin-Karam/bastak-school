import { SchoolAccessModule } from "../school-access";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AttendanceRecord } from "../../database/entities/attendance-record.entity";
import { AttendanceSession } from "../../database/entities/attendance-session.entity";
import { ExitPermission } from "../../database/entities/exit-permission.entity";
import { LeaveRequest } from "../../database/entities/leave-request.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { RequestLetter } from "../../database/entities/request-letter.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { DormRoom } from "../../database/entities/dorm-room.entity";
import { DormRoomAssignment } from "../../database/entities/dorm-room-assignment.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { WorkflowsController } from "./workflows.controller";
import { WorkflowsService } from "./workflows.service";
import { RealtimeModule } from "../realtime/realtime.module";
import { NotificationsModule } from "../notifications/notifications.module";

@Module({
  imports: [
    SchoolAccessModule,
    RealtimeModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      AttendanceSession,
      AttendanceRecord,
      LeaveRequest,
      ExitPermission,
      RequestLetter,
      Student,
      OrganizationMembership,
      User,
      EducationClass,
      EducationClassEnrollment,
      StudyGroup,
      StudyGroupMembership,
      DormRoom,
      DormRoomAssignment,
    ]),
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
})
export class WorkflowsModule {}
