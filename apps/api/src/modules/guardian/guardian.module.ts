import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { DailyReport } from "../../database/entities/daily-report.entity";
import { Encouragement } from "../../database/entities/encouragement.entity";
import { ExamAssignment } from "../../database/entities/exam-assignment.entity";
import { Plan } from "../../database/entities/plan.entity";
import { Student } from "../../database/entities/student.entity";
import { StudySession } from "../../database/entities/study-session.entity";
import { User } from "../../database/entities/user.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { ExamsModule } from "../exams/exams.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { GuardianController } from "./guardian.controller";
import { GuardianService } from "./guardian.service";
@Module({
  imports: [
    TypeOrmModule.forFeature([
      UserRelationship,
      Student,
      Plan,
      StudySession,
      ExamAssignment,
      DailyReport,
      Encouragement,
      User,
      AuditLog,
    ]),
    NotificationsModule,
    ExamsModule,
  ],
  controllers: [GuardianController],
  providers: [GuardianService],
})
export class GuardianModule {}
