import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EducationBook } from "../../database/entities/education-book.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Student } from "../../database/entities/student.entity";
import { Plan } from "../../database/entities/plan.entity";
import { LearningResourceAssignment } from "../../database/entities/learning-resource-assignment.entity";
import { ExamAttempt } from "../../database/entities/exam-attempt.entity";
import { DailyReport } from "../../database/entities/daily-report.entity";
import { EducationCatalogController } from "./education-catalog.controller";
import { EducationCatalogService } from "./education-catalog.service";

@Module({
  imports: [TypeOrmModule.forFeature([EducationBook, Student, Plan, LearningResourceAssignment, ExamAttempt, DailyReport, AuditLog, OrganizationMembership])],
  controllers: [EducationCatalogController],
  providers: [EducationCatalogService],
  exports: [EducationCatalogService],
})
export class EducationCatalogModule {}
