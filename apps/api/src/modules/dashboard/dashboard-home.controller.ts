import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { DashboardHomeService } from "./dashboard-home.service";

@Controller("dashboard")
export class DashboardHomeController {
  constructor(private readonly home: DashboardHomeService) {}

  @Get("home")
  get(@CurrentUser() user: AuthenticatedUser, @Query("context") context?: string) {
    return this.home.get(user, context).then(ok);
  }

  @Get("home/work-queue")
  attention(@CurrentUser() user: AuthenticatedUser, @Query("limit") limit?: string) {
    return this.home.attention(user, Number(limit)).then(ok);
  }
}
