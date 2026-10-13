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
exports.AttendanceSchedule = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
let AttendanceSchedule = class AttendanceSchedule {
    id;
    organization;
    contextType;
    contextId;
    title;
    weekday;
    startTime;
    endTime;
    assignedStaff;
    status;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, contextType: { required: true, enum: ["class_group", "dorm"] }, contextId: { required: true, type: () => String }, title: { required: true, type: () => String }, weekday: { required: true, type: () => Number }, startTime: { required: true, type: () => String }, endTime: { required: true, type: () => String }, assignedStaff: { required: false, type: () => require("./user.entity").User, nullable: true }, status: { required: true, enum: ["ARCHIVED", "ACTIVE"] }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.AttendanceSchedule = AttendanceSchedule;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AttendanceSchedule.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { nullable: false, onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], AttendanceSchedule.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 24 }),
    __metadata("design:type", String)
], AttendanceSchedule.prototype, "contextType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], AttendanceSchedule.prototype, "contextId", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160 }),
    __metadata("design:type", String)
], AttendanceSchedule.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer" }),
    __metadata("design:type", Number)
], AttendanceSchedule.prototype, "weekday", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5 }),
    __metadata("design:type", String)
], AttendanceSchedule.prototype, "startTime", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 5 }),
    __metadata("design:type", String)
], AttendanceSchedule.prototype, "endTime", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], AttendanceSchedule.prototype, "assignedStaff", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: "ACTIVE" }),
    __metadata("design:type", String)
], AttendanceSchedule.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceSchedule.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceSchedule.prototype, "updatedAt", void 0);
exports.AttendanceSchedule = AttendanceSchedule = __decorate([
    (0, typeorm_1.Entity)("attendance_schedules"),
    (0, typeorm_1.Index)(["organization", "weekday", "status"])
], AttendanceSchedule);
//# sourceMappingURL=attendance-schedule.entity.js.map