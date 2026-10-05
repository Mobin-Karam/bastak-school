import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Organization } from "../../database/entities/organization.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { Student } from "../../database/entities/student.entity";
import { User } from "../../database/entities/user.entity";
import { UserRelationship } from "../../database/entities/user-relationship.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { RelationshipsController } from "./relationships.controller";
import { RelationshipsService } from "./relationships.service";
@Module({ imports: [TypeOrmModule.forFeature([UserRelationship, User, Student, Organization, OrganizationMembership, UserRoleAssignment]), NotificationsModule], controllers: [RelationshipsController], providers: [RelationshipsService], exports: [RelationshipsService] })
export class RelationshipsModule {}
