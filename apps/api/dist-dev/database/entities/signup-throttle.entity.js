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
exports.SignupThrottle = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let SignupThrottle = class SignupThrottle {
    id;
    key;
    attempts;
    windowStartedAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, key: { required: true, type: () => String }, attempts: { required: true, type: () => Number }, windowStartedAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.SignupThrottle = SignupThrottle;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], SignupThrottle.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ length: 80 }),
    __metadata("design:type", String)
], SignupThrottle.prototype, "key", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], SignupThrottle.prototype, "attempts", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], SignupThrottle.prototype, "windowStartedAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], SignupThrottle.prototype, "updatedAt", void 0);
exports.SignupThrottle = SignupThrottle = __decorate([
    (0, typeorm_1.Entity)("signup_throttles")
], SignupThrottle);
//# sourceMappingURL=signup-throttle.entity.js.map