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
exports.Conversation = exports.ConversationType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const conversation_member_entity_1 = require("./conversation-member.entity");
const organization_entity_1 = require("./organization.entity");
var ConversationType;
(function (ConversationType) {
    ConversationType["DIRECT"] = "DIRECT";
    ConversationType["GROUP"] = "GROUP";
})(ConversationType || (exports.ConversationType = ConversationType = {}));
let Conversation = class Conversation {
    id;
    type;
    title;
    description;
    permissions;
    archivedAt;
    owner;
    organization;
    autoManaged;
    members;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, type: { required: true, enum: require("./conversation.entity").ConversationType }, title: { required: true, type: () => String }, description: { required: true, type: () => String }, permissions: { required: true, type: "object", additionalProperties: { type: "boolean" } }, archivedAt: { required: false, type: () => Date, nullable: true }, owner: { required: false, type: () => require("./user.entity").User, nullable: true }, organization: { required: false, type: () => require("./organization.entity").Organization, nullable: true }, autoManaged: { required: true, type: () => Boolean }, members: { required: true, type: () => [require("./conversation-member.entity").ConversationMember] }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.Conversation = Conversation;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], Conversation.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16 }),
    __metadata("design:type", String)
], Conversation.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Conversation.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: "" }),
    __metadata("design:type", String)
], Conversation.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "{}" }),
    __metadata("design:type", Object)
], Conversation.prototype, "permissions", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], Conversation.prototype, "archivedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], Conversation.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], Conversation.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], Conversation.prototype, "autoManaged", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => conversation_member_entity_1.ConversationMember, m => m.conversation),
    __metadata("design:type", Array)
], Conversation.prototype, "members", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], Conversation.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], Conversation.prototype, "updatedAt", void 0);
exports.Conversation = Conversation = __decorate([
    (0, typeorm_1.Entity)("conversations")
], Conversation);
//# sourceMappingURL=conversation.entity.js.map