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
exports.MessageReaction = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const chat_message_entity_1 = require("./chat-message.entity");
const user_entity_1 = require("./user.entity");
let MessageReaction = class MessageReaction {
    id;
    message;
    user;
    emoji;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, message: { required: true, type: () => require("./chat-message.entity").ChatMessage }, user: { required: true, type: () => require("./user.entity").User }, emoji: { required: true, type: () => String }, createdAt: { required: true, type: () => Date } };
    }
};
exports.MessageReaction = MessageReaction;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], MessageReaction.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => chat_message_entity_1.ChatMessage, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", chat_message_entity_1.ChatMessage)
], MessageReaction.prototype, "message", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], MessageReaction.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 32 }),
    __metadata("design:type", String)
], MessageReaction.prototype, "emoji", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], MessageReaction.prototype, "createdAt", void 0);
exports.MessageReaction = MessageReaction = __decorate([
    (0, typeorm_1.Entity)("message_reactions"),
    (0, typeorm_1.Unique)(["message", "user", "emoji"])
], MessageReaction);
//# sourceMappingURL=message-reaction.entity.js.map