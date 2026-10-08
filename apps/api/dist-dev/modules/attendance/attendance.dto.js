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
exports.BulkMarkAttendanceDto = exports.AttendanceEntryDto = exports.CreateAttendanceSessionDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class CreateAttendanceSessionDto {
    organizationId;
    contextType;
    contextId;
    sessionDate;
    note;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, contextType: { required: true, enum: ["class", "class_group", "dorm"], enum: ["class", "class_group", "dorm"] }, contextId: { required: true, type: () => String, format: "uuid" }, sessionDate: { required: true, type: () => String }, note: { required: false, type: () => String, maxLength: 1000 } };
    }
}
exports.CreateAttendanceSessionDto = CreateAttendanceSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["class", "class_group", "dorm"]),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "contextType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "contextId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "sessionDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateAttendanceSessionDto.prototype, "note", void 0);
class AttendanceEntryDto {
    studentId;
    status;
    note;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentId: { required: true, type: () => String, format: "uuid" }, status: { required: true, enum: ["present", "absent", "late", "excused"], enum: ["present", "absent", "late", "excused"] }, note: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.AttendanceEntryDto = AttendanceEntryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AttendanceEntryDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["present", "absent", "late", "excused"]),
    __metadata("design:type", String)
], AttendanceEntryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], AttendanceEntryDto.prototype, "note", void 0);
class BulkMarkAttendanceDto {
    organizationId;
    sessionId;
    contextType;
    contextId;
    sessionDate;
    entries;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, sessionId: { required: false, type: () => String, format: "uuid" }, contextType: { required: false, enum: ["class", "class_group", "dorm"], enum: ["class", "class_group", "dorm"] }, contextId: { required: false, type: () => String, format: "uuid" }, sessionDate: { required: false, type: () => String }, entries: { required: true, type: () => [require("./attendance.dto").AttendanceEntryDto] } };
    }
}
exports.BulkMarkAttendanceDto = BulkMarkAttendanceDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "sessionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["class", "class_group", "dorm"]),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "contextType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "contextId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "sessionDate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AttendanceEntryDto),
    __metadata("design:type", Array)
], BulkMarkAttendanceDto.prototype, "entries", void 0);
//# sourceMappingURL=attendance.dto.js.map