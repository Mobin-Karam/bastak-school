import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Student } from "../../database/entities/student.entity";
import { StudentSubject } from "../../database/entities/student-subject.entity";
import { Subject } from "../../database/entities/subject.entity";
import { TeacherSubjectAssignment } from "../../database/entities/teacher-subject-assignment.entity";
import { User } from "../../database/entities/user.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { SubjectsController } from "./subjects.controller";
import { SubjectsService } from "./subjects.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Subject,
      StudentSubject,
      Student,
      Organization,
      TeacherSubjectAssignment,
      OrganizationMembership,
      UserRoleAssignment,
      User,
    ]),
  ],
  controllers: [SubjectsController],
  providers: [SubjectsService],
})
export class SubjectsModule {}
