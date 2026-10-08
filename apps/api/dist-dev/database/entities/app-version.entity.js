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
exports.AppVersion = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let AppVersion = class AppVersion {
    app;
    version;
    notes;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { app: { required: true, type: () => String }, version: { required: true, type: () => String }, notes: { required: true, type: () => String }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.AppVersion = AppVersion;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ length: 40 }),
    __metadata("design:type", String)
], AppVersion.prototype, "app", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 40 }),
    __metadata("design:type", String)
], AppVersion.prototype, "version", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], AppVersion.prototype, "notes", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AppVersion.prototype, "updatedAt", void 0);
exports.AppVersion = AppVersion = __decorate([
    (0, typeorm_1.Entity)("app_versions")
], AppVersion);
//# sourceMappingURL=app-version.entity.js.map