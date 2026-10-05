import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuditLog } from "../../database/entities/audit-log.entity";
import { OrganizationMembership } from "../../database/entities/organization-membership.entity";
import { PermissionRequest } from "../../database/entities/permission-request.entity";
import { Student } from "../../database/entities/student.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { NotificationsModule } from "../notifications/notifications.module";
import { PermissionRequestsController } from "./permission-requests.controller";
import { PermissionRequestsService } from "./permission-requests.service";
@Module({ imports: [TypeOrmModule.forFeature([PermissionRequest, Student, OrganizationMembership, UserRoleAssignment, AuditLog]), NotificationsModule], controllers: [PermissionRequestsController], providers: [PermissionRequestsService] }) export class PermissionRequestsModule {}
