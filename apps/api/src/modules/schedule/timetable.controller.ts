import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { TimetableService } from "./timetable.service";
import {
  TimetableQueryDto,
  TimetablePageDto,
  TimetableBulkDto,
  TimetableAttendanceDto,
  TimetableConfigDto,
  TimetableImportDto,
  TimetableLessonWriteDto,
  TimetableOverrideDto,
  TimetablePublishDto,
  TimetableRevisionDto,
  TimetableVersionDto,
  TimetableSubstitutionRequestDto,
  TimetableSubstitutionDecisionDto,
} from "./timetable.dto";
@Controller("schedule/timetable")
export class TimetableController {
  constructor(private readonly timetable: TimetableService) {}
  @Post("versions/:id/substitution-requests")
  @RequireCapabilities("attendance.class.manage")
  requestSubstitution(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableSubstitutionRequestDto,
  ) {
    return this.timetable.requestSubstitution(user, id, dto).then(ok);
  }
  @Post("substitution-requests/:id/review")
  @RequireCapabilities("schedule.publish")
  reviewSubstitution(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableSubstitutionDecisionDto,
  ) {
    return this.timetable.reviewSubstitution(user, id, dto).then(ok);
  }
  @Get(":organizationId") @RequireCapabilities("schedule.read") workspace(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query("versionId") versionId?: string,
    @Query("startsOn") startsOn?: string,
  ) {
    return this.timetable.workspace(user, org, versionId, startsOn).then(ok);
  }
  @Get(":organizationId/attendance-report")
  @RequireCapabilities("schedule.read.all")
  attendanceReport(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() query: TimetableQueryDto,
  ) {
    return this.timetable.attendanceReport(user, org, query).then(ok);
  }
  @Get(":organizationId/versions")
  @RequireCapabilities("schedule.read")
  versions(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() query: TimetableQueryDto,
  ) {
    return this.timetable.versions(u, org, query).then(ok);
  }
  @Get(":organizationId/occurrences")
  @RequireCapabilities("schedule.read")
  occurrences(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() query: TimetableQueryDto,
  ) {
    return this.timetable.occurrences(u, org, query).then(ok);
  }
  @Get("versions/:id/conflicts")
  @RequireCapabilities("schedule.read.all")
  conflicts(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
  ) {
    return this.timetable.conflicts(u, id).then(ok);
  }
  @Get("versions/:id/history")
  @RequireCapabilities("schedule.read.all")
  history(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Query() page: TimetablePageDto,
  ) {
    return this.timetable.history(u, id, page).then(ok);
  }
  @Post("versions/:id/archive")
  @RequireCapabilities("schedule.archive")
  archive(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetablePublishDto,
  ) {
    return this.timetable.archive(u, id, dto).then(ok);
  }
  @Post("versions/:id/bulk/preview")
  @RequireCapabilities("schedule.update")
  bulkPreview(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableBulkDto,
  ) {
    return this.timetable.bulk(u, id, dto, true).then(ok);
  }
  @Post("versions/:id/bulk") @RequireCapabilities("schedule.update") bulk(
    @CurrentUser() u: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableBulkDto,
  ) {
    return this.timetable.bulk(u, id, dto).then(ok);
  }
  @Post(":organizationId/config")
  @RequireCapabilities("schedule.update")
  config(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: TimetableConfigDto,
  ) {
    return this.timetable.config(user, org, dto).then(ok);
  }
  @Post(":organizationId/versions")
  @RequireCapabilities("schedule.create")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: TimetableVersionDto,
  ) {
    return this.timetable.createVersion(user, org, dto).then(ok);
  }
  @Post("versions/:id/lessons") @RequireCapabilities("schedule.create") lesson(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableLessonWriteDto,
  ) {
    return this.timetable.writeLesson(user, id, dto).then(ok);
  }
  @Post("versions/:id/lessons/preview")
  @RequireCapabilities("schedule.create")
  preview(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableLessonWriteDto,
  ) {
    return this.timetable.writeLesson(user, id, dto, undefined, true).then(ok);
  }
  @Patch("versions/:id/lessons/:lessonId")
  @RequireCapabilities("schedule.update")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() dto: TimetableLessonWriteDto,
  ) {
    return this.timetable.writeLesson(user, id, dto, lessonId).then(ok);
  }
  @Post("versions/:id/lessons/:lessonId/preview")
  @RequireCapabilities("schedule.update")
  previewUpdate(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() dto: TimetableLessonWriteDto,
  ) {
    return this.timetable.writeLesson(user, id, dto, lessonId, true).then(ok);
  }
  @Delete("versions/:id/lessons/:lessonId")
  @RequireCapabilities("schedule.delete")
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Param("lessonId", ParseUUIDPipe) lessonId: string,
    @Body() dto: TimetableRevisionDto,
  ) {
    return this.timetable
      .removeLesson(user, id, lessonId, dto.expectedRevision)
      .then(ok);
  }
  @Post("versions/:id/publish")
  @RequireCapabilities("schedule.publish")
  publish(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetablePublishDto,
  ) {
    return this.timetable.publish(user, id, dto).then(ok);
  }
  @Post("versions/:id/overrides")
  @RequireCapabilities("schedule.publish")
  override(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableOverrideDto,
  ) {
    return this.timetable.override(user, id, dto).then(ok);
  }
  @Post("versions/:id/import/preview")
  @RequireCapabilities("schedule.import")
  previewImport(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableImportDto,
  ) {
    return this.timetable.previewImport(user, id, dto).then(ok);
  }
  @Post("versions/:id/import/commit")
  @RequireCapabilities("schedule.import")
  import(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableImportDto,
  ) {
    return this.timetable.commitImport(user, id, dto).then(ok);
  }
  @Post("lessons/:id/attendance")
  @RequireCapabilities("attendance.class.manage")
  attendance(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: TimetableAttendanceDto,
  ) {
    return this.timetable.openAttendance(user, id, dto.date).then(ok);
  }
}
