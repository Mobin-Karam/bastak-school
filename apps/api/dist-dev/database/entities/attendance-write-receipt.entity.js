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
exports.AttendanceWriteReceipt = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const attendance_session_entity_1 = require("./attendance-session.entity");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
let AttendanceWriteReceipt = class AttendanceWriteReceipt {
    id;
    organization;
    actor;
    session;
    requestId;
    fingerprint;
    result;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, actor: { required: true, type: () => require("./user.entity").User }, session: { required: true, type: () => require("./attendance-session.entity").AttendanceSession }, requestId: { required: true, type: () => String }, fingerprint: { required: true, type: () => String }, result: { required: true, type: () => Object }, createdAt: { required: true, type: () => Date } };
    }
};
exports.AttendanceWriteReceipt = AttendanceWriteReceipt;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AttendanceWriteReceipt.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], AttendanceWriteReceipt.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", user_entity_1.User)
], AttendanceWriteReceipt.prototype, "actor", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => attendance_session_entity_1.AttendanceSession, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", attendance_session_entity_1.AttendanceSession)
], AttendanceWriteReceipt.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 36 }),
    __metadata("design:type", String)
], AttendanceWriteReceipt.prototype, "requestId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64 }),
    __metadata("design:type", String)
], AttendanceWriteReceipt.prototype, "fingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json" }),
    __metadata("design:type", Object)
], AttendanceWriteReceipt.prototype, "result", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceWriteReceipt.prototype, "createdAt", void 0);
exports.AttendanceWriteReceipt = AttendanceWriteReceipt = __decorate([
    (0, typeorm_1.Entity)("attendance_write_receipts"),
    (0, typeorm_1.Index)("IDX_attendance_request_receipt", ["organization", "actor", "requestId"], { unique: true })
], AttendanceWriteReceipt);
//# sourceMappingURL=attendance-write-receipt.entity.js.map