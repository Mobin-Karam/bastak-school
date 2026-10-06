import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { Student } from "../../database/entities/student.entity";
import { StudyGroupMembership } from "../../database/entities/study-group-membership.entity";
import { StudyGroup } from "../../database/entities/study-group.entity";
import { SchoolAccessModule } from "../school-access/school-access.module";
import { ClassGroupsController } from "./class-groups.controller";
import { ClassGroupsService } from "./class-groups.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([EducationClass, EducationClassEnrollment, StudyGroup, StudyGroupMembership, Student]),
    SchoolAccessModule,
  ],
  controllers: [ClassGroupsController],
  providers: [ClassGroupsService],
  exports: [ClassGroupsService],
})
export class ClassGroupsModule {}
