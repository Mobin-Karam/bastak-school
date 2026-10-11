import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { AttendanceOperationsService } from "./attendance-operations.service";
import {
  AttendancePoolCheckInDto,
  CreateAttendancePoolDto,
  DelegatedDormAttendanceDto,
  SetDormAttendanceDelegateDto,
} from "./attendance.dto";

@Controller()
export class AttendanceOperationsController {
  constructor(private readonly operations: AttendanceOperationsService) {}
  @Get("attendance/delegates")
  @RequireCapabilities("attendance.delegate")
  delegates(@CurrentUser() user: AuthenticatedUser) {
    return this.operations.delegates(user).then(ok);
  }
  @Get("attendance/dorm-residents")
  @RequireCapabilities("attendance.delegate")
  residents(@CurrentUser() user: AuthenticatedUser) { return this.operations.dormResidents(user).then(ok); }
  @Put("attendance/dorm/delegate-all")
  @RequireCapabilities("attendance.delegate")
  delegateAll(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetDormAttendanceDelegateDto) { return this.operations.setDormWideDelegate(user, dto).then(ok); }
  @Delete("attendance/dorm/delegate-all")
  @RequireCapabilities("attendance.delegate")
  revokeAll(@CurrentUser() user: AuthenticatedUser) { return this.operations.revokeDormWideDelegate(user).then(ok); }
  @Put("attendance/dorm/:roomId/delegate")
  @RequireCapabilities("attendance.delegate")
  delegate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("roomId") id: string,
    @Body() dto: SetDormAttendanceDelegateDto,
  ) {
    return this.operations.setDelegate(user, id, dto).then(ok);
  }
  @Delete("attendance/dorm/:roomId/delegate")
  @RequireCapabilities("attendance.delegate")
  revoke(@CurrentUser() user: AuthenticatedUser, @Param("roomId") id: string) {
    return this.operations.revokeDelegate(user, id).then(ok);
  }
  @Get("attendance/pools")
  @RequireCapabilities("attendance.review")
  pools(@CurrentUser() user: AuthenticatedUser) {
    return this.operations.pools(user).then(ok);
  }
  @Post("attendance/pools")
  @RequireCapabilities("attendance.review", "attendance.manage")
  createPool(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAttendancePoolDto,
  ) {
    return this.operations.createPool(user, dto).then(ok);
  }
  @Post("attendance/pools/:id/close")
  @RequireCapabilities("attendance.review", "attendance.manage")
  closePool(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.operations.closePool(user, id).then(ok);
  }
  @Get("attendance/overview")
  @RequireCapabilities("attendance.review")
  overview(@CurrentUser() user: AuthenticatedUser) {
    return this.operations.dailyOverview(user).then(ok);
  }
  @Get("attendance/staff-sessions")
  @RequireCapabilities("attendance.review")
  sessions(@CurrentUser() user: AuthenticatedUser) {
    return this.operations.staffSessions(user).then(ok);
  }
  @Get("attendance/students/:id/profile")
  @RequireCapabilities("attendance.review")
  profile(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.operations.staffProfile(user, id).then(ok);
  }
  @Get("student/attendance/encouragement")
  @RequireCapabilities("attendance.self.read")
  encouragement(@CurrentUser() user: AuthenticatedUser) {
    return this.operations.encouragement(user).then(ok);
  }
  @Get("student/attendance/dorm-assignments")
  @RequireCapabilities("attendance.self.read")
  assignments(@CurrentUser() user: AuthenticatedUser) {
    return this.operations.myDormAssignments(user).then(ok);
  }
  @Post("student/attendance/dorm-assignments/:id/mark")
  @RequireCapabilities("attendance.self.read")
  markDorm(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: DelegatedDormAttendanceDto,
  ) {
    return this.operations.markDorm(user, id, dto).then(ok);
  }
  @Get("student/attendance/pools")
  @RequireCapabilities("attendance.self.read")
  myPools(@CurrentUser() user: AuthenticatedUser) {
    return this.operations.myPools(user).then(ok);
  }
  @Post("student/attendance/pools/:id/check-in")
  @RequireCapabilities("attendance.self.read")
  checkIn(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() _dto: AttendancePoolCheckInDto,
  ) {
    return this.operations.checkIn(user, id).then(ok);
  }
}
