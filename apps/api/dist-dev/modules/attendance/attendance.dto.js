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
exports.AttendancePoolCheckInDto = exports.CreateAttendancePoolDto = exports.DelegatedDormAttendanceDto = exports.SetDormAttendanceDelegateDto = exports.SubmitAttendanceSessionDto = exports.SaveAttendanceSessionRecordsDto = exports.SessionAttendanceEntryDto = exports.CreateExceptionalAttendanceSessionDto = exports.ResolveAttendanceSessionDto = exports.ReviewAttendanceAbsenceDto = exports.BulkMarkAttendanceDto = exports.AttendanceEntryDto = exports.CreateAttendanceSessionDto = void 0;
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
    expectedRevision;
    requestId;
    organizationId;
    sessionId;
    contextType;
    contextId;
    sessionDate;
    entries;
    static _OPENAPI_METADATA_FACTORY() {
        return { expectedRevision: { required: false, type: () => Number, minimum: 0 }, requestId: { required: false, type: () => String, format: "uuid" }, organizationId: { required: true, type: () => String, format: "uuid" }, sessionId: { required: false, type: () => String, format: "uuid" }, contextType: { required: false, enum: ["class", "class_group", "dorm"], enum: ["class", "class_group", "dorm"] }, contextId: { required: false, type: () => String, format: "uuid" }, sessionDate: { required: false, type: () => String }, entries: { required: true, type: () => [require("./attendance.dto").AttendanceEntryDto], uniqueItems: true, minItems: 1, maxItems: 500 } };
    }
}
exports.BulkMarkAttendanceDto = BulkMarkAttendanceDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], BulkMarkAttendanceDto.prototype, "expectedRevision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], BulkMarkAttendanceDto.prototype, "requestId", void 0);
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
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.ArrayUnique)((entry) => entry.studentId),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => AttendanceEntryDto),
    __metadata("design:type", Array)
], BulkMarkAttendanceDto.prototype, "entries", void 0);
class ReviewAttendanceAbsenceDto {
    decision;
    note;
    static _OPENAPI_METADATA_FACTORY() {
        return { decision: { required: true, enum: ["approved", "rejected"], enum: ["approved", "rejected"] }, note: { required: false, type: () => String, maxLength: 500 } };
    }
}
exports.ReviewAttendanceAbsenceDto = ReviewAttendanceAbsenceDto;
__decorate([
    (0, class_validator_1.IsIn)(["approved", "rejected"]),
    __metadata("design:type", String)
], ReviewAttendanceAbsenceDto.prototype, "decision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], ReviewAttendanceAbsenceDto.prototype, "note", void 0);
class ResolveAttendanceSessionDto {
    organizationId;
    source;
    scheduleId;
    calendarDate;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, source: { required: true, enum: ["class_schedule", "attendance_schedule"], enum: ["class_schedule", "attendance_schedule"] }, scheduleId: { required: true, type: () => String, format: "uuid" }, calendarDate: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" } };
    }
}
exports.ResolveAttendanceSessionDto = ResolveAttendanceSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ResolveAttendanceSessionDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["class_schedule", "attendance_schedule"]),
    __metadata("design:type", String)
], ResolveAttendanceSessionDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ResolveAttendanceSessionDto.prototype, "scheduleId", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], ResolveAttendanceSessionDto.prototype, "calendarDate", void 0);
class CreateExceptionalAttendanceSessionDto {
    requestId;
    organizationId;
    contextType;
    contextId;
    sessionDate;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { requestId: { required: true, type: () => String, format: "uuid" }, organizationId: { required: true, type: () => String, format: "uuid" }, contextType: { required: true, enum: ["class", "class_group", "dorm"], enum: ["class", "class_group", "dorm"] }, contextId: { required: true, type: () => String, format: "uuid" }, sessionDate: { required: true, type: () => String }, reason: { required: true, type: () => String, minLength: 3, maxLength: 1000 } };
    }
}
exports.CreateExceptionalAttendanceSessionDto = CreateExceptionalAttendanceSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateExceptionalAttendanceSessionDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateExceptionalAttendanceSessionDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["class", "class_group", "dorm"]),
    __metadata("design:type", String)
], CreateExceptionalAttendanceSessionDto.prototype, "contextType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateExceptionalAttendanceSessionDto.prototype, "contextId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], CreateExceptionalAttendanceSessionDto.prototype, "sessionDate", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], CreateExceptionalAttendanceSessionDto.prototype, "reason", void 0);
class SessionAttendanceEntryDto {
    studentId;
    status;
    note;
    minutesLate;
    arrivalAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentId: { required: true, type: () => String, format: "uuid" }, status: { required: true, enum: ["present", "absent", "late"], enum: ["present", "absent", "late"] }, note: { required: false, type: () => String, maxLength: 500 }, minutesLate: { required: false, type: () => Number, minimum: 0, maximum: 1440 }, arrivalAt: { required: false, type: () => String } };
    }
}
exports.SessionAttendanceEntryDto = SessionAttendanceEntryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SessionAttendanceEntryDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["present", "absent", "late"]),
    __metadata("design:type", String)
], SessionAttendanceEntryDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], SessionAttendanceEntryDto.prototype, "note", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1440),
    __metadata("design:type", Number)
], SessionAttendanceEntryDto.prototype, "minutesLate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], SessionAttendanceEntryDto.prototype, "arrivalAt", void 0);
class SaveAttendanceSessionRecordsDto {
    requestId;
    expectedRevision;
    entries;
    static _OPENAPI_METADATA_FACTORY() {
        return { requestId: { required: true, type: () => String, format: "uuid" }, expectedRevision: { required: true, type: () => Number, minimum: 0 }, entries: { required: true, type: () => [require("./attendance.dto").SessionAttendanceEntryDto], uniqueItems: true, minItems: 1, maxItems: 500 } };
    }
}
exports.SaveAttendanceSessionRecordsDto = SaveAttendanceSessionRecordsDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaveAttendanceSessionRecordsDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SaveAttendanceSessionRecordsDto.prototype, "expectedRevision", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.ArrayUnique)((entry) => entry.studentId),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SessionAttendanceEntryDto),
    __metadata("design:type", Array)
], SaveAttendanceSessionRecordsDto.prototype, "entries", void 0);
class SubmitAttendanceSessionDto {
    requestId;
    expectedRevision;
    confirmPartial;
    static _OPENAPI_METADATA_FACTORY() {
        return { requestId: { required: true, type: () => String, format: "uuid" }, expectedRevision: { required: true, type: () => Number, minimum: 0 }, confirmPartial: { required: false, type: () => Boolean } };
    }
}
exports.SubmitAttendanceSessionDto = SubmitAttendanceSessionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SubmitAttendanceSessionDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], SubmitAttendanceSessionDto.prototype, "expectedRevision", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SubmitAttendanceSessionDto.prototype, "confirmPartial", void 0);
class SetDormAttendanceDelegateDto {
    studentId;
    startsOn;
    endsOn;
    static _OPENAPI_METADATA_FACTORY() {
        return { studentId: { required: true, type: () => String, format: "uuid" }, startsOn: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, endsOn: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" } };
    }
}
exports.SetDormAttendanceDelegateDto = SetDormAttendanceDelegateDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SetDormAttendanceDelegateDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], SetDormAttendanceDelegateDto.prototype, "startsOn", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], SetDormAttendanceDelegateDto.prototype, "endsOn", void 0);
class DelegatedDormAttendanceDto {
    requestId;
    expectedRevision;
    nightDate;
    entries;
    static _OPENAPI_METADATA_FACTORY() {
        return { requestId: { required: true, type: () => String, format: "uuid" }, expectedRevision: { required: true, type: () => Number, minimum: 0 }, nightDate: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, entries: { required: true, type: () => [require("./attendance.dto").SessionAttendanceEntryDto], uniqueItems: true, minItems: 1, maxItems: 500 } };
    }
}
exports.DelegatedDormAttendanceDto = DelegatedDormAttendanceDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], DelegatedDormAttendanceDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], DelegatedDormAttendanceDto.prototype, "expectedRevision", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], DelegatedDormAttendanceDto.prototype, "nightDate", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.ArrayUnique)((entry) => entry.studentId),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => SessionAttendanceEntryDto),
    __metadata("design:type", Array)
], DelegatedDormAttendanceDto.prototype, "entries", void 0);
class CreateAttendancePoolDto {
    requestId;
    organizationId;
    title;
    place;
    contextType;
    contextId;
    durationMinutes;
    static _OPENAPI_METADATA_FACTORY() {
        return { requestId: { required: true, type: () => String, format: "uuid" }, organizationId: { required: true, type: () => String, format: "uuid" }, title: { required: true, type: () => String, minLength: 2, maxLength: 160 }, place: { required: true, type: () => String, minLength: 2, maxLength: 160 }, contextType: { required: true, enum: ["class", "class_group", "dorm"], enum: ["class", "class_group", "dorm"] }, contextId: { required: true, type: () => String, format: "uuid" }, durationMinutes: { required: true, type: () => Number, minimum: 1, maximum: 240 } };
    }
}
exports.CreateAttendancePoolDto = CreateAttendancePoolDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAttendancePoolDto.prototype, "requestId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAttendancePoolDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateAttendancePoolDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], CreateAttendancePoolDto.prototype, "place", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["class", "class_group", "dorm"]),
    __metadata("design:type", String)
], CreateAttendancePoolDto.prototype, "contextType", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateAttendancePoolDto.prototype, "contextId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(240),
    __metadata("design:type", Number)
], CreateAttendancePoolDto.prototype, "durationMinutes", void 0);
class AttendancePoolCheckInDto {
    confirmation;
    static _OPENAPI_METADATA_FACTORY() {
        return { confirmation: { required: true, type: () => String, enum: ["here"] } };
    }
}
exports.AttendancePoolCheckInDto = AttendancePoolCheckInDto;
__decorate([
    (0, class_validator_1.IsIn)(["here"]),
    __metadata("design:type", String)
], AttendancePoolCheckInDto.prototype, "confirmation", void 0);
//# sourceMappingURL=attendance.dto.js.map