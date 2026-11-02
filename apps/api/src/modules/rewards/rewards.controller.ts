import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { AdjustRewardDto, ReverseRewardDto } from "./rewards.dto";
import { RewardsService } from "./rewards.service";

@Controller("rewards")
export class RewardsController {
  constructor(private readonly rewards: RewardsService) {}
  @Get("me/summary") @RequireCapabilities("rewards.self.read") meSummary(@CurrentUser() user: AuthenticatedUser) { return this.rewards.mySummary(user).then(ok); }
  @Get("me/ledger") @RequireCapabilities("rewards.self.read") meLedger(@CurrentUser() user: AuthenticatedUser, @Query("page") page?: number, @Query("limit") limit?: number) { return this.rewards.myLedger(user, Number(page) || 1, Number(limit) || 25).then(ok); }
  @Get("students/:id/summary") @RequireCapabilities("rewards.read") studentSummary(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) { return this.rewards.studentSummary(user, id).then(ok); }
  @Get("students/:id/ledger") @RequireCapabilities("rewards.read") studentLedger(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Query("page") page?: number, @Query("limit") limit?: number) { return this.rewards.studentLedger(user, id, Number(page) || 1, Number(limit) || 25).then(ok); }
  @Post("adjustments") @RequireCapabilities("rewards.adjust") adjust(@CurrentUser() user: AuthenticatedUser, @Body() dto: AdjustRewardDto) { return this.rewards.adjust(user, dto).then(ok); }
  @Get("transactions/recent") @RequireCapabilities("rewards.read") recent(@CurrentUser() user: AuthenticatedUser) { return this.rewards.recent(user).then(ok); }
  @Get("transactions/:id") @RequireCapabilities("rewards.read") transaction(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) { return this.rewards.transaction(user, id).then(ok); }
  @Post("transactions/:id/reverse") @RequireCapabilities("rewards.reverse") reverse(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: ReverseRewardDto) { return this.rewards.reverse(user, id, dto).then(ok); }
  @Get("transactions") @RequireCapabilities("rewards.read") transactions(@CurrentUser() user: AuthenticatedUser, @Query() query: { page?: number; limit?: number; from?: string; to?: string; studentId?: string; sourceType?: string }) { return this.rewards.transactions(user, query).then(ok); }
}
