import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Organization } from "../../database/entities/organization.entity";
import { SchoolAccessService } from "./school-access.service";

@Module({
  imports: [TypeOrmModule.forFeature([Organization, OrganizationMembership])],
  providers: [SchoolAccessService],
  exports: [SchoolAccessService],
})
export class SchoolAccessModule {}
