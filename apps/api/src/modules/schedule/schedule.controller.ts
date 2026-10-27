import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import {
  ArchiveScheduleEntryDto,
  CreateScheduleEntriesDto,
  CreateScheduleTimeBlockDto,
  CreateScheduleTemplateDto,
  ScheduleSubstitutionDecisionDto,
  ScheduleSubstitutionRequestDto,
  SaveScheduleEntryDto,
} from "./schedule.dto";
import { ScheduleService } from "./schedule.service";

@Controller("schedule")
export class ScheduleController {
  constructor(private readonly schedule: ScheduleService) {}
  @Get() @RequireCapabilities("schedule.read") list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.schedule.list(user, organizationId).then(ok);
  }
  @Get("substitution-requests")
  @RequireCapabilities("schedule.read")
  substitutionRequests(@CurrentUser() user: AuthenticatedUser) {
    return this.schedule.substitutionRequests(user).then(ok);
  }
  @Get("substitution-slots")
  @RequireCapabilities("schedule.read")
  substitutionSlots(
    @CurrentUser() user: AuthenticatedUser,
    @Query("date") date: string,
  ) {
    return this.schedule.substitutionSlots(user, date).then(ok);
  }
  @Post("substitution-requests")
  @RequireCapabilities("attendance.class.manage")
  requestSubstitution(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ScheduleSubstitutionRequestDto,
  ) {
    return this.schedule.requestSubstitution(user, dto).then(ok);
  }
  @Post("substitution-requests/:id/review")
  @RequireCapabilities("schedule.publish")
  reviewSubstitution(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ScheduleSubstitutionDecisionDto,
  ) {
    return this.schedule.reviewSubstitution(user, id, dto).then(ok);
  }
  @Get("templates") @RequireCapabilities("schedule.read") templates(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.schedule.listTemplates(user, organizationId).then(ok);
  }
  @Post("templates") @RequireCapabilities("schedule.create") createTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduleTemplateDto,
  ) {
    return this.schedule.createTemplate(user, dto).then(ok);
  }
  @Post("templates/:id/apply")
  @RequireCapabilities("schedule.update")
  applyTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.schedule.applyTemplate(user, id).then(ok);
  }
  @Patch("templates/:id/archive")
  @RequireCapabilities("schedule.archive")
  archiveTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.schedule.archiveTemplate(user, id).then(ok);
  }
  @Patch("templates/:id/restore")
  @RequireCapabilities("schedule.archive")
  restoreTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.schedule.restoreTemplate(user, id).then(ok);
  }
  @Delete("templates/:id")
  @RequireCapabilities("schedule.delete")
  removeTemplate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.schedule.removeTemplate(user, id).then(ok);
  }
  @Get("export") @RequireCapabilities("schedule.export") export(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.schedule.export(user, organizationId).then(ok);
  }
  @Get("time-blocks") @RequireCapabilities("schedule.read") timeBlocks(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.schedule.listTimeBlocks(user, organizationId).then(ok);
  }
  @Post("time-blocks") @RequireCapabilities("schedule.update") createTimeBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduleTimeBlockDto,
  ) {
    return this.schedule.createTimeBlock(user, dto).then(ok);
  }
  @Delete("time-blocks/:id")
  @RequireCapabilities("schedule.update")
  removeTimeBlock(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.schedule.removeTimeBlock(user, id).then(ok);
  }
  @Post() @RequireCapabilities("schedule.create") create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: SaveScheduleEntryDto,
  ) {
    return this.schedule.create(user, dto).then(ok);
  }
  @Post("batch") @RequireCapabilities("schedule.create") createBatch(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateScheduleEntriesDto,
  ) {
    return this.schedule.createMany(user, dto.entries).then(ok);
  }
  @Post("import/preview") @RequireCapabilities("schedule.import") preview(
    @CurrentUser() user: AuthenticatedUser,
    @Body("entries") entries: SaveScheduleEntryDto[],
  ) {
    return this.schedule.previewImport(user, entries || []).then(ok);
  }
  @Post("import/commit") @RequireCapabilities("schedule.import") commit(
    @CurrentUser() user: AuthenticatedUser,
    @Body("entries") entries: SaveScheduleEntryDto[],
  ) {
    return this.schedule.commitImport(user, entries || []).then(ok);
  }
  @Patch(":id") @RequireCapabilities("schedule.update") update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SaveScheduleEntryDto,
  ) {
    return this.schedule.update(user, id, dto).then(ok);
  }
  @Patch(":id/archive") @RequireCapabilities("schedule.archive") archive(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ArchiveScheduleEntryDto,
  ) {
    return this.schedule.archive(user, id, dto).then(ok);
  }
  @Delete(":id") @RequireCapabilities("schedule.delete") remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.schedule.remove(user, id).then(ok);
  }
}
