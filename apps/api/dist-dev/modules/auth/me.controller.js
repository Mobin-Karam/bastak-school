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
exports.MeController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const api_exception_1 = require("../../common/exceptions/api.exception");
const envelope_1 = require("../../common/utils/envelope");
const auth_service_1 = require("./auth.service");
let MeController = class MeController {
    auth;
    constructor(auth) {
        this.auth = auth;
    }
    async context(user, organizationId) {
        if (!user)
            throw new api_exception_1.ApiException(401, "UNAUTHORIZED", "لطفاً وارد حساب شوید.");
        return (0, envelope_1.ok)(await this.auth.context(user, organizationId));
    }
};
exports.MeController = MeController;
__decorate([
    (0, common_1.Get)("context"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Headers)("x-organization-id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", Promise)
], MeController.prototype, "context", null);
exports.MeController = MeController = __decorate([
    (0, common_1.Controller)("me"),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], MeController);
//# sourceMappingURL=me.controller.js.map