import { Body, Controller, Delete, Get, Param, Post, Put, Query } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { CreateClassGroupDto, SetClassGroupMembersDto } from "./class-groups.dto";
import { ClassGroupsService } from "./class-groups.service";

@Controller("class-groups")
export class ClassGroupsController {
  constructor(private readonly groups: ClassGroupsService) {}

  @Get()
  @RequireCapabilities("class_groups.read")
  list(@CurrentUser() user: AuthenticatedUser, @Query("classId") classId?: string, @Query("organizationId") organizationId?: string) {
    return this.groups.list(user, classId, organizationId).then(ok);
  }

  @Post()
  @RequireCapabilities("class_groups.manage")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateClassGroupDto) {
    return this.groups.create(user, dto).then(ok);
  }

  @Get(":id/members")
  @RequireCapabilities("class_groups.read")
  members(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.groups.members(user, id).then(ok);
  }

  @Put(":id/members")
  @RequireCapabilities("class_groups.manage")
  setMembers(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: SetClassGroupMembersDto) {
    return this.groups.setMembers(user, id, dto.studentIds).then(ok);
  }

  @Delete(":id")
  @RequireCapabilities("class_groups.manage")
  remove(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.groups.remove(user, id).then(ok);
  }
}
