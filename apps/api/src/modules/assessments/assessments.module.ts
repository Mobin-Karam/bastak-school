import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Exam } from "../../database/entities/exam.entity";
import { ExamAssignment } from "../../database/entities/exam-assignment.entity";
import { ExamClassAssignment } from "../../database/entities/exam-class-assignment.entity";
import { ExamAttempt } from "../../database/entities/exam-attempt.entity";
import { ExamRetryRequest } from "../../database/entities/exam-retry-request.entity";
import { ExamSyllabus } from "../../database/entities/exam-syllabus.entity";
import { Quiz } from "../../database/entities/quiz.entity";
import { QuizAttempt } from "../../database/entities/quiz-attempt.entity";
import { QuizAssignment } from "../../database/entities/quiz-assignment.entity";
import { QuizClassAssignment } from "../../database/entities/quiz-class-assignment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { QuizQuestion } from "../../database/entities/quiz-question.entity";
import { Student } from "../../database/entities/student.entity";
import { SyllabusProgress } from "../../database/entities/syllabus-progress.entity";
import { AuthorizationModule } from "../authorization/authorization.module";
import { AssessmentsController } from "./assessments.controller";
import { AssessmentsService } from "./assessments.service";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Exam,
      ExamAssignment,
      ExamClassAssignment,
      ExamAttempt,
      ExamSyllabus,
      SyllabusProgress,
      ExamRetryRequest,
      Quiz,
      QuizQuestion,
      QuizAttempt,
      QuizAssignment,
      QuizClassAssignment,
      EducationClass,
      EducationClassEnrollment,
      Student,
    ]),
    AuthorizationModule,
  ],
  controllers: [AssessmentsController],
  providers: [AssessmentsService],
})
export class AssessmentsModule {}
