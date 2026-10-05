import { Controller, Get, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { DashboardService } from "./dashboard.service";

@Controller("dashboard")
export class DashboardController {
  constructor(private dashboard: DashboardService) {}

  @Get()
  get(
    @CurrentUser() user: AuthenticatedUser,
    @Query("context") context?: string,
  ) {
    return this.dashboard.get(user, context).then(ok);
  }

  /**
   * A read-only operational queue. Each source is included only when the
   * active work context has its existing capability; item-level student scope
   * is checked again by the service before a record is returned.
   */
  @Get("attention")
  attention(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit") limit?: string,
  ) {
    return this.dashboard.attentionQueue(user, Number(limit)).then(ok);
  }
}
