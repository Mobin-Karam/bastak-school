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
exports.User = exports.UserStatus = exports.UserRole = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const session_entity_1 = require("./session.entity");
const student_entity_1 = require("./student.entity");
const chat_message_entity_1 = require("./chat-message.entity");
const audit_log_entity_1 = require("./audit-log.entity");
var UserRole;
(function (UserRole) {
    UserRole["ADMIN"] = "ADMIN";
    UserRole["STUDENT"] = "STUDENT";
    UserRole["GUARDIAN"] = "GUARDIAN";
    UserRole["ADVISOR"] = "ADVISOR";
    UserRole["TEACHER"] = "TEACHER";
    UserRole["MENTOR"] = "MENTOR";
    UserRole["CONTENT_MANAGER"] = "CONTENT_MANAGER";
    UserRole["ORGANIZATION_ADMIN"] = "ORGANIZATION_ADMIN";
    UserRole["PLATFORM_ADMIN"] = "PLATFORM_ADMIN";
})(UserRole || (exports.UserRole = UserRole = {}));
var UserStatus;
(function (UserStatus) {
    UserStatus["ACTIVE"] = "ACTIVE";
    UserStatus["DISABLED"] = "DISABLED";
    UserStatus["ARCHIVED"] = "ARCHIVED";
})(UserStatus || (exports.UserStatus = UserStatus = {}));
let User = class User {
    id;
    username;
    phoneNumber;
    email;
    passwordHash;
    role;
    firstName;
    lastName;
    status;
    isPlatformOwner;
    locale;
    timezone;
    chatDisplayName;
    chatBio;
    chatAvatarUrl;
    usernameChangeCount;
    usernameChangedAt;
    phoneNumberChangeCount;
    createdAt;
    updatedAt;
    sessions;
    student;
    sentMessages;
    auditLogs;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, username: { required: true, type: () => String }, phoneNumber: { required: false, type: () => String, nullable: true, description: "Required for new accounts; nullable only while pre-v3 accounts are migrated." }, email: { required: false, type: () => String, nullable: true }, passwordHash: { required: true, type: () => String }, role: { required: true, deprecated: true, enum: require("./user.entity").UserRole }, firstName: { required: true, type: () => String }, lastName: { required: true, type: () => String }, status: { required: true, enum: require("./user.entity").UserStatus }, isPlatformOwner: { required: true, type: () => Boolean, description: "Exactly one active account owns platform-level administration." }, locale: { required: true, type: () => String }, timezone: { required: true, type: () => String }, chatDisplayName: { required: true, type: () => String }, chatBio: { required: true, type: () => String }, chatAvatarUrl: { required: true, type: () => String }, usernameChangeCount: { required: true, type: () => Number }, usernameChangedAt: { required: false, type: () => Date, nullable: true }, phoneNumberChangeCount: { required: true, type: () => Number, description: "A student or guardian can correct the login phone once without review." }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, sessions: { required: true, type: () => [require("./session.entity").Session] }, student: { required: false, type: () => require("./student.entity").Student }, sentMessages: { required: true, type: () => [require("./chat-message.entity").ChatMessage] }, auditLogs: { required: true, type: () => [require("./audit-log.entity").AuditLog] } };
    }
};
exports.User = User;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], User.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], User.prototype, "username", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: "varchar", length: 11, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "phoneNumber", void 0);
__decorate([
    (0, typeorm_1.Index)({ unique: true }),
    (0, typeorm_1.Column)({ type: "varchar", length: 254, nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "email", void 0);
__decorate([
    (0, typeorm_1.Column)(),
    __metadata("design:type", String)
], User.prototype, "passwordHash", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24, nullable: false }),
    __metadata("design:type", String)
], User.prototype, "role", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: "" }),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: "" }),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, default: UserStatus.ACTIVE }),
    __metadata("design:type", String)
], User.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "boolean", default: false }),
    __metadata("design:type", Boolean)
], User.prototype, "isPlatformOwner", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 12, default: "fa-IR" }),
    __metadata("design:type", String)
], User.prototype, "locale", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64, default: "Asia/Tehran" }),
    __metadata("design:type", String)
], User.prototype, "timezone", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 100, default: "" }),
    __metadata("design:type", String)
], User.prototype, "chatDisplayName", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 500, default: "" }),
    __metadata("design:type", String)
], User.prototype, "chatBio", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 1200, default: "" }),
    __metadata("design:type", String)
], User.prototype, "chatAvatarUrl", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "usernameChangeCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], User.prototype, "usernameChangedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ default: 0 }),
    __metadata("design:type", Number)
], User.prototype, "phoneNumberChangeCount", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], User.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => session_entity_1.Session, (session) => session.user),
    __metadata("design:type", Array)
], User.prototype, "sessions", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => student_entity_1.Student, (student) => student.user),
    __metadata("design:type", student_entity_1.Student)
], User.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => chat_message_entity_1.ChatMessage, (message) => message.sender),
    __metadata("design:type", Array)
], User.prototype, "sentMessages", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => audit_log_entity_1.AuditLog, (log) => log.user),
    __metadata("design:type", Array)
], User.prototype, "auditLogs", void 0);
exports.User = User = __decorate([
    (0, typeorm_1.Entity)("users")
], User);
//# sourceMappingURL=user.entity.js.map