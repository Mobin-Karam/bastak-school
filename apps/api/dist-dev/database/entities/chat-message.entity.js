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
exports.ChatMessage = exports.ChatMessageType = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const user_entity_1 = require("./user.entity");
const conversation_entity_1 = require("./conversation.entity");
const task_entity_1 = require("./task.entity");
var ChatMessageType;
(function (ChatMessageType) {
    ChatMessageType["TEXT"] = "TEXT";
    ChatMessageType["PLAN"] = "PLAN";
    ChatMessageType["EXAM"] = "EXAM";
    ChatMessageType["TASK"] = "TASK";
    ChatMessageType["MOTIVATION"] = "MOTIVATION";
    ChatMessageType["WARNING"] = "WARNING";
})(ChatMessageType || (exports.ChatMessageType = ChatMessageType = {}));
let ChatMessage = class ChatMessage {
    id;
    sender;
    receiverId;
    conversation;
    type;
    content;
    mentions;
    replyTo;
    linkedTask;
    editedAt;
    deletedAt;
    readAt;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, sender: { required: true, type: () => require("./user.entity").User }, receiverId: { required: true, type: () => String }, conversation: { required: false, type: () => require("./conversation.entity").Conversation, nullable: true }, type: { required: true, enum: require("./chat-message.entity").ChatMessageType }, content: { required: true, type: () => String }, mentions: { required: true, type: () => [String] }, replyTo: { required: false, type: () => require("./chat-message.entity").ChatMessage, nullable: true }, linkedTask: { required: false, type: () => require("./task.entity").Task, nullable: true }, editedAt: { required: false, type: () => Date, nullable: true }, deletedAt: { required: false, type: () => Date, nullable: true }, readAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date } };
    }
};
exports.ChatMessage = ChatMessage;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], ChatMessage.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, (user) => user.sentMessages, { onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], ChatMessage.prototype, "sender", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChatMessage.prototype, "receiverId", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => conversation_entity_1.Conversation, { nullable: true, onDelete: "CASCADE" }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "conversation", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 40 }),
    __metadata("design:type", String)
], ChatMessage.prototype, "type", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], ChatMessage.prototype, "content", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", default: "[]" }),
    __metadata("design:type", Array)
], ChatMessage.prototype, "mentions", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ChatMessage, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "replyTo", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => task_entity_1.Task, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "linkedTask", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "editedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "deletedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], ChatMessage.prototype, "readAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], ChatMessage.prototype, "createdAt", void 0);
exports.ChatMessage = ChatMessage = __decorate([
    (0, typeorm_1.Entity)("chat_messages")
], ChatMessage);
//# sourceMappingURL=chat-message.entity.js.map