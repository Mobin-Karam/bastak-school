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
exports.RealtimeController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
const realtime_service_1 = require("./realtime.service");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_exception_1 = require("../../common/exceptions/api.exception");
let RealtimeController = class RealtimeController {
    realtime;
    constructor(realtime) {
        this.realtime = realtime;
    }
    events(user) {
        if (!user)
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
        const heartbeat = (0, rxjs_1.interval)(25_000).pipe((0, rxjs_1.map)(() => ({ type: "system.update", data: { heartbeat: true } })));
        return (0, rxjs_1.merge)((0, rxjs_1.of)({ type: "system.update", data: { status: "connected" } }), heartbeat, this.realtime.stream(user.id)).pipe((0, rxjs_1.map)((event) => ({ type: event.type, data: event.data })));
    }
};
exports.RealtimeController = RealtimeController;
__decorate([
    (0, common_1.Sse)(),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", rxjs_1.Observable)
], RealtimeController.prototype, "events", null);
exports.RealtimeController = RealtimeController = __decorate([
    (0, common_1.Controller)("events"),
    __metadata("design:paramtypes", [realtime_service_1.RealtimeService])
], RealtimeController);
//# sourceMappingURL=realtime.controller.js.map