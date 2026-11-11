import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import {
  ClassHistoryQueryDto,
  AddClassBookDto,
  SaveEducationClassDto,
  ClassTransferDto,
  SetClassBooksDto,
  SetClassEnrollmentsDto,
  UpdateEducationClassDto,
} from "./classes.dto";
import { ClassesService } from "./classes.service";
import { ClassGradesService } from "./class-grades.service";
import {
  CreateClassBookGradeSessionDto,
  SaveClassBookGradeDto,
  UpdateClassBookGradeSessionDto,
} from "./class-grades.dto";

@Controller()
export class ClassesController {
  constructor(
    private readonly classes: ClassesService,
    private readonly grades: ClassGradesService,
  ) {}
  @Get("class-grades/mine")
  @RequireCapabilities("class_grades.self.read")
  myGrades(@CurrentUser() actor: AuthenticatedUser) {
    return this.grades.mine(actor).then(ok);
  }
  @Get("class-books/:id/grades")
  @RequireCapabilities("class_grades.read")
  bookGrades(@CurrentUser() actor: AuthenticatedUser, @Param("id") id: string) {
    return this.grades.list(actor, id).then(ok);
  }
  @Post("class-books/:id/grade-sessions")
  @RequireCapabilities("class_grades.manage")
  createGradeSession(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: CreateClassBookGradeSessionDto,
  ) {
    return this.grades.createSession(actor, id, dto).then(ok);
  }
  @Patch("class-books/:id/grade-sessions/:sessionId")
  @RequireCapabilities("class_grades.manage")
  updateGradeSession(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Param("sessionId") sessionId: string,
    @Body() dto: UpdateClassBookGradeSessionDto,
  ) {
    return this.grades.updateSession(actor, id, sessionId, dto).then(ok);
  }
  @Delete("class-books/:id/grade-sessions/:sessionId")
  @RequireCapabilities("class_grades.manage")
  removeGradeSession(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Param("sessionId") sessionId: string,
  ) {
    return this.grades.removeSession(actor, id, sessionId).then(ok);
  }
  @Get("class-books/:id/attendance-sessions")
  @RequireCapabilities("class_grades.read", "attendance.read")
  bookAttendance(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Query("page") page?: string,
  ) {
    return this.grades
      .attendanceSessions(actor, id, Number(page ?? 1))
      .then(ok);
  }
  @Put("class-books/:id/grade-sessions/:sessionId/grades")
  @RequireCapabilities("class_grades.manage")
  saveGrade(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Param("sessionId") sessionId: string,
    @Body() dto: SaveClassBookGradeDto,
  ) {
    return this.grades.save(actor, id, sessionId, dto).then(ok);
  }
  @Delete("class-books/:id/grade-sessions/:sessionId/grades/:studentId")
  @RequireCapabilities("class_grades.manage")
  removeGrade(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Param("sessionId") sessionId: string,
    @Param("studentId") studentId: string,
  ) {
    return this.grades.remove(actor, id, sessionId, studentId).then(ok);
  }
  @Get("classes") @RequireCapabilities("classes.read") list(
    @CurrentUser() actor: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.classes.list(actor, organizationId).then(ok);
  }
  @Get("classes/assigned") @RequireCapabilities("classes.read") assigned(
    @CurrentUser() actor: AuthenticatedUser,
    @Query("studentId") studentId?: string,
  ) {
    return this.classes.assigned(actor, studentId).then(ok);
  }
  @Post("classes") @RequireCapabilities("classes.manage") create(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: SaveEducationClassDto,
  ) {
    return this.classes.create(actor, dto).then(ok);
  }
  @Post("classes/transfer/preview")
  @RequireCapabilities("classes.manage")
  previewTransfer(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ClassTransferDto,
  ) {
    return this.classes.previewTransfer(actor, dto).then(ok);
  }
  @Post("classes/transfer/commit")
  @RequireCapabilities("classes.manage")
  commitTransfer(
    @CurrentUser() actor: AuthenticatedUser,
    @Body() dto: ClassTransferDto,
  ) {
    return this.classes.commitTransfer(actor, dto).then(ok);
  }
  @Get("classes/transfer/export")
  @RequireCapabilities("classes.manage")
  exportTransfer(
    @CurrentUser() actor: AuthenticatedUser,
    @Query("organizationId") organizationId: string,
  ) {
    return this.classes.exportTransfer(actor, organizationId).then(ok);
  }
  @Get("classes/:id/options") @RequireCapabilities("classes.read") options(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.classes.options(actor, id).then(ok);
  }
  @Patch("classes/:id") @RequireCapabilities("classes.manage") update(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateEducationClassDto,
  ) {
    return this.classes.update(actor, id, dto).then(ok);
  }
  @Post("classes/:id/books")
  @RequireCapabilities("education.catalog.manage")
  addBook(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: AddClassBookDto,
  ) {
    return this.classes.addBook(actor, id, dto).then(ok);
  }
  @Put("classes/:id/books")
  @RequireCapabilities("education.catalog.manage")
  books(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SetClassBooksDto,
  ) {
    return this.classes.setBooks(actor, id, dto).then(ok);
  }
  @Get("classes/:id/enrollments/history")
  @RequireCapabilities("classes.roster.manage")
  history(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Query() page: ClassHistoryQueryDto,
  ) {
    return this.classes
      .enrollmentHistory(actor, id, page.offset, page.limit)
      .then(ok);
  }
  @Put("classes/:id/enrollments")
  @RequireCapabilities("classes.roster.manage")
  enrollments(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SetClassEnrollmentsDto,
  ) {
    return this.classes.setEnrollments(actor, id, dto).then(ok);
  }
  @Delete("classes/:id") @RequireCapabilities("classes.manage") remove(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.classes.remove(actor, id).then(ok);
  }
}
