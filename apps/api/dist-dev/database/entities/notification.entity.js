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
exports.Notification = exports.NotificationType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const organization_entity_1 = require("./organization.entity");
var NotificationType;
(function (NotificationType) {
    NotificationType["PLAN_UPDATE"] = "PLAN_UPDATE";
    NotificationType["EXAM_REMINDER"] = "EXAM_REMINDER";
    NotificationType["MESSAGE"] = "MESSAGE";
    NotificationType["WARNING"] = "WARNING";
    NotificationType["MOTIVATION"] = "MOTIVATION";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
let Notification = class Notification {
    id;
    user;
    organization;
    type;
    title;
    body;
    category;
    url;
    data;
    priority;
    expiresAt;
    dedupeKey;
    readAt;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, user: { required: true, type: () => require("./user.entity").User }, organization: { required: false, type: () => require("./organization.entity").Organization, nullable: true }, type: { required: true, type: () => String }, title: { required: true, type: () => String }, body: { required: true, type: () => String }, category: { required: true, type: () => String }, url: { required: false, type: () => String, nullable: true }, data: { required: false, type: "object", additionalProperties: true, nullable: true }, priority: { required: true, type: () => String }, expiresAt: { required: false, type: () => Date, nullable: true }, dedupeKey: { required: false, type: () => String, nullable: true }, readAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date } };
    }
};
exports.Notification = Notification;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Notification.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], Notification.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], Notification.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 40 }),
    __metadata("design:type", String)
], Notification.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Notification.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], Notification.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "general" }),
    __metadata("design:type", String)
], Notification.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "url", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "data", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "normal" }),
    __metadata("design:type", String)
], Notification.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "expiresAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "dedupeKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Notification.prototype, "readAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Notification.prototype, "createdAt", void 0);
exports.Notification = Notification = __decorate([
    (0, typeorm_1.Entity)("notifications")
], Notification);
//# sourceMappingURL=notification.entity.js.map