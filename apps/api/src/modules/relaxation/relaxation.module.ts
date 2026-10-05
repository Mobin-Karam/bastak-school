import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { RelaxationTrack } from "../../database/entities/relaxation-track.entity";
import { StudentDailyRelaxation } from "../../database/entities/student-daily-relaxation.entity";
import { Student } from "../../database/entities/student.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { RelaxationAdminController, RelaxationStudentController } from "./relaxation.controller";
import { RelaxationService } from "./relaxation.service";

@Module({ imports: [TypeOrmModule.forFeature([RelaxationTrack, StudentDailyRelaxation, Student, OrganizationMembership, AuditLog])], controllers: [RelaxationAdminController, RelaxationStudentController], providers: [RelaxationService] })
export class RelaxationModule {}
