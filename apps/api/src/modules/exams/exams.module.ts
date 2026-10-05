import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { ExamAttempt } from "../../database/entities/exam-attempt.entity";
import { Exam } from "../../database/entities/exam.entity";
import { Question } from "../../database/entities/question.entity";
import { Student } from "../../database/entities/student.entity";
import { ExamsController } from "./exams.controller";
import { ExamsService } from "./exams.service";
import { ExamScoringService } from "./exam-scoring.service";
import { ExamAssignment } from "../../database/entities/exam-assignment.entity";
import { ExamRetryRequest } from "../../database/entities/exam-retry-request.entity";
import { Mistake } from "../../database/entities/mistake.entity";
import { Organization } from "../../database/entities/organization.entity";
import { User } from "../../database/entities/user.entity";
import { ExamClassAssignment } from "../../database/entities/exam-class-assignment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      Question,
      ExamAttempt,
      ExamAssignment,
      ExamClassAssignment,
      EducationClass,
      EducationClassEnrollment,
      ExamRetryRequest,
      Student,
      User,
      Organization,
      Mistake,
    ]),
  ],
  controllers: [ExamsController],
  providers: [ExamsService, ExamScoringService],
  exports: [ExamsService],
})
export class ExamsModule {}
