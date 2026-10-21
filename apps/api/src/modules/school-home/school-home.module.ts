import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { EducationClass } from "../../database/entities/education-class.entity";
import { EducationClassEnrollment } from "../../database/entities/education-class-enrollment.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolAnnouncement } from "../../database/entities/school-announcement.entity";
import { SchoolAnnouncementRecipient } from "../../database/entities/school-announcement-recipient.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { User } from "../../database/entities/user.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { SchoolPrayerTime } from "../../database/entities/school-prayer-time.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { SchoolHomeController } from "./school-home.controller";
import { SchoolHomeService } from "./school-home.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Organization,
      SchoolPrayerTime,
      SchoolAnnouncement,
      SchoolAnnouncementRecipient,
      OrganizationMembership,
      User,
      EducationClass,
      EducationClassEnrollment,
      UserRelationship,
    ]),
    NotificationsModule,
  ],
  controllers: [SchoolHomeController],
  providers: [SchoolHomeService],
  exports: [SchoolHomeService],
})
export class SchoolHomeModule {}
