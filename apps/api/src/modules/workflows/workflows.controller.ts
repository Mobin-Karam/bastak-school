import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { WorkflowsService } from "./workflows.service";

@Controller()
export class WorkflowsController {
  constructor(private readonly service: WorkflowsService) {}

  @Get("student/leave-requests")
  @RequireCapabilities("leave.read")
  async listStudentLeaveRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listLeaveRequests(user, organizationId));
  }

  @Post("student/leave-requests")
  @RequireCapabilities("leave.manage")
  async createStudentLeaveRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return ok(await this.service.createLeaveRequest(user, body as any));
  }

  @Get("leave-requests")
  @RequireCapabilities("leave.read")
  async listLeaveRequests(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listLeaveRequests(user, organizationId));
  }

  @Patch("leave-requests/:id")
  @RequireCapabilities("leave.manage")
  async reviewLeaveRequest(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { status: string; note?: string },
  ) {
    return ok(await this.service.reviewLeaveRequest(user, id, body as any));
  }

  @Get("student/exit-permissions")
  @RequireCapabilities("exit.read")
  async listStudentExitPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listExitPermissions(user, organizationId));
  }

  @Post("student/exit-permissions")
  @RequireCapabilities("exit.manage")
  async createStudentExitPermission(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return ok(await this.service.createExitPermission(user, body as any));
  }

  @Get("exit-permissions")
  @RequireCapabilities("exit.read")
  async listExitPermissions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listExitPermissions(user, organizationId));
  }

  @Patch("exit-permissions/:id")
  @RequireCapabilities("exit.manage")
  async reviewExitPermission(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { status: string; note?: string },
  ) {
    return ok(await this.service.reviewExitPermission(user, id, body as any));
  }

  @Post("exit-permissions/:id/departure")
  @RequireCapabilities("exit.manage")
  departure(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.recordExitMovement(user, id, "departure").then(ok);
  }

  @Post("exit-permissions/:id/return")
  @RequireCapabilities("exit.manage")
  return(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.service.recordExitMovement(user, id, "return").then(ok);
  }

  @Get("attendance/occupancy")
  @RequireCapabilities("attendance.read")
  occupancy(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.service.occupancy(user, organizationId).then(ok);
  }

  @Get("student/letters")
  @RequireCapabilities("letters.read")
  async listStudentLetters(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listLetters(user, organizationId));
  }

  @Post("student/letters")
  @RequireCapabilities("letters.manage")
  async createStudentLetter(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return ok(await this.service.createLetter(user, body as any));
  }

  @Get("letters")
  @RequireCapabilities("letters.read")
  async listLetters(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listLetters(user, organizationId));
  }

  @Patch("letters/:id")
  @RequireCapabilities("letters.manage")
  async reviewLetter(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: { status?: string; read?: boolean },
  ) {
    return ok(await this.service.reviewLetter(user, id, body as any));
  }
}
