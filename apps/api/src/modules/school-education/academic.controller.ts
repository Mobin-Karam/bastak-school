import {
  Body,
  Controller,
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
import { AcademicService } from "./academic.service";
import {
  AcademicPageDto,
  AcademicSubjectDto,
  TeachingAssignmentDto,
  SubjectBookReferenceDto,
  EndTeachingAssignmentDto,
} from "./academic.dto";
@Controller("school-education/:organizationId")
export class AcademicController {
  constructor(private readonly academic: AcademicService) {}

  @Get("subjects") @RequireCapabilities("education.catalog.read") subjects(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() page: AcademicPageDto,
  ) {
    return this.academic.subjects(u, org, page).then(ok);
  }
  @Post("subjects")
  @RequireCapabilities("education.catalog.manage")
  createSubject(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: AcademicSubjectDto,
  ) {
    return this.academic.createSubject(u, org, dto).then(ok);
  }
  @Get("teachers") @RequireCapabilities("classes.read") teachers(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() page: AcademicPageDto,
  ) {
    return this.academic.teachers(u, org, page).then(ok);
  }
  @Get("teaching-assignments") @RequireCapabilities("classes.read") assignments(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() page: AcademicPageDto,
  ) {
    return this.academic.assignments(u, org, page).then(ok);
  }
  @Post("teaching-assignments") @RequireCapabilities("classes.manage") create(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: TeachingAssignmentDto,
  ) {
    return this.academic.createAssignment(u, org, dto).then(ok);
  }
  @Patch("teaching-assignments/:id/end")
  @RequireCapabilities("classes.manage")
  end(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: EndTeachingAssignmentDto,
  ) {
    return this.academic.endAssignment(u, org, id, dto).then(ok);
  }
  @Get("subject-books")
  @RequireCapabilities("education.catalog.read")
  references(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Query() page: AcademicPageDto,
  ) {
    return this.academic.references(u, org, page).then(ok);
  }
  @Post("subject-books")
  @RequireCapabilities("education.catalog.manage")
  reference(
    @CurrentUser() u: AuthenticatedUser,
    @Param("organizationId", ParseUUIDPipe) org: string,
    @Body() dto: SubjectBookReferenceDto,
  ) {
    return this.academic.reference(u, org, dto).then(ok);
  }
}
