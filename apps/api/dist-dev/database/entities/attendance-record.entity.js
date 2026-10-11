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
exports.AttendanceRecord = exports.AttendanceReviewStatus = exports.AttendanceStatus = void 0;
const openapi = require("@nestjs/swagger");
const typeorm_1 = require("typeorm");
const student_entity_1 = require("./student.entity");
const user_entity_1 = require("./user.entity");
var AttendanceStatus;
(function (AttendanceStatus) {
    AttendanceStatus["PRESENT"] = "present";
    AttendanceStatus["ABSENT"] = "absent";
    AttendanceStatus["LATE"] = "late";
    AttendanceStatus["EXCUSED"] = "excused";
})(AttendanceStatus || (exports.AttendanceStatus = AttendanceStatus = {}));
var AttendanceReviewStatus;
(function (AttendanceReviewStatus) {
    AttendanceReviewStatus["PENDING"] = "pending";
    AttendanceReviewStatus["APPROVED"] = "approved";
    AttendanceReviewStatus["REJECTED"] = "rejected";
})(AttendanceReviewStatus || (exports.AttendanceReviewStatus = AttendanceReviewStatus = {}));
let AttendanceRecord = class AttendanceRecord {
    id;
    session;
    student;
    status;
    note;
    physicalStatus;
    revision;
    minutesLate;
    arrivalAt;
    reviewStatus;
    reviewNote;
    reviewedBy;
    reviewedAt;
    recordedBy;
    createdAt;
    updatedAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: true, type: () => String }, session: { required: true, type: () => require("./attendance-session.entity").AttendanceSession }, student: { required: true, type: () => require("./student.entity").Student }, status: { required: true, enum: require("./attendance-record.entity").AttendanceStatus }, note: { required: true, type: () => String }, physicalStatus: { required: false, nullable: true, description: "Legacy projection `status` remains readable; this is the physical observation.", enum: ["present", "absent", "late", "legacy_unknown"] }, revision: { required: true, type: () => Number }, minutesLate: { required: false, type: () => Number, nullable: true }, arrivalAt: { required: false, type: () => Date, nullable: true }, reviewStatus: { required: false, nullable: true, enum: require("./attendance-record.entity").AttendanceReviewStatus }, reviewNote: { required: true, type: () => String }, reviewedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, reviewedAt: { required: false, type: () => Date, nullable: true }, recordedBy: { required: false, type: () => require("./user.entity").User, nullable: true }, createdAt: { required: true, type: () => Date }, updatedAt: { required: true, type: () => Date } };
    }
};
exports.AttendanceRecord = AttendanceRecord;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)("uuid"),
    __metadata("design:type", String)
], AttendanceRecord.prototype, "id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)("AttendanceSession", (session) => session.records, {
        onDelete: "CASCADE",
    }),
    __metadata("design:type", Function)
], AttendanceRecord.prototype, "session", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => student_entity_1.Student, { onDelete: "CASCADE" }),
    __metadata("design:type", student_entity_1.Student)
], AttendanceRecord.prototype, "student", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16, default: AttendanceStatus.PRESENT }),
    __metadata("design:type", String)
], AttendanceRecord.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], AttendanceRecord.prototype, "note", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 20, nullable: true }),
    __metadata("design:type", Object)
], AttendanceRecord.prototype, "physicalStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", default: 0 }),
    __metadata("design:type", Number)
], AttendanceRecord.prototype, "revision", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "integer", nullable: true }),
    __metadata("design:type", Object)
], AttendanceRecord.prototype, "minutesLate", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], AttendanceRecord.prototype, "arrivalAt", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "varchar", length: 16, nullable: true }),
    __metadata("design:type", Object)
], AttendanceRecord.prototype, "reviewStatus", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "text", default: "" }),
    __metadata("design:type", String)
], AttendanceRecord.prototype, "reviewNote", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], AttendanceRecord.prototype, "reviewedBy", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: "datetime", nullable: true }),
    __metadata("design:type", Object)
], AttendanceRecord.prototype, "reviewedAt", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.User, { nullable: true, onDelete: "SET NULL" }),
    __metadata("design:type", Object)
], AttendanceRecord.prototype, "recordedBy", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceRecord.prototype, "createdAt", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)(),
    __metadata("design:type", Date)
], AttendanceRecord.prototype, "updatedAt", void 0);
exports.AttendanceRecord = AttendanceRecord = __decorate([
    (0, typeorm_1.Entity)("attendance_records"),
    (0, typeorm_1.Index)(["session", "student"], { unique: true })
], AttendanceRecord);
//# sourceMappingURL=attendance-record.entity.js.map