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
exports.ConversationMember = exports.ConversationMemberRole = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const conversation_entity_1 = require("./conversation.entity");
const user_entity_1 = require("./user.entity");
var ConversationMemberRole;
(function (ConversationMemberRole) {
    ConversationMemberRole["OWNER"] = "OWNER";
    ConversationMemberRole["ADMIN"] = "ADMIN";
    ConversationMemberRole["MEMBER"] = "MEMBER";
})(ConversationMemberRole || (exports.ConversationMemberRole = ConversationMemberRole = {}));
let ConversationMember = class ConversationMember {
    id;
    conversation;
    user;
    role;
    muted;
    leftAt;
    lastReadAt;
    joinedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, conversation: { required: true, type: () => require("./conversation.entity").Conversation }, user: { required: true, type: () => require("./user.entity").User }, role: { required: true, enum: require("./conversation-member.entity").ConversationMemberRole }, muted: { required: true, type: () => Boolean }, leftAt: { required: false, type: () => Date, nullable: true }, lastReadAt: { required: false, type: () => Date, nullable: true }, joinedAt: { required: true, type: () => Date } };
    }
};
exports.ConversationMember = ConversationMember;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ConversationMember.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => conversation_entity_1.Conversation, (c) => c.members, {
        nullable: false,
        onDelete: "CASCADE",
    }),
    __metadata("design:type", conversation_entity_1.Conversation)
], ConversationMember.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], ConversationMember.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: "varchar",
        length: 16,
        default: ConversationMemberRole.MEMBER,
    }),
    __metadata("design:type", String)
], ConversationMember.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: false }),
    __metadata("design:type", Boolean)
], ConversationMember.prototype, "muted", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ConversationMember.prototype, "leftAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ConversationMember.prototype, "lastReadAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ConversationMember.prototype, "joinedAt", void 0);
exports.ConversationMember = ConversationMember = __decorate([
    (0, typeorm_1.Entity)("conversation_members"),
    (0, typeorm_1.Unique)(["conversation", "user"])
], ConversationMember);
//# sourceMappingURL=conversation-member.entity.js.map