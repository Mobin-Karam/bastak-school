import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { LearningResource } from "../../database/entities/learning-resource.entity";
import { LearningResourceAssignment } from "../../database/entities/learning-resource-assignment.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Plan } from "../../database/entities/plan.entity";
import { Student } from "../../database/entities/student.entity";
import { Task } from "../../database/entities/task.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { EducationSharingController } from "./education-sharing.controller";
import { EducationSharingService } from "./education-sharing.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      OrganizationMembership,
      Plan,
      Task,
      LearningResource,
      LearningResourceAssignment,
      AuditLog,
    ]),
    AuthorizationModule,
    RealtimeModule,
  ],
  controllers: [EducationSharingController],
  providers: [EducationSharingService],
})
export class EducationSharingModule {}
