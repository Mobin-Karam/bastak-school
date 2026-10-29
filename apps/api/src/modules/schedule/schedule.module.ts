import { SchoolAccessModule } from "../school-access";
import { AttendanceModule } from "../attendance";
import { NotificationsModule } from "../notifications";
import { TimetableService } from "./timetable.service";
import { TimetableController } from "./timetable.controller";
import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import {
  SchoolAcademicYear,
  SchoolAcademicTerm,
} from "../../database/entities/school-academic-year.entity";
import { SchoolScheduleTimeBlock } from "../../database/entities/school-schedule-time-block.entity";
import { SchoolScheduleTimeBlockGroup } from "../../database/entities/school-schedule-time-block-group.entity";
import { SchoolScheduleTemplate } from "../../database/entities/school-schedule-template.entity";
import {
  SchoolScheduleOccurrenceOverride,
  SchoolScheduleSubstitutionRequest,
} from "../../database/entities/school-schedule-substitution.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { TeacherLeaveRequest } from "../../database/entities/teacher-leave-request.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { AttendanceSession } from "../../database/entities/attendance-session.entity";
import { ScheduleController } from "./schedule.controller";
import { ScheduleService } from "./schedule.service";
@Module({
  imports: [
    SchoolAccessModule,
    AttendanceModule,
    NotificationsModule,
    TypeOrmModule.forFeature([
      SchoolScheduleEntry,
      SchoolAcademicYear,
      SchoolAcademicTerm,
      SchoolScheduleTimeBlock,
      SchoolScheduleTimeBlockGroup,
      SchoolScheduleTemplate,
      SchoolScheduleOccurrenceOverride,
      SchoolScheduleSubstitutionRequest,
      TeacherLeaveRequest,
      AuditLog,
      AttendanceSession,
      EducationClassBook,
      Organization,
      OrganizationMembership,
      EducationClass,
      EducationClassEnrollment,
      UserRelationship,
    ]),
  ],
  controllers: [ScheduleController, TimetableController],
  providers: [ScheduleService, TimetableService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
