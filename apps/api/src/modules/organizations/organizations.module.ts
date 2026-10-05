import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Role } from "../../database/entities/role.entity";
import { User } from "../../database/entities/user.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { OrganizationsController } from "./organizations.controller";
import { OrganizationsService } from "./organizations.service";
@Module({ imports: [TypeOrmModule.forFeature([Organization, OrganizationMembership, User, Role, UserRoleAssignment])], controllers: [OrganizationsController], providers: [OrganizationsService] })
export class OrganizationsModule {}
