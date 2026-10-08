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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SchoolHomeController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const school_home_dto_1 = require("./school-home.dto");
const school_home_service_1 = require("./school-home.service");
let SchoolHomeController = class SchoolHomeController {
    schoolHome;
    constructor(schoolHome) {
        this.schoolHome = schoolHome;
    }
    prayerTimes(user, organizationId, date) {
        return this.schoolHome.prayerTimes(user, organizationId, date).then(envelope_1.ok);
    }
    savePrayerTimes(user, organizationId, dto) {
        return this.schoolHome.savePrayerTimes(user, organizationId, dto).then(envelope_1.ok);
    }
    deletePrayerTimes(user, organizationId, date) {
        return this.schoolHome.deletePrayerTimes(user, organizationId, date).then(envelope_1.ok);
    }
    announcements(user, organizationId) {
        return this.schoolHome.announcements(user, organizationId).then(envelope_1.ok);
    }
    createAnnouncement(user, organizationId, dto) {
        return this.schoolHome.saveAnnouncement(user, organizationId, dto).then(envelope_1.ok);
    }
    updateAnnouncement(user, id, dto) {
        return this.schoolHome.updateAnnouncement(user, id, dto).then(envelope_1.ok);
    }
};
exports.SchoolHomeController = SchoolHomeController;
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    openapi.ApiQuery({ name: "date", required: false }),
    (0, common_1.Get)("prayer-times"),
    (0, capabilities_decorator_1.RequireCapabilities)("prayer_times.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __param(2, (0, common_1.Query)("date")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SchoolHomeController.prototype, "prayerTimes", null);
__decorate([
    (0, common_1.Patch)("organizations/:organizationId/prayer-times"),
    (0, capabilities_decorator_1.RequireCapabilities)("prayer_times.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, school_home_dto_1.SavePrayerTimeDto]),
    __metadata("design:returntype", void 0)
], SchoolHomeController.prototype, "savePrayerTimes", null);
__decorate([
    openapi.ApiQuery({ name: "date", required: false }),
    (0, common_1.Delete)("organizations/:organizationId/prayer-times"),
    (0, capabilities_decorator_1.RequireCapabilities)("prayer_times.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId")),
    __param(2, (0, common_1.Query)("date")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], SchoolHomeController.prototype, "deletePrayerTimes", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("announcements"),
    (0, capabilities_decorator_1.RequireCapabilities)("announcements.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], SchoolHomeController.prototype, "announcements", null);
__decorate([
    (0, common_1.Post)("organizations/:organizationId/announcements"),
    (0, capabilities_decorator_1.RequireCapabilities)("announcements.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("organizationId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, school_home_dto_1.SaveSchoolAnnouncementDto]),
    __metadata("design:returntype", void 0)
], SchoolHomeController.prototype, "createAnnouncement", null);
__decorate([
    (0, common_1.Patch)("announcements/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("announcements.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, school_home_dto_1.SaveSchoolAnnouncementDto]),
    __metadata("design:returntype", void 0)
], SchoolHomeController.prototype, "updateAnnouncement", null);
exports.SchoolHomeController = SchoolHomeController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [school_home_service_1.SchoolHomeService])
], SchoolHomeController);
//# sourceMappingURL=school-home.controller.js.map