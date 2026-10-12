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
exports.AttendanceOperationsController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const attendance_operations_service_1 = require("./attendance-operations.service");
const attendance_dto_1 = require("./attendance.dto");
let AttendanceOperationsController = class AttendanceOperationsController {
    operations;
    constructor(operations) {
        this.operations = operations;
    }
    delegates(user) {
        return this.operations.delegates(user).then(envelope_1.ok);
    }
    residents(user) { return this.operations.dormResidents(user).then(envelope_1.ok); }
    delegateAll(user, dto) { return this.operations.setDormWideDelegate(user, dto).then(envelope_1.ok); }
    revokeAll(user) { return this.operations.revokeDormWideDelegate(user).then(envelope_1.ok); }
    delegate(user, id, dto) {
        return this.operations.setDelegate(user, id, dto).then(envelope_1.ok);
    }
    revoke(user, id) {
        return this.operations.revokeDelegate(user, id).then(envelope_1.ok);
    }
    pools(user) {
        return this.operations.pools(user).then(envelope_1.ok);
    }
    createPool(user, dto) {
        return this.operations.createPool(user, dto).then(envelope_1.ok);
    }
    closePool(user, id) {
        return this.operations.closePool(user, id).then(envelope_1.ok);
    }
    overview(user) {
        return this.operations.dailyOverview(user).then(envelope_1.ok);
    }
    sessions(user) {
        return this.operations.staffSessions(user).then(envelope_1.ok);
    }
    profile(user, id) {
        return this.operations.staffProfile(user, id).then(envelope_1.ok);
    }
    encouragement(user) {
        return this.operations.encouragement(user).then(envelope_1.ok);
    }
    assignments(user) {
        return this.operations.myDormAssignments(user).then(envelope_1.ok);
    }
    markDorm(user, id, dto) {
        return this.operations.markDorm(user, id, dto).then(envelope_1.ok);
    }
    myPools(user) {
        return this.operations.myPools(user).then(envelope_1.ok);
    }
    checkIn(user, id, _dto) {
        return this.operations.checkIn(user, id).then(envelope_1.ok);
    }
};
exports.AttendanceOperationsController = AttendanceOperationsController;
__decorate([
    (0, common_1.Get)("attendance/delegates"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.delegate"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "delegates", null);
__decorate([
    (0, common_1.Get)("attendance/dorm-residents"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.delegate"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "residents", null);
__decorate([
    (0, common_1.Put)("attendance/dorm/delegate-all"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.delegate"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, attendance_dto_1.SetDormAttendanceDelegateDto]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "delegateAll", null);
__decorate([
    (0, common_1.Delete)("attendance/dorm/delegate-all"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.delegate"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "revokeAll", null);
__decorate([
    (0, common_1.Put)("attendance/dorm/:roomId/delegate"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.delegate"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("roomId")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, attendance_dto_1.SetDormAttendanceDelegateDto]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "delegate", null);
__decorate([
    (0, common_1.Delete)("attendance/dorm/:roomId/delegate"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.delegate"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("roomId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "revoke", null);
__decorate([
    (0, common_1.Get)("attendance/pools"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "pools", null);
__decorate([
    (0, common_1.Post)("attendance/pools"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.review", "attendance.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, attendance_dto_1.CreateAttendancePoolDto]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "createPool", null);
__decorate([
    (0, common_1.Post)("attendance/pools/:id/close"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.review", "attendance.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "closePool", null);
__decorate([
    (0, common_1.Get)("attendance/overview"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "overview", null);
__decorate([
    (0, common_1.Get)("attendance/staff-sessions"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "sessions", null);
__decorate([
    (0, common_1.Get)("attendance/students/:id/profile"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.review"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "profile", null);
__decorate([
    (0, common_1.Get)("student/attendance/encouragement"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.self.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "encouragement", null);
__decorate([
    (0, common_1.Get)("student/attendance/dorm-assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.self.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "assignments", null);
__decorate([
    (0, common_1.Post)("student/attendance/dorm-assignments/:id/mark"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.self.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, attendance_dto_1.DelegatedDormAttendanceDto]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "markDorm", null);
__decorate([
    (0, common_1.Get)("student/attendance/pools"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.self.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "myPools", null);
__decorate([
    (0, common_1.Post)("student/attendance/pools/:id/check-in"),
    (0, capabilities_decorator_1.RequireCapabilities)("attendance.self.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, attendance_dto_1.AttendancePoolCheckInDto]),
    __metadata("design:returntype", void 0)
], AttendanceOperationsController.prototype, "checkIn", null);
exports.AttendanceOperationsController = AttendanceOperationsController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [attendance_operations_service_1.AttendanceOperationsService])
], AttendanceOperationsController);
//# sourceMappingURL=attendance-operations.controller.js.map