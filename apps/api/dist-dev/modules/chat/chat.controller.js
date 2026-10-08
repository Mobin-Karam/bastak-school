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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatController = void 0;
const openapi = require("@nestjs/swagger");
const common_1 = require("@nestjs/common");
const current_user_decorator_1 = require("../../common/decorators/current-user.decorator");
const capabilities_decorator_1 = require("../../common/decorators/capabilities.decorator");
const envelope_1 = require("../../common/utils/envelope");
const chat_service_1 = require("./chat.service");
let ChatController = class ChatController {
    chat;
    constructor(chat) {
        this.chat = chat;
    }
    configuration() { return this.chat.configuration().then(envelope_1.ok); }
    updateConfiguration(u, emojis) { return this.chat.updateConfiguration(u, emojis).then(envelope_1.ok); }
    myProfile(u) { return this.chat.profile(u, u.id).then(envelope_1.ok); }
    updateProfile(u, body) { return this.chat.updateProfile(u, body).then(envelope_1.ok); }
    profile(u, id) { return this.chat.profile(u, id).then(envelope_1.ok); }
    allowUsernameChange(u, id) { return this.chat.allowUsernameChange(u, id).then(envelope_1.ok); }
    list(u) { return this.chat.conversations(u).then(envelope_1.ok); }
    direct(u, peer) { return this.chat.createDirect(u, peer).then(envelope_1.ok); }
    group(u, b) { return this.chat.createGroup(u, b.title, b.userIds || b.memberIds || [], b.description).then(envelope_1.ok); }
    users(u, search) { return this.chat.availableUsers(u, search).then(envelope_1.ok); }
    detail(u, id) { return this.chat.detail(u, id).then(envelope_1.ok); }
    messages(u, id, limit, before) { return this.chat.messagesForConversation(u, id, { limit: Number(limit), before }).then(envelope_1.ok); }
    send(u, id, b) { return this.chat.send(u, id, b.text, b).then(envelope_1.ok); }
    read(u, id) { return this.chat.markRead(u, id).then(envelope_1.ok); }
    edit(u, id, messageId, text) { return this.chat.edit(u, id, messageId, text).then(envelope_1.ok); }
    remove(u, id, messageId) { return this.chat.removeMessage(u, id, messageId).then(envelope_1.ok); }
    react(u, id, messageId, emoji) { return this.chat.react(u, id, messageId, emoji).then(envelope_1.ok); }
    mute(u, id, muted) { return this.chat.setMute(u, id, !!muted).then(envelope_1.ok); }
    mutePatch(u, id, muted) { return this.chat.setMute(u, id, !!muted).then(envelope_1.ok); }
    members(u, id, search) { return this.chat.listMembers(u, id, search).then(envelope_1.ok); }
    candidates(u, id, search) { return this.chat.candidateUsers(u, id, search).then(envelope_1.ok); }
    addMember(u, id, target) { return this.chat.addMember(u, id, target).then(envelope_1.ok); }
    removeMember(u, id, target) { return this.chat.updateMember(u, id, target, { remove: true }).then(envelope_1.ok); }
    updateGroup(u, id, body) { return this.chat.updateGroup(u, id, body).then(envelope_1.ok); }
    permissions(u, id, body) { return this.chat.updatePermissions(u, id, body).then(envelope_1.ok); }
    transfer(u, id, target) { return this.chat.transferOwner(u, id, target).then(envelope_1.ok); }
    leave(u, id) { return this.chat.leave(u, id).then(envelope_1.ok); }
    owner(u, id, target) { return this.chat.transferOwner(u, id, target).then(envelope_1.ok); }
    member(u, id, target, body) { return this.chat.updateMember(u, id, target, body).then(envelope_1.ok); }
};
exports.ChatController = ChatController;
__decorate([
    (0, common_1.Get)("configuration"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "configuration", null);
__decorate([
    (0, common_1.Patch)("configuration"),
    (0, capabilities_decorator_1.RequireCapabilities)("system.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)("allowedEmojis")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "updateConfiguration", null);
__decorate([
    (0, common_1.Get)("profile"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "myProfile", null);
__decorate([
    (0, common_1.Patch)("profile"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "updateProfile", null);
__decorate([
    (0, common_1.Get)("profiles/:userId"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "profile", null);
__decorate([
    (0, common_1.Post)("profiles/:userId/allow-username-change"),
    (0, capabilities_decorator_1.RequireCapabilities)("system.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "allowUsernameChange", null);
__decorate([
    (0, common_1.Get)("conversations"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "list", null);
__decorate([
    (0, common_1.Post)("conversations"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.send"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)("peerUserId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "direct", null);
__decorate([
    (0, common_1.Post)("groups"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.group.create"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "group", null);
__decorate([
    openapi.ApiQuery({ name: "search", required: false }),
    (0, common_1.Get)("users"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "users", null);
__decorate([
    (0, common_1.Get)("conversations/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "detail", null);
__decorate([
    openapi.ApiQuery({ name: "limit", required: false }),
    openapi.ApiQuery({ name: "before", required: false }),
    (0, common_1.Get)("conversations/:id/messages"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("limit")),
    __param(3, (0, common_1.Query)("before")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "messages", null);
__decorate([
    (0, common_1.Post)("conversations/:id/messages"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.send"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "send", null);
__decorate([
    (0, common_1.Post)("conversations/:id/read"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "read", null);
__decorate([
    (0, common_1.Patch)("conversations/:id/messages/:messageId"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.send"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("messageId")),
    __param(3, (0, common_1.Body)("text")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "edit", null);
__decorate([
    (0, common_1.Delete)("conversations/:id/messages/:messageId"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.send"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("messageId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "remove", null);
__decorate([
    (0, common_1.Post)("conversations/:id/messages/:messageId/reactions"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.send"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("messageId")),
    __param(3, (0, common_1.Body)("emoji")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "react", null);
__decorate([
    (0, common_1.Put)("conversations/:id/mute"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("muted")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "mute", null);
__decorate([
    (0, common_1.Patch)("conversations/:id/mute"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("muted")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "mutePatch", null);
__decorate([
    openapi.ApiQuery({ name: "search", required: false }),
    (0, common_1.Get)("groups/:id/members"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "members", null);
__decorate([
    openapi.ApiQuery({ name: "search", required: false }),
    (0, common_1.Get)("groups/:id/candidates"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Query)("search")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "candidates", null);
__decorate([
    (0, common_1.Post)("groups/:id/members"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.group.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "addMember", null);
__decorate([
    (0, common_1.Delete)("groups/:id/members/:userId"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.group.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "removeMember", null);
__decorate([
    (0, common_1.Patch)("groups/:id"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.group.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "updateGroup", null);
__decorate([
    (0, common_1.Patch)("groups/:id/permissions"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.group.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "permissions", null);
__decorate([
    (0, common_1.Post)("groups/:id/transfer-owner"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.group.manage"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "transfer", null);
__decorate([
    (0, common_1.Post)("groups/:id/leave"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.read"),
    openapi.ApiResponse({ status: 201 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "leave", null);
__decorate([
    (0, common_1.Put)("groups/:id/owner"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.group.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Body)("userId")),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "owner", null);
__decorate([
    (0, common_1.Patch)("groups/:id/members/:userId"),
    (0, capabilities_decorator_1.RequireCapabilities)("chat.group.manage"),
    openapi.ApiResponse({ status: 200 }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Param)("id")),
    __param(2, (0, common_1.Param)("userId")),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Object]),
    __metadata("design:returntype", void 0)
], ChatController.prototype, "member", null);
exports.ChatController = ChatController = __decorate([
    (0, common_1.Controller)("chat"),
    __metadata("design:paramtypes", [chat_service_1.ChatService])
], ChatController);
//# sourceMappingURL=chat.controller.js.map