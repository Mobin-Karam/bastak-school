import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { RegistrationProgress } from "../../database/entities/registration-progress.entity";
import { RegistrationRequirement } from "../../database/entities/registration-requirement.entity";
import { StudentContact } from "../../database/entities/student-contact.entity";
import { StudentProfile } from "../../database/entities/student-profile.entity";
import { Student } from "../../database/entities/student.entity";
import { SchoolAccessModule } from "../school-access/school-access.module";
import { RegistrationController } from "./registration.controller";
import { RegistrationService } from "./registration.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Student,
      StudentProfile,
      StudentContact,
      RegistrationRequirement,
      RegistrationProgress,
      Organization,
    ]),
    SchoolAccessModule,
  ],
  controllers: [RegistrationController],
  providers: [RegistrationService],
  exports: [RegistrationService],
})
export class RegistrationModule {}
