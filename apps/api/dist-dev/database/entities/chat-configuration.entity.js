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
exports.ChatConfiguration = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
let ChatConfiguration = class ChatConfiguration {
    id;
    allowedEmojis;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, allowedEmojis: { required: true, type: () => [String] }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.ChatConfiguration = ChatConfiguration;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: "varchar", length: 32, default: "platform" }),
    __metadata("design:type", String)
], ChatConfiguration.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Array)
], ChatConfiguration.prototype, "allowedEmojis", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], ChatConfiguration.prototype, "updatedAt", void 0);
exports.ChatConfiguration = ChatConfiguration = __decorate([
    (0, typeorm_1.Entity)("chat_configuration")
], ChatConfiguration);
//# sourceMappingURL=chat-configuration.entity.js.map