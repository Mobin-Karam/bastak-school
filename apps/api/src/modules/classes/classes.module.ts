import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EducationBook } from "../../database/entities/education-book.entity";
import { EducationClassBook } from "../../database/entities/education-class-book.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { EducationClass } from "../../database/entities/education-class.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { Student } from "../../database/entities/student.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { User } from "../../database/entities/user.entity";
import { ClassesController } from "./classes.controller";
import { ClassesService } from "./classes.service";
import { EducationCatalogModule } from "../education-catalog/education-catalog.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      EducationClass,
      EducationClassBook,
      EducationClassEnrollment,
      EducationBook,
      Organization,
      OrganizationMembership,
      Student,
      User,
      UserRoleAssignment,
    ]),
    EducationCatalogModule,
  ],
  controllers: [ClassesController],
  providers: [ClassesService],
})
export class ClassesModule {}
