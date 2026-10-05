import { Body, Controller, Get, Param, Patch, Post } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ok } from "../../common/utils/envelope";
import { PermissionRequestStatus } from "../../database/entities/permission-request.entity";
import { UserRole } from "../../database/entities/user.entity";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuthenticatedUser } from "../auth";
import { PermissionRequestsService } from "./permission-requests.service";
@Controller()
export class PermissionRequestsController { constructor(private service: PermissionRequestsService) {} @Post("student/permission-requests") @Roles(UserRole.STUDENT) @RequireCapabilities("permission_requests.create") create(@CurrentUser() user: AuthenticatedUser, @Body() body: Record<string, string>) { return this.service.create(user, body).then(ok); } @Get("student/permission-requests") @Roles(UserRole.STUDENT) @RequireCapabilities("permission_requests.create") mine(@CurrentUser() user: AuthenticatedUser) { return this.service.mine(user).then(ok); } @Get("permission-requests") @RequireCapabilities("permission_requests.read") list(@CurrentUser() user: AuthenticatedUser) { return this.service.list(user).then(ok); } @Patch("permission-requests/:id") @RequireCapabilities("permission_requests.review") decide(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() body: { status?: PermissionRequestStatus; supervisorNote?: string }) { if (body.status !== PermissionRequestStatus.APPROVED && body.status !== PermissionRequestStatus.REJECTED) throw new ApiException(400, "INVALID_PERMISSION_REQUEST_STATUS", "وضعیت بررسی معتبر نیست."); return this.service.decide(user, id, body.status, body.supervisorNote).then(ok); } }
