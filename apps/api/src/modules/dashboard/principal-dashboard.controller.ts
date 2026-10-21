import { Controller, Get, Query } from "@nestjs/common";
import { RequireAnyCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { PrincipalDashboardService } from "./principal-dashboard.service";

@Controller("dashboard")
export class PrincipalDashboardController {
  constructor(private readonly dashboard: PrincipalDashboardService) {}

  @Get("principal")
  @RequireAnyCapabilities(
    "students.read",
    "attendance.read",
    "attendance.review",
    "attendance.reports.read",
    "analytics.read",
    "leave.read",
    "exit.read",
    "permission_requests.read",
    "schedule.read.all",
  )
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
    @Query("classId") classId?: string,
  ) {
    return this.dashboard.get(user, from, to, classId).then(ok);
  }
}
