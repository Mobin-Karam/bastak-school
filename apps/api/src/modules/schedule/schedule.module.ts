import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolScheduleEntry } from "../../database/entities/school-schedule-entry.entity";
import { User } from "../../database/entities/user.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { ScheduleController } from "./schedule.controller";
import { ScheduleService } from "./schedule.service";
@Module({ imports: [TypeOrmModule.forFeature([SchoolScheduleEntry, Organization, EducationClass, EducationClassEnrollment, User, UserRelationship])], controllers: [ScheduleController], providers: [ScheduleService], exports: [ScheduleService] })
export class ScheduleModule {}
