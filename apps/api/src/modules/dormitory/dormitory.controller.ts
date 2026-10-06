import { Body, Controller, Get, Param, Post, Put, Query } from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { CreateDormRoomDto, SetDormRoomAssignmentsDto } from "./dormitory.dto";
import { DormitoryService } from "./dormitory.service";

@Controller("dormitory")
export class DormitoryController {
  constructor(private readonly dormitory: DormitoryService) {}

  @Get("rooms")
  @RequireCapabilities("dormitory.read")
  rooms(@CurrentUser() user: AuthenticatedUser, @Query("organizationId") organizationId?: string) {
    return this.dormitory.listRooms(user, organizationId).then(ok);
  }

  @Post("rooms")
  @RequireCapabilities("dormitory.manage")
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateDormRoomDto) {
    return this.dormitory.createRoom(user, dto).then(ok);
  }

  @Get("rooms/:id/assignments")
  @RequireCapabilities("dormitory.read")
  assignments(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.dormitory.listAssignments(user, id).then(ok);
  }

  @Put("rooms/:id/assignments")
  @RequireCapabilities("dormitory.manage")
  setAssignments(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string, @Body() dto: SetDormRoomAssignmentsDto) {
    return this.dormitory.setAssignments(user, id, dto.studentIds).then(ok);
  }
}
