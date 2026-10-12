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
exports.AttendancePool = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const attendance_session_entity_1 = require("./attendance-session.entity");
let AttendancePool = class AttendancePool {
    id;
    organization;
    session;
    place;
    endsAt;
    closedAt;
    createdAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, session: { required: true, type: () => require("./attendance-session.entity").AttendanceSession }, place: { required: true, type: () => String }, endsAt: { required: true, type: () => Date }, closedAt: { required: false, type: () => Date, nullable: true }, createdAt: { required: true, type: () => Date } };
    }
};
exports.AttendancePool = AttendancePool;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AttendancePool.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], AttendancePool.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.OneToOne)(() => attendance_session_entity_1.AttendanceSession, { onDelete: "CASCADE" }),
    (0, typeorm_1.JoinColumn)(),
    __metadata("design:type", attendance_session_entity_1.AttendanceSession)
], AttendancePool.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], AttendancePool.prototype, "place", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], AttendancePool.prototype, "endsAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], AttendancePool.prototype, "closedAt", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendancePool.prototype, "createdAt", void 0);
exports.AttendancePool = AttendancePool = __decorate([
    (0, typeorm_1.Entity)("attendance_pools")
], AttendancePool);
//# sourceMappingURL=attendance-pool.entity.js.map