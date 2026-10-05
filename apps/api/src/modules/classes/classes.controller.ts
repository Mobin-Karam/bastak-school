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
  SaveEducationClassDto,
  SetClassBooksDto,
  SetClassEnrollmentsDto,
  UpdateEducationClassDto,
} from "./classes.dto";
import { ClassesService } from "./classes.service";

@Controller()
export class ClassesController {
  constructor(private readonly classes: ClassesService) {}
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
  @Put("classes/:id/books") @RequireCapabilities("classes.manage") books(
    @CurrentUser() actor: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SetClassBooksDto,
  ) {
    return this.classes.setBooks(actor, id, dto).then(ok);
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
