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
exports.AccountChangeRequest = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
let AccountChangeRequest = class AccountChangeRequest {
    id;
    organization;
    user;
    kind;
    requestedValue;
    status;
    reason;
    reviewNote;
    reviewedBy;
    reviewedAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, user: { required: true, type: () => require("./user.entity").User }, kind: { required: true, enum: ["PHONE_NUMBER"] }, requestedValue: { required: true, type: () => String }, status: { required: true, enum: ["APPROVED", "REJECTED", "PENDING"] }, reason: { required: true, type: () => String }, reviewNote: { required: true, type: () => String }, reviewedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, reviewedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.AccountChangeRequest = AccountChangeRequest;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AccountChangeRequest.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], AccountChangeRequest.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], AccountChangeRequest.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32 }),
    __metadata("design:type", String)
], AccountChangeRequest.prototype, "kind", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32 }),
    __metadata("design:type", String)
], AccountChangeRequest.prototype, "requestedValue", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16, default: "PENDING" }),
    __metadata("design:type", String)
], AccountChangeRequest.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], AccountChangeRequest.prototype, "reason", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], AccountChangeRequest.prototype, "reviewNote", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], AccountChangeRequest.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], AccountChangeRequest.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AccountChangeRequest.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AccountChangeRequest.prototype, "updatedAt", void 0);
exports.AccountChangeRequest = AccountChangeRequest = __decorate([
    (0, typeorm_1.Entity)("account_change_requests"),
    (0, typeorm_1.Index)(["organization", "status"])
], AccountChangeRequest);
//# sourceMappingURL=account-change-request.entity.js.map