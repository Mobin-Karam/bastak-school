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
exports.RequestLetter = exports.RequestLetterStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
var RequestLetterStatus;
(function (RequestLetterStatus) {
    RequestLetterStatus["DRAFT"] = "DRAFT";
    RequestLetterStatus["SENT"] = "SENT";
    RequestLetterStatus["RECEIVED"] = "RECEIVED";
    RequestLetterStatus["UNDER_REVIEW"] = "UNDER_REVIEW";
    RequestLetterStatus["ANSWERED"] = "ANSWERED";
    RequestLetterStatus["REJECTED"] = "REJECTED";
    RequestLetterStatus["CLOSED"] = "CLOSED";
})(RequestLetterStatus || (exports.RequestLetterStatus = RequestLetterStatus = {}));
let RequestLetter = class RequestLetter {
    id;
    organization;
    sender;
    recipient;
    recipientRole;
    subject;
    body;
    attachments;
    status;
    priority;
    readAt;
    respondedAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, sender: { required: false, type: () => require("./user.entity").User, nullable: true }, recipient: { required: false, type: () => require("./user.entity").User, nullable: true }, recipientRole: { required: true, type: () => String }, subject: { required: true, type: () => String }, body: { required: true, type: () => String }, attachments: { required: true, type: () => [String] }, status: { required: true, enum: require("./request-letter.entity").RequestLetterStatus }, priority: { required: true, type: () => String }, readAt: { required: false, type: () => Date, nullable: true }, respondedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.RequestLetter = RequestLetter;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], RequestLetter.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], RequestLetter.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], RequestLetter.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], RequestLetter.prototype, "recipient", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120, default: "" }),
    __metadata("design:type", String)
], RequestLetter.prototype, "recipientRole", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 200 }),
    __metadata("design:type", String)
], RequestLetter.prototype, "subject", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text" }),
    __metadata("design:type", String)
], RequestLetter.prototype, "body", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-array", default: "" }),
    __metadata("design:type", Array)
], RequestLetter.prototype, "attachments", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 18, default: RequestLetterStatus.DRAFT }),
    __metadata("design:type", String)
], RequestLetter.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, default: "normal" }),
    __metadata("design:type", String)
], RequestLetter.prototype, "priority", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], RequestLetter.prototype, "readAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], RequestLetter.prototype, "respondedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], RequestLetter.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], RequestLetter.prototype, "updatedAt", void 0);
exports.RequestLetter = RequestLetter = __decorate([
    (0, typeorm_1.Entity)("request_letters")
], RequestLetter);
//# sourceMappingURL=request-letter.entity.js.map