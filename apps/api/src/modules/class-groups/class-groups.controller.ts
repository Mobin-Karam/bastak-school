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
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import {
  CreateClassGroupDto,
  SetClassGroupMembersDto,
  UpdateClassGroupDto,
} from "./class-groups.dto";
import { ClassGroupsService } from "./class-groups.service";

@Controller("class-groups")
export class ClassGroupsController {
  constructor(private readonly groups: ClassGroupsService) {}

  @Get()
  @RequireCapabilities("class_groups.read")
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("classId") classId?: string,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.groups.list(user, classId, organizationId).then(ok);
  }

  @Get("classes")
  @RequireCapabilities("class_groups.read")
  classOptions(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.groups.classOptions(user, organizationId).then(ok);
  }
  @Get("classes/:id/students")
  @RequireCapabilities("class_groups.read")
  eligibleStudents(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
  ) {
    return this.groups.eligibleStudents(user, id).then(ok);
  }

  @Post()
  @RequireCapabilities("class_groups.manage")
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateClassGroupDto,
  ) {
    return this.groups.create(user, dto).then(ok);
  }

  @Patch(":id")
  @RequireCapabilities("class_groups.manage")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateClassGroupDto,
  ) {
    return this.groups.update(user, id, dto).then(ok);
  }

  @Get(":id/members")
  @RequireCapabilities("class_groups.read")
  members(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.groups.members(user, id).then(ok);
  }

  @Put(":id/members")
  @RequireCapabilities("class_groups.manage")
  setMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SetClassGroupMembersDto,
  ) {
    return this.groups.setMembers(user, id, dto.studentIds).then(ok);
  }

  @Delete(":id")
  @RequireCapabilities("class_groups.manage")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.groups.remove(user, id).then(ok);
  }
}
