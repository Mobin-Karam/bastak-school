import { Body, Controller, Get, Param, Patch, Post, Put } from "@nestjs/common";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { ok } from "../../common/utils/envelope";
import { UserRole } from "../../database/entities/user.entity";
import { AuthenticatedUser } from "../auth";
import { SaveRelaxationTrackDto, SelectRelaxationTrackDto } from "./relaxation.dto";
import { RelaxationService } from "./relaxation.service";

@Controller("system/relaxation-tracks")
@Roles(UserRole.PLATFORM_ADMIN)
export class RelaxationAdminController {
  constructor(private service: RelaxationService) {}
  @Get() list() { return this.service.listManaged().then(ok); }
  @Get(":id/audience") audience(@Param("id") id: string) { return this.service.audience(id).then(ok); }
  @Post() create(@CurrentUser() user: AuthenticatedUser, @Body() dto: SaveRelaxationTrackDto) { return this.service.create(user, dto).then(ok); }
  @Patch(":id") update(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: SaveRelaxationTrackDto) { return this.service.update(user, id, dto).then(ok); }
}

@Controller("student/relaxation")
@Roles(UserRole.STUDENT)
export class RelaxationStudentController {
  constructor(private service: RelaxationService) {}
  @Get("today") today(@CurrentUser() user: AuthenticatedUser) { return this.service.today(user.id).then(ok); }
  @Put("today") select(@CurrentUser() user: AuthenticatedUser, @Body() dto: SelectRelaxationTrackDto) { return this.service.select(user.id, dto.trackId).then(ok); }
}
