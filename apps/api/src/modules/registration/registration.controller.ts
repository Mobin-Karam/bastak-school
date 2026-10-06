import { Body, Controller, Get, Param, Patch, Put, Query } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { ReviewRegistrationSectionDto, SetRegistrationRequirementsDto, SetStudentContactsDto, SubmitRegistrationSectionDto, UpdateRegistrationProfileDto } from "./registration.dto";
import { RegistrationService } from "./registration.service";

@Controller("registration")
export class RegistrationController {
  constructor(private readonly registration: RegistrationService) {}

  @Get("self")
  @RequireCapabilities("registration.self.read")
  self(@CurrentUser() user: AuthenticatedUser) { return this.registration.self(user).then(ok); }

  @Patch("self/profile")
  @RequireCapabilities("registration.self.update")
  profile(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateRegistrationProfileDto) { return this.registration.updateProfile(user, dto).then(ok); }

  @Put("self/contacts")
  @RequireCapabilities("registration.self.update")
  contacts(@CurrentUser() user: AuthenticatedUser, @Body() dto: SetStudentContactsDto) { return this.registration.setContacts(user, dto.contacts).then(ok); }

  @Patch("self/sections/:sectionCode")
  @RequireCapabilities("registration.self.update")
  submit(@CurrentUser() user: AuthenticatedUser, @Param("sectionCode") sectionCode: string, @Body() dto: SubmitRegistrationSectionDto) { return this.registration.submitSection(user, sectionCode, dto.status).then(ok); }

  @Get("requirements")
  @RequireCapabilities("registration.manage")
  requirements(@CurrentUser() user: AuthenticatedUser, @Query("organizationId") organizationId: string) { return this.registration.requirements(user, organizationId).then(ok); }

  @Put("requirements/:organizationId")
  @RequireCapabilities("registration.manage")
  setRequirements(@CurrentUser() user: AuthenticatedUser, @Param("organizationId") organizationId: string, @Body() dto: SetRegistrationRequirementsDto) { return this.registration.setRequirements(user, organizationId, dto.requirements).then(ok); }

  @Get("students")
  @RequireCapabilities("registration.review")
  students(@CurrentUser() user: AuthenticatedUser, @Query("organizationId") organizationId?: string) { return this.registration.students(user, organizationId).then(ok); }

  @Patch("students/:studentId/sections/:sectionCode")
  @RequireCapabilities("registration.review")
  review(@CurrentUser() user: AuthenticatedUser, @Param("studentId") studentId: string, @Param("sectionCode") sectionCode: string, @Body() dto: ReviewRegistrationSectionDto) { return this.registration.reviewSection(user, studentId, sectionCode, dto).then(ok); }
}
