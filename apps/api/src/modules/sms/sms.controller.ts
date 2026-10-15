import { Body, Controller, Get, Param, Post } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { UserContext } from "../authorization";
import { AudienceCriteria, SmsAudienceService } from "./sms-audience.service";
import { SmsService } from "./sms.service";
const context = (user: AuthenticatedUser): UserContext => ({ ...user, roles: user.roles || [user.role], capabilities: user.capabilities || [], membershipIds: user.membershipIds || [], organizationIds: user.organizationIds || [] });
@Controller("sms") export class SmsController {
  constructor(private readonly sms: SmsService, private readonly audience: SmsAudienceService) {}
  @Get("provider/status") @RequireCapabilities("sms.manage") status(@CurrentUser() u: AuthenticatedUser) { return this.sms.status(context(u)).then(ok); }
  @Post("provider/configuration") @RequireCapabilities("sms.manage") configure(@CurrentUser() u: AuthenticatedUser, @Body() body: { apiKey?: unknown; lineNumber?: unknown; enabled?: unknown; dryRun?: unknown }) { return this.sms.configureProvider(context(u), u.id, body).then(ok); }
  @Post("audience/preview") @RequireCapabilities("sms.read") preview(@CurrentUser() u: AuthenticatedUser, @Body() criteria: AudienceCriteria) { return this.audience.preview(context(u), criteria).then(ok); }
  @Get("campaigns") @RequireCapabilities("sms.read") list(@CurrentUser() u: AuthenticatedUser) { return this.sms.list(context(u)).then(ok); }
  @Post("campaigns") @RequireCapabilities("sms.send") create(@CurrentUser() u: AuthenticatedUser, @Body() body: { title?: unknown; messageText?: unknown; scheduledAt?: unknown; criteria?: AudienceCriteria }) { return this.sms.create(context(u), u.id, body).then(ok); }
  @Get("campaigns/:id") @RequireCapabilities("sms.read") detail(@CurrentUser() u: AuthenticatedUser, @Param("id") id: string) { return this.sms.detail(context(u), id).then(ok); }
  @Post("campaigns/:id/send") @RequireCapabilities("sms.send") send(@CurrentUser() u: AuthenticatedUser, @Param("id") id: string) { return this.sms.send(context(u), u.id, id).then(ok); }
  @Post("campaigns/:id/retry-failed") @RequireCapabilities("sms.manage") retry(@CurrentUser() u: AuthenticatedUser, @Param("id") id: string) { return this.sms.send(context(u), u.id, id, true).then(ok); }
  @Post("campaigns/:id/cancel") @RequireCapabilities("sms.manage") cancel(@CurrentUser() u: AuthenticatedUser, @Param("id") id: string) { return this.sms.cancel(context(u), u.id, id).then(ok); }
  @Post("campaigns/:id/refresh-status") @RequireCapabilities("sms.manage") refresh(@CurrentUser() u: AuthenticatedUser, @Param("id") id: string) { return this.sms.refreshStatus(context(u), u.id, id).then(ok); }
}
