import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { AttendanceService } from "./attendance.service";
import {
  BulkMarkAttendanceDto,
  CreateAttendanceSessionDto,
} from "./attendance.dto";

@Controller()
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get("attendance/contexts")
  @RequireCapabilities("attendance.read")
  contexts(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.attendance.listContexts(user, organizationId).then(ok);
  }

  @Get("attendance/context/:contextType/:contextId/participants")
  @RequireCapabilities("attendance.read")
  participants(
    @CurrentUser() user: AuthenticatedUser,
    @Param("contextType") contextType: string,
    @Param("contextId") contextId: string,
  ) {
    return this.attendance
      .listParticipants(user, contextType, contextId)
      .then(ok);
  }

  @Get("student/attendance/sessions")
  @RequireCapabilities("attendance.read")
  sessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.attendance.listSessions(user, organizationId).then(ok);
  }

  @Post("student/attendance/sessions")
  @RequireCapabilities("attendance.manage")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAttendanceSessionDto,
  ) {
    return this.attendance.createSession(user, dto).then(ok);
  }

  @Post("attendance/bulk-mark")
  @RequireCapabilities("attendance.manage")
  bulk(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkMarkAttendanceDto,
  ) {
    return this.attendance.bulkMark(user, dto).then(ok);
  }

  @Get("student/attendance-summary")
  @RequireCapabilities("attendance.self.read")
  selfSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.attendance.summary(user).then(ok);
  }

  @Get("student/attendance")
  @RequireCapabilities("attendance.self.read")
  selfRecords(@CurrentUser() user: AuthenticatedUser) {
    return this.attendance.listSelfRecords(user).then(ok);
  }

  @Get("students/:id/attendance-summary")
  @RequireCapabilities("attendance.read")
  studentSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.attendance.summary(user, id).then(ok);
  }
}
