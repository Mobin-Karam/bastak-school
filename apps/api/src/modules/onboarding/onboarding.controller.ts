import { Body, Controller, Get, Param, Patch, Post, Req } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { FastifyRequest } from "fastify";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { ok } from "../../common/utils/envelope";
import { AssignStudentOnboardingDto, PlatformBootstrapDto, SetOrganizationStudentSignupDto, SetPlatformStudentSignupDto, StudentSignupDto } from "./onboarding.dto";
import { AuthenticatedUser } from "../auth";
import { OnboardingService } from "./onboarding.service";
import { SignupThrottleService } from "./signup-throttle.service";

@Controller("onboarding")
export class OnboardingController {
  constructor(private service: OnboardingService, private signupThrottle: SignupThrottleService) {}
  @Post("student-signup") async signup(@Req() request: FastifyRequest, @Body() dto: StudentSignupDto) { await this.signupThrottle.record(request.ip); return this.service.signup(dto).then(ok); }
  @Get("student-signup-options") signupOptions() { return this.service.publicSignupOptions().then(ok); }
  @Get("student-signup-policy") @RequireCapabilities("organization.manage") platformSignupPolicy(@CurrentUser() user: AuthenticatedUser) { return this.service.getPlatformSignupPolicy(user).then(ok); }
  @Patch("student-signup-policy") @RequireCapabilities("organization.manage") platformPolicy(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetPlatformStudentSignupDto) { return this.service.setPlatformSignupPolicy(user, dto.enabled).then(ok); }
  @Patch("organizations/:id/student-signup-policy") @RequireCapabilities("organization.manage") organizationPolicy(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: SetOrganizationStudentSignupDto) { return this.service.setOrganizationSignupPolicy(user, id, dto).then(ok); }
  @Get("platform-bootstrap") bootstrapStatus() { return this.service.platformBootstrapStatus().then(ok); }
  @Post("platform-bootstrap") async bootstrap(@Req() request: FastifyRequest, @Body() dto: PlatformBootstrapDto) { await this.signupThrottle.record(request.ip); return this.service.bootstrapPlatformAdmin(dto).then(ok); }
  @Get("students/pending") @RequireCapabilities("student_onboarding.manage") pending() { return this.service.pending().then(ok); }
  @Post("students/:id/assign") @RequireCapabilities("student_onboarding.manage") assign(@Param("id") id: string, @Body() dto: AssignStudentOnboardingDto) { return this.service.assign(id, dto).then(ok); }
}
