import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { PlanTemplatesService } from "./plan-templates.service";
import {
  ApplyPlanTemplateDto,
  CreatePlanTemplateDto,
  PreviewPlanTemplateApplyDto,
} from "./plan-template.dto";
const context = (u: AuthenticatedUser) => ({
  ...u,
  roles: u.roles || [u.role],
  capabilities: u.capabilities || [],
  membershipIds: u.membershipIds || [],
  organizationIds: u.organizationIds || [],
});
@Controller("plan-templates")
export class PlanTemplatesController {
  constructor(private service: PlanTemplatesService) {}
  @Get() @RequireCapabilities("plan_templates.read") list(
    @CurrentUser() u: AuthenticatedUser,
    @Query("organizationId") id: string,
    @Query("state") state?: string,
  ) {
    return this.service.list(context(u), id, state).then(ok);
  }
  @Post() @RequireCapabilities("plan_templates.manage") create(
    @CurrentUser() u: AuthenticatedUser,
    @Body() body: CreatePlanTemplateDto,
  ) {
    return this.service.create(context(u), body).then(ok);
  }
  @Post(":id/publish") @RequireCapabilities("plan_templates.publish") publish(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.service.publish(context(u), id).then(ok);
  }
  @Post(":id/preview-apply")
  @RequireCapabilities("plan_templates.read", "plans.create")
  preview(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: PreviewPlanTemplateApplyDto,
  ) {
    return this.service.previewApply(context(u), id, body).then(ok);
  }
  @Post(":id/apply")
  @RequireCapabilities("plan_templates.read", "plans.create")
  apply(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id") id: string,
    @Body() body: ApplyPlanTemplateDto,
  ) {
    return this.service.apply(context(u), id, body).then(ok);
  }
}
