import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
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

  @Get("dormitory/rooms")
  @RequireCapabilities("attendance.read")
  async listDormRooms(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listDormRooms(user, organizationId));
  }

  @Post("dormitory/rooms")
  @RequireCapabilities("attendance.manage")
  async createDormRoom(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return ok(await this.service.createDormRoom(user, body as any));
  }

  @Get("dormitory/rooms/:id/assignments")
  @RequireCapabilities("attendance.read")
  async listDormAssignments(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") roomId: string,
  ) {
    return ok(await this.service.listDormAssignments(user, roomId));
  }

  @Put("dormitory/rooms/:id/assignments")
  @RequireCapabilities("attendance.manage")
  async setDormAssignments(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") roomId: string,
    @Body("studentIds") studentIds: string[],
  ) {
    return ok(
      await this.service.setDormAssignments(user, roomId, studentIds || []),
    );
  }

  @Get("student/attendance/sessions")
  @RequireCapabilities("attendance.read")
  async listStudentAttendanceSessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listAttendanceSessions(user, organizationId));
  }

  @Post("student/attendance/sessions")
  @RequireCapabilities("attendance.manage")
  async createStudentAttendanceSession(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return ok(await this.service.createAttendanceSession(user, body as any));
  }

  @Post("attendance/bulk-mark")
  @RequireCapabilities("attendance.manage")
  async bulkMarkAttendance(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: any,
  ) {
    return ok(await this.service.bulkMarkAttendance(user, body as any));
  }

  @Get("attendance/contexts")
  @RequireCapabilities("attendance.read")
  async listAttendanceContexts(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return ok(await this.service.listAttendanceContexts(user, organizationId));
  }

  @Get("attendance/context/:contextType/:contextId/participants")
  @RequireCapabilities("attendance.read")
  async listAttendanceParticipants(
    @CurrentUser() user: AuthenticatedUser,
    @Param("contextType") contextType: string,
    @Param("contextId") contextId: string,
  ) {
    return ok(
      await this.service.listContextParticipants(user, contextType, contextId),
    );
  }

  @Get("student/attendance-summary")
  @RequireCapabilities("student.profile.read")
  async myAttendanceSummary(@CurrentUser() user: AuthenticatedUser) {
    return ok(await this.service.getStudentAttendanceSummary(user));
  }

  @Get("students/:id/attendance-summary")
  @RequireCapabilities("student.profile.read")
  async studentAttendanceSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") studentId: string,
  ) {
    return ok(await this.service.getStudentAttendanceSummary(user, studentId));
  }

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
