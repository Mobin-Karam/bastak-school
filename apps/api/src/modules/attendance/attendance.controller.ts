import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import {
  RequireAnyCapabilities,
  RequireCapabilities,
} from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { AttendanceService } from "./attendance.service";
import {
  BulkMarkAttendanceDto,
  CreateAttendanceSessionDto,
  ReviewAttendanceAbsenceDto,
  AwardAttendancePointsDto,
  SubmitAttendanceAbsencesDto,
  FinalizeAttendanceSessionDto,
  CancelAttendanceSessionDto,
  CorrectAttendanceRecordDto,
  ReviewAttendanceCorrectionDto,
  UpdateAttendancePolicyDto,
  AttendanceHistoryQueryDto,
} from "./attendance.dto";

@Controller()
export class AttendanceController {
  constructor(private readonly attendance: AttendanceService) {}

  @Get("attendance/sessions/:id")
  @RequireCapabilities("attendance.read")
  savedSession(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.attendance.sessionDetail(user, id).then(ok);
  }

  @Get("attendance/sessions/:id/history")
  @RequireCapabilities("attendance.read")
  savedSessionHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.attendance.sessionHistory(user, id).then(ok);
  }

  @Get("attendance/contexts")
  @RequireCapabilities("attendance.read")
  contexts(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.attendance.listContexts(user, organizationId).then(ok);
  }

  @Get("attendance/context/:contextType/:contextId/participants")
  @RequireCapabilities("attendance.read")
  participants(
    @CurrentUser() user: AuthenticatedUser,
    @Param("contextType") contextType: string,
    @Param("contextId") contextId: string,
  ) {
    return this.attendance
      .listParticipants(user, contextType, contextId)
      .then(ok);
  }

  @Get("student/attendance/sessions")
  @RequireCapabilities("attendance.read")
  sessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.attendance.listSessions(user, organizationId).then(ok);
  }

  @Get("attendance/history/sessions")
  @RequireCapabilities("attendance.read")
  historySessions(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: AttendanceHistoryQueryDto,
  ) {
    return this.attendance.paginatedSessions(user, query).then(ok);
  }

  @Post("student/attendance/sessions")
  @RequireCapabilities("attendance.manage")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateAttendanceSessionDto,
  ) {
    return this.attendance.createSession(user, dto).then(ok);
  }

  @Post("attendance/bulk-mark")
  @RequireCapabilities("attendance.manage")
  bulk(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: BulkMarkAttendanceDto,
  ) {
    return this.attendance.bulkMark(user, dto).then(ok);
  }

  @Post("attendance/sessions/:id/submit-absences")
  @RequireAnyCapabilities("attendance.manage", "attendance.class.manage")
  submitAbsences(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SubmitAttendanceAbsencesDto,
  ) {
    return this.attendance.submitAbsences(user, id, dto).then(ok);
  }

  @Post("attendance/sessions/:id/finalize")
  @RequireCapabilities("attendance.review")
  finalize(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: FinalizeAttendanceSessionDto,
  ) {
    return this.attendance.finalizeSession(user, id, dto).then(ok);
  }

  @Post("attendance/sessions/:id/daily-review")
  @RequireCapabilities("attendance.review")
  dailyReview(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.attendance.reviewSessionEvery24Hours(user, id).then(ok);
  }

  @Post("attendance/sessions/:id/cancel")
  @RequireCapabilities("attendance.review")
  cancel(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CancelAttendanceSessionDto,
  ) {
    return this.attendance.cancelSession(user, id, dto).then(ok);
  }

  @Patch("attendance/records/:id/correction")
  @RequireCapabilities("attendance.correct")
  correct(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CorrectAttendanceRecordDto,
  ) {
    return this.attendance.correctRecord(user, id, dto).then(ok);
  }

  @Get("attendance/corrections/pending")
  @RequireCapabilities("attendance.review")
  pendingCorrections(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.attendance
      .listPendingCorrections(user, organizationId)
      .then(ok);
  }

  @Post("attendance/corrections/:id/review")
  @RequireCapabilities("attendance.review")
  reviewCorrection(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReviewAttendanceCorrectionDto,
  ) {
    return this.attendance.reviewCorrection(user, id, dto).then(ok);
  }

  @Get("attendance/policy")
  @RequireCapabilities("attendance.settings.manage")
  policy(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.attendance.policy(user, organizationId).then(ok);
  }

  @Patch("attendance/policy")
  @RequireCapabilities("attendance.settings.manage")
  updatePolicy(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: UpdateAttendancePolicyDto,
  ) {
    return this.attendance.updatePolicy(user, dto).then(ok);
  }

  @Get("attendance/absence-reviews")
  @RequireCapabilities("attendance.review")
  absenceReviews(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.attendance.listAbsenceReviews(user, organizationId).then(ok);
  }

  @Get("attendance/live-records")
  @RequireCapabilities("attendance.read")
  liveRecords(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.attendance.listLiveRecords(user, organizationId).then(ok);
  }

  @Patch("attendance/absence-reviews/:id")
  @RequireCapabilities("attendance.review")
  reviewAbsence(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: ReviewAttendanceAbsenceDto,
  ) {
    return this.attendance.reviewAbsence(user, id, dto).then(ok);
  }

  @Post("attendance/points")
  @RequireAnyCapabilities("attendance.points.adjust", "attendance.class.manage")
  awardPoints(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: AwardAttendancePointsDto,
  ) {
    return this.attendance.awardPoints(user, dto).then(ok);
  }

  @Get("attendance/my-absence-reviews")
  @RequireCapabilities("attendance.read")
  myAbsenceReviews(@CurrentUser() user: AuthenticatedUser) {
    return this.attendance.listMyAbsenceReviews(user).then(ok);
  }

  @Get("student/attendance-summary")
  @RequireCapabilities("attendance.self.read")
  selfSummary(@CurrentUser() user: AuthenticatedUser) {
    return this.attendance.summary(user).then(ok);
  }

  @Get("student/attendance")
  @RequireCapabilities("attendance.self.read")
  selfRecords(@CurrentUser() user: AuthenticatedUser) {
    return this.attendance.listSelfRecords(user).then(ok);
  }

  @Get("students/:id/attendance-summary")
  @RequireCapabilities("attendance.read")
  studentSummary(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.attendance.summary(user, id).then(ok);
  }
}
