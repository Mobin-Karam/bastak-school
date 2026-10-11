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
exports.AttendanceSession = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const organization_entity_1 = require("./organization.entity");
const user_entity_1 = require("./user.entity");
const attendance_record_entity_1 = require("./attendance-record.entity");
let AttendanceSession = class AttendanceSession {
    id;
    organization;
    contextType;
    contextId;
    sessionDate;
    note;
    occurrenceKey;
    creationFingerprint;
    titleSnapshot;
    timeZone;
    operationalDate;
    scheduledStartAt;
    scheduledEndAt;
    status;
    revision;
    assignedStaff;
    submittedBy;
    submittedAt;
    sourceKind;
    sourceScheduleId;
    rosterCapturedAt;
    assignedStaffNameSnapshot;
    rosterSnapshot;
    createdBy;
    createdAt;
    updatedAt;
    records;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, organization: { required: true, type: () => require("./organization.entity").Organization }, contextType: { required: true, enum: ["class", "class_group", "dorm", "night", "pool", "study_group"] }, contextId: { required: true, type: () => String }, sessionDate: { required: true, type: () => Date }, note: { required: true, type: () => String }, occurrenceKey: { required: false, type: () => String, nullable: true }, creationFingerprint: { required: false, type: () => String, nullable: true }, titleSnapshot: { required: true, type: () => String }, timeZone: { required: true, type: () => String }, operationalDate: { required: false, type: () => String, nullable: true }, scheduledStartAt: { required: false, type: () => Date, nullable: true }, scheduledEndAt: { required: false, type: () => Date, nullable: true }, status: { required: true, enum: ["scheduled", "open", "draft", "submitted", "finalized", "cancelled"] }, revision: { required: true, type: () => Number }, assignedStaff: { required: false, type: () => require("./user.entity").User, nullable: true }, submittedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, submittedAt: { required: false, type: () => Date, nullable: true }, sourceKind: { required: false, nullable: true, enum: ["class_schedule", "attendance_schedule", "exceptional"] }, sourceScheduleId: { required: false, type: () => String, nullable: true }, rosterCapturedAt: { required: false, type: () => Date, nullable: true }, assignedStaffNameSnapshot: { required: true, type: () => String }, rosterSnapshot: { required: false, type: () => [Object], nullable: true }, createdBy: { required: false, type: () => require("./user.entity").User, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date }, records: { required: true, type: () => [require("./attendance-record.entity").AttendanceRecord] } };
    }
};
exports.AttendanceSession = AttendanceSession;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AttendanceSession.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.Index)(),
    (0, typeorm_1.ManyToOne)(() => organization_entity_1.Organization, { onDelete: "CASCADE" }),
    __metadata("design:type", organization_entity_1.Organization)
], AttendanceSession.prototype, "organization", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 24 }),
    __metadata("design:type", String)
], AttendanceSession.prototype, "contextType", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 120 }),
    __metadata("design:type", String)
], AttendanceSession.prototype, "contextId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime" }),
    __metadata("design:type", Date)
], AttendanceSession.prototype, "sessionDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], AttendanceSession.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 240, nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "occurrenceKey", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 64, nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "creationFingerprint", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160, default: "" }),
    __metadata("design:type", String)
], AttendanceSession.prototype, "titleSnapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 64, default: "Asia/Tehran" }),
    __metadata("design:type", String)
], AttendanceSession.prototype, "timeZone", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 10, nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "operationalDate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "scheduledStartAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "scheduledEndAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 20, default: "open" }),
    __metadata("design:type", String)
], AttendanceSession.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], AttendanceSession.prototype, "revision", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "assignedStaff", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "submittedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "submittedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 32, nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "sourceKind", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 36, nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "sourceScheduleId", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "rosterCapturedAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ length: 160, default: "" }),
    __metadata("design:type", String)
], AttendanceSession.prototype, "assignedStaffNameSnapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "simple-json", nullable: true }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "rosterSnapshot", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], AttendanceSession.prototype, "createdBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceSession.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceSession.prototype, "updatedAt", void 0);
__decorate([
    (0, typeorm_1.OneToMany)(() => attendance_record_entity_1.AttendanceRecord, (record) => record.session),
    __metadata("design:type", Array)
], AttendanceSession.prototype, "records", void 0);
exports.AttendanceSession = AttendanceSession = __decorate([
    (0, typeorm_1.Entity)("attendance_sessions"),
    (0, typeorm_1.Index)("IDX_attendance_session_occurrence", ["organization", "occurrenceKey"], {
        unique: true,
    })
], AttendanceSession);
//# sourceMappingURL=attendance-session.entity.js.map