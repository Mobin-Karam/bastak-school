import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { TopicMastery } from "../../database/entities/topic-mastery.entity";
import { LearningItem } from "../../database/entities/learning-item.entity";
import { LearningReview } from "../../database/entities/learning-review.entity";
import { Session } from "../../database/entities/session.entity";
import {
  StudentController,
  StudentParityController,
  StudentsController,
} from "./students.controller";
import { StudentsService } from "./students.service";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { StudentAdministrationService } from "./student-administration.service";
import { StudentAdministrationController } from "./student-administration.controller";
import { TaskIssue } from "../../database/entities/task-issue.entity";
import { RecoveryRequest } from "../../database/entities/recovery-request.entity";
import { ExamRetryRequest } from "../../database/entities/exam-retry-request.entity";
import { EducationCatalogModule } from "../education-catalog";

@Module({
  imports: [
    EducationCatalogModule,
    TypeOrmModule.forFeature([
      Student,
      User,
      TopicMastery,
      LearningItem,
      LearningReview,
      Session,
      OrganizationMembership,
      UserRelationship,
      TaskIssue,
      RecoveryRequest,
      ExamRetryRequest,
    ]),
  ],
  controllers: [
    StudentController,
    StudentParityController,
    StudentsController,
    StudentAdministrationController,
  ],
  providers: [StudentsService, StudentAdministrationService],
  exports: [StudentsService],
})
export class StudentsModule {}
