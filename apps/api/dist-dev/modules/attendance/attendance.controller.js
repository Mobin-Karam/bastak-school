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
exports.AttendanceController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const attendance_service_1 = require("./attendance.service");
const attendance_dto_1 = require("./attendance.dto");
let AttendanceController = class AttendanceController {
    attendance;
    constructor(attendance) {
        this.attendance = attendance;
    }
    savedSession(user, id) {
        return this.attendance.sessionDetail(user, id).then(envelope_1.ok);
    }
    savedSessionHistory(user, id) {
        return this.attendance.sessionHistory(user, id).then(envelope_1.ok);
    }
    contexts(user, organizationId) {
        return this.attendance.listContexts(user, organizationId).then(envelope_1.ok);
    }
    participants(user, contextType, contextId) {
        return this.attendance
            .listParticipants(user, contextType, contextId)
            .then(envelope_1.ok);
    }
    sessions(user, organizationId) {
        return this.attendance.listSessions(user, organizationId).then(envelope_1.ok);
    }
    create(user, dto) {
        return this.attendance.createSession(user, dto).then(envelope_1.ok);
    }
    bulk(user, dto) {
        return this.attendance.bulkMark(user, dto).then(envelope_1.ok);
    }
    absenceReviews(user, organizationId) {
        return this.attendance.listAbsenceReviews(user, organizationId).then(envelope_1.ok);
    }
    liveRecords(user, organizationId) {
        return this.attendance.listLiveRecords(user, organizationId).then(envelope_1.ok);
    }
    reviewAbsence(user, id, dto) {
        return this.attendance.reviewAbsence(user, id, dto).then(envelope_1.ok);
    }
    myAbsenceReviews(user) {
        return this.attendance.listMyAbsenceReviews(user).then(envelope_1.ok);
    }
    selfSummary(user) {
        return this.attendance.summary(user).then(envelope_1.ok);
    }
    selfRecords(user) {
        return this.attendance.listSelfRecords(user).then(envelope_1.ok);
    }
    studentSummary(user, id) {
        return this.attendance.summary(user, id).then(envelope_1.ok);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)("attendance/sessions/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "savedSession", null);
__decorate([
    (0, common_1.Get)("attendance/sessions/:id/history"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "savedSessionHistory", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("attendance/contexts"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "contexts", null);
__decorate([
    (0, common_1.Get)("attendance/context/:contextType/:contextId/participants"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("contextType")),
    __param(2, (0, common_1.Param)("contextId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "participants", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("student/attendance/sessions"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "sessions", null);
__decorate([
    (0, common_1.Post)("student/attendance/sessions"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, attendance_dto_1.CreateAttendanceSessionDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "create", null);
__decorate([
    (0, common_1.Post)("attendance/bulk-mark"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, attendance_dto_1.BulkMarkAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "bulk", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("attendance/absence-reviews"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "absenceReviews", null);
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("attendance/live-records"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "liveRecords", null);
__decorate([
    (0, common_1.Patch)("attendance/absence-reviews/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, attendance_dto_1.ReviewAttendanceAbsenceDto]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "reviewAbsence", null);
__decorate([
    (0, common_1.Get)("attendance/my-absence-reviews"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "myAbsenceReviews", null);
__decorate([
    (0, common_1.Get)("student/attendance-summary"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.self.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "selfSummary", null);
__decorate([
    (0, common_1.Get)("student/attendance"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.self.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "selfRecords", null);
__decorate([
    (0, common_1.Get)("students/:id/attendance-summary"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceController.prototype, "studentSummary", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map