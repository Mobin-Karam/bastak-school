"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardHomeService = void 0;
const common_1 = require("@nestjs/common");
const api_exception_1 = require("../../common/exceptions/api.exception");
const dashboard_service_1 = require("./dashboard.service");
const schedule_service_1 = require("../schedule/schedule.service");
const school_home_service_1 = require("../school-home/school-home.service");
let DashboardHomeService = class DashboardHomeService {
    legacy;
    schedule;
    schoolHome;
    constructor(legacy, schedule, schoolHome) {
        this.legacy = legacy;
        this.schedule = schedule;
        this.schoolHome = schoolHome;
    }
    async get(user, requested) {
        const summary = await this.legacy.get(user, requested);
        const context = summary.context;
        if (!context)
            throw new api_exception_1.ApiException(403, "CONTEXT_FORBIDDEN", "زمینه کاری فعال نیست.");
        const tehranDateParts = new Intl.DateTimeFormat("en-CA", {
            timeZone: "Asia/Tehran",
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
        }).formatToParts(new Date());
        const datePart = (type) => tehranDateParts.find((part) => part.type === type)?.value ?? "";
        const date = `${datePart("year")}-${datePart("month")}-${datePart("day")}`;
        const entries = user.capabilities?.includes("schedule.read")
            ? await this.schedule.list(user)
            : [];
        const weekdayNames = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
        const weekday = weekdayNames.indexOf(new Intl.DateTimeFormat("en-US", {
            timeZone: "Asia/Tehran",
            weekday: "short",
        }).format(new Date()).toLowerCase().slice(0, 3));
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
        const currentClass = calendarEntries.find((entry) => entry.weekday === weekday &&
            entry.startTime <= now &&
            entry.endTime > now) ?? null;
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
    attention(user, limit) {
        return this.legacy.attentionQueue(user, limit);
    }
    calendarAudience(context) {
        if (context === "GUARDIAN")
            return "linked-children";
        if (context === "TEACHER")
            return "assigned-classes";
        if (context === "ORGANIZATION_ADMIN")
            return "organization";
        if (context === "PLATFORM_ADMIN")
            return "platform";
        return "personal";
    }
};
exports.DashboardHomeService = DashboardHomeService;
exports.DashboardHomeService = DashboardHomeService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [dashboard_service_1.LegacyDashboardService,
        schedule_service_1.ScheduleService,
        school_home_service_1.SchoolHomeService])
], DashboardHomeService);
//# sourceMappingURL=dashboard-home.service.js.map