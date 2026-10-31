import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  Query,
} from "@nestjs/common";
import { IsArray, IsOptional, IsUUID, ArrayMaxSize } from "class-validator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import { NotificationsService } from "./notifications.service";

class DeleteNotificationsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  ids?: string[];
}

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  list(
    @CurrentUser() user: AuthenticatedUser,
    @Query("limit") limit?: string,
    @Query("cursor") cursor?: string,
    @Query("unreadOnly") unreadOnly?: string,
    @Query("category") category?: string,
  ) {
    return this.notifications
      .findForUser(user.id, {
        limit: Number(limit),
        cursor,
        unreadOnly: unreadOnly === "true",
        category,
        organizationId: user.activeOrganizationId,
      })
      .then(ok);
  }

  @Put(":id/read")
  read(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.notifications.markRead(user, id).then(ok);
  }

  @Put("read-all")
  readAll(@CurrentUser() user: AuthenticatedUser) {
    return this.notifications.markAllRead(user).then(ok);
  }

  @Delete()
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Body() body: DeleteNotificationsDto,
  ) {
    return this.notifications.removeForUser(user, body.ids).then(ok);
  }
}
