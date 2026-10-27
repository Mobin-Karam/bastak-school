import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ok } from "../../common/utils/envelope";
import { UserRole } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { CreateDailyReportDto } from "./dto/create-daily-report.dto";
import { CreateRecoveryRequestDto } from "./dto/create-recovery-request.dto";
import { ReportsService } from "./reports.service";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { UserContext } from "../authorization";
import { RecoveryRequestStatus } from "../../database/entities/recovery-request.entity";
import { CreateTeacherStudentReportDto } from "./dto/create-teacher-student-report.dto";

@Controller()
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post("reports")
  @Roles(UserRole.STUDENT)
  saveReport(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateDailyReportDto,
  ) {
    return this.reports.saveReport(user.id, dto).then(ok);
  }

  @Get("reports")
  @Roles(UserRole.STUDENT)
  listReports(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit") limit?: string,
  ) {
    return this.reports.listReports(user.id, limit).then(ok);
  }

  @Post("recovery-requests")
  @Roles(UserRole.STUDENT)
  createRecovery(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateRecoveryRequestDto,
  ) {
    return this.reports.createRecovery(user.id, dto).then(ok);
  }

  @Get("recovery-requests")
  listRecovery(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.recoveryForActor(this.context(user)).then(ok);
  }

  @Patch("recovery-requests/:id")
  @RequireCapabilities("recovery_requests.manage")
  moderate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body("status") status: RecoveryRequestStatus,
  ) {
    return this.reports
      .moderateRecovery(this.context(user), id, status)
      .then(ok);
  }

  @Get("students/:id/reports")
  @RequireCapabilities("reports.read")
  staffReports(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.reports.reportsForStudent(this.context(user), id).then(ok);
  }

  @Post("attendance/sessions/:sessionId/students/:studentId/reports")
  @RequireCapabilities("attendance.class.manage")
  teacherReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param("sessionId") sessionId: string,
    @Param("studentId") studentId: string,
    @Body() dto: CreateTeacherStudentReportDto,
  ) {
    return this.reports
      .createTeacherReport(this.context(user), sessionId, studentId, dto)
      .then(ok);
  }

  @Get("principal/teacher-reports")
  @RequireCapabilities("attendance.review")
  principalTeacherReports(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.teacherReportsForPrincipal(this.context(user)).then(ok);
  }

  @Patch("principal/teacher-reports/:id/seen")
  @RequireCapabilities("attendance.review")
  seenTeacherReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.reports.markTeacherReportSeen(this.context(user), id).then(ok);
  }

  private context(user: AuthenticatedUser): UserContext {
    return {
      ...user,
      roles: user.roles || [user.role],
      capabilities: user.capabilities || [],
      membershipIds: user.membershipIds || [],
      organizationIds: user.organizationIds || [],
    };
  }
}
