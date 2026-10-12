import { Injectable } from "@nestjs/common";
import { ApiException } from "../../common/exceptions/api.exception";
import { AuthenticatedUser } from "../auth";
import { LegacyDashboardService } from "./dashboard.service";
import { ScheduleService } from "../schedule";
import { SchoolHomeService } from "../school-home";

type DashboardContext =
  | "STUDENT"
  | "GUARDIAN"
  | "ADVISOR"
  | "TEACHER"
  | "MENTOR"
  | "CONTENT_MANAGER"
  | "ORGANIZATION_ADMIN"
  | "PLATFORM_ADMIN";

/**
 * Version-two home contract. Product data belongs in named home sections so a
 * role can gain a section without changing the rest of the dashboard shape.
 */
@Injectable()
export class DashboardHomeService {
  constructor(
    private readonly legacy: LegacyDashboardService,
    private readonly schedule: ScheduleService,
    private readonly schoolHome: SchoolHomeService,
  ) {}

  async get(user: AuthenticatedUser, requested?: string) {
    const summary = await this.legacy.get(user, requested);
    const context = summary.context as DashboardContext;
    if (!context)
      throw new ApiException(403, "CONTEXT_FORBIDDEN", "زمینه کاری فعال نیست.");
    const tehranDateParts = new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Tehran",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());
    const datePart = (type: Intl.DateTimeFormatPartTypes) =>
      tehranDateParts.find((part) => part.type === type)?.value ?? "";
    const date = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;

    const entries = user.capabilities?.includes("schedule.read")
      ? await this.schedule.list(user)
      : [];
    const weekdayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
    const weekday = weekdayNames.indexOf(
      new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Tehran",
        weekday: "short",
      }).format(new Date()).toLowerCase().slice(0, 3),
    );
    const calendarEntries = entries
      .filter((entry) => entry.status === "ACTIVE")
      .map((entry) => ({
        id: entry.id,
        title: entry.title,
        weekday: entry.weekday,
        startTime: entry.startTime,
        endTime: entry.endTime,
        room: entry.room,
        className: entry.classroom?.name ?? null,
        classId: entry.classroom?.id ?? null,
      }));
    const now = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Tehran",
      hour: "2-digit",
      minute: "2-digit",
      hourCycle: "h23",
    }).format(new Date());
    const currentClass =
      calendarEntries.find(
        (entry) =>
          entry.weekday === weekday &&
          entry.startTime <= now &&
          entry.endTime > now,
      ) ?? null;

    const organizationId = user.organizationIds?.[0];
    const [prayer, announcements] = await Promise.all([
      user.capabilities?.includes("prayer_times.read")
        ? this.schoolHome.prayerTimes(user, organizationId, date)
        : Promise.resolve(null),
      user.capabilities?.includes("announcements.read")
        ? this.schoolHome.announcements(user, organizationId)
        : Promise.resolve([]),
    ]);
    return {
      ...summary,
      home: {
        calendar: {
          date,
          entries: calendarEntries,
          audience: this.calendarAudience(context),
        },
        prayer,
        announcements,
        currentClass,
      },
    };
  }

  attention(user: AuthenticatedUser, limit?: number) {
    return this.legacy.attentionQueue(user, limit);
  }

  private calendarAudience(context: DashboardContext) {
    if (context === "GUARDIAN") return "linked-children";
    if (context === "TEACHER") return "assigned-classes";
    if (context === "ORGANIZATION_ADMIN") return "organization";
    if (context === "PLATFORM_ADMIN") return "platform";
    return "personal";
  }
}
