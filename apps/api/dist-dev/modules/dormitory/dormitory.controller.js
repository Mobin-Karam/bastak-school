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
exports.DormitoryController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const envelope_1 = require("../../common/utils/envelope");
const dormitory_dto_1 = require("./dormitory.dto");
const dormitory_service_1 = require("./dormitory.service");
let DormitoryController = class DormitoryController {
    dormitory;
    constructor(dormitory) {
        this.dormitory = dormitory;
    }
    rooms(user, organizationId) {
        return this.dormitory.listRooms(user, organizationId).then(envelope_1.ok);
    }
    create(user, dto) {
        return this.dormitory.createRoom(user, dto).then(envelope_1.ok);
    }
    assignments(user, id) {
        return this.dormitory.listAssignments(user, id).then(envelope_1.ok);
    }
    setAssignments(user, id, dto) {
        return this.dormitory.setAssignments(user, id, dto.studentIds).then(envelope_1.ok);
    }
    students(user, organizationId, query = "") {
        return this.dormitory.findStudents(user, organizationId, query).then(envelope_1.ok);
    }
    announce(user, dto) {
        return this.dormitory.sendAnnouncement(user, dto).then(envelope_1.ok);
    }
};
exports.DormitoryController = DormitoryController;
__decorate([
    openapi.ApiQuery({ name: "organizationId", required: false }),
    (0, common_1.Get)("rooms"),
    (0, capabilities_decorator_1.RequireCapabilities)("dormitory.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "rooms", null);
__decorate([
    (0, common_1.Post)("rooms"),
    (0, capabilities_decorator_1.RequireCapabilities)("dormitory.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dormitory_dto_1.CreateDormRoomDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "create", null);
__decorate([
    (0, common_1.Get)("rooms/:id/assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("dormitory.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "assignments", null);
__decorate([
    (0, common_1.Put)("rooms/:id/assignments"),
    (0, capabilities_decorator_1.RequireCapabilities)("dormitory.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, dormitory_dto_1.SetDormRoomAssignmentsDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "setAssignments", null);
__decorate([
    openapi.ApiQuery({ name: "q", required: false }),
    (0, common_1.Get)("students"),
    (0, capabilities_decorator_1.RequireCapabilities)("dormitory.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("organizationId")),
    __param(2, (0, common_1.Query)("q")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "students", null);
__decorate([
    (0, common_1.Post)("announcements"),
    (0, capabilities_decorator_1.RequireCapabilities)("announcements.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dormitory_dto_1.SendDormAnnouncementDto]),
    __metadata("design:returntype", void 0)
], DormitoryController.prototype, "announce", null);
exports.DormitoryController = DormitoryController = __decorate([
    (0, common_1.Controller)("dormitory"),
    __metadata("design:paramtypes", [dormitory_service_1.DormitoryService])
], DormitoryController);
//# sourceMappingURL=dormitory.controller.js.map