import { Controller, Get, Query } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { PrincipalDashboardService } from "./principal-dashboard.service";

@Controller("dashboard")
export class PrincipalDashboardController {
  constructor(private readonly dashboard: PrincipalDashboardService) {}

  @Get("principal")
  @RequireCapabilities("students.read")
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Query("from") from?: string,
    @Query("to") to?: string,
  ) {
    return this.dashboard.get(user, from, to).then(ok);
  }
}
