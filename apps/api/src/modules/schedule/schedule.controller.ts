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
  CreateScheduleTimeBlockDto,
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
