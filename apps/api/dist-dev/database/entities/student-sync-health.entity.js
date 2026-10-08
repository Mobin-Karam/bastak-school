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
exports.StudentSyncHealth = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
let StudentSyncHealth = class StudentSyncHealth {
    id;
    student;
    deviceId;
    status;
    pendingCount;
    failureCode;
    correlationId;
    lastSuccessfulAt;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, student: { required: true, type: () => require("./student.entity").Student }, deviceId: { required: true, type: () => String }, status: { required: true, enum: ["online", "syncing", "failed", "offline"] }, pendingCount: { required: true, type: () => Number }, failureCode: { required: false, type: () => String, nullable: true }, correlationId: { required: false, type: () => String, nullable: true }, lastSuccessfulAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.StudentSyncHealth = StudentSyncHealth;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], StudentSyncHealth.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], StudentSyncHealth.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 96 }),
    __metadata("design:type", String)
], StudentSyncHealth.prototype, "deviceId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 16, default: "online" }),
    __metadata("design:type", String)
], StudentSyncHealth.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], StudentSyncHealth.prototype, "pendingCount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 80, nullable: true }),
    __metadata("design:type", Object)
], StudentSyncHealth.prototype, "failureCode", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], StudentSyncHealth.prototype, "correlationId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], StudentSyncHealth.prototype, "lastSuccessfulAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], StudentSyncHealth.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], StudentSyncHealth.prototype, "updatedAt", void 0);
exports.StudentSyncHealth = StudentSyncHealth = __decorate([
    (0, typeorm_1.Entity)("student_sync_health"),
    (0, typeorm_1.Index)(["student", "deviceId"], { unique: true })
], StudentSyncHealth);
//# sourceMappingURL=student-sync-health.entity.js.map