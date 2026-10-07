import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from "@nestjs/common";
import { RequireCapabilities } from "../../common/decorators/capabilities.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ok } from "../../common/utils/envelope";
import { AuthenticatedUser } from "../auth";
import {
  SavePrayerTimeDto,
  SaveSchoolAnnouncementDto,
} from "./school-home.dto";
import { SchoolHomeService } from "./school-home.service";

@Controller()
export class SchoolHomeController {
  constructor(private readonly schoolHome: SchoolHomeService) {}

  @Get("prayer-times")
  @RequireCapabilities("prayer_times.read")
  prayerTimes(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
    @Query("date") date?: string,
  ) {
    return this.schoolHome.prayerTimes(user, organizationId, date).then(ok);
  }

  @Patch("organizations/:organizationId/prayer-times")
  @RequireCapabilities("prayer_times.manage")
  savePrayerTimes(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Body() dto: SavePrayerTimeDto,
  ) {
    return this.schoolHome.savePrayerTimes(user, organizationId, dto).then(ok);
  }

  @Get("announcements")
  @RequireCapabilities("announcements.read")
  announcements(
    @CurrentUser() user: AuthenticatedUser,
    @Query("organizationId") organizationId?: string,
  ) {
    return this.schoolHome.announcements(user, organizationId).then(ok);
  }

  @Post("organizations/:organizationId/announcements")
  @RequireCapabilities("announcements.manage")
  createAnnouncement(
    @CurrentUser() user: AuthenticatedUser,
    @Param("organizationId") organizationId: string,
    @Body() dto: SaveSchoolAnnouncementDto,
  ) {
    return this.schoolHome.saveAnnouncement(user, organizationId, dto).then(ok);
  }

  @Patch("announcements/:id")
  @RequireCapabilities("announcements.manage")
  updateAnnouncement(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: SaveSchoolAnnouncementDto,
  ) {
    return this.schoolHome.updateAnnouncement(user, id, dto).then(ok);
  }
}
