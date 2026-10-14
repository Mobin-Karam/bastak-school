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
exports.TimetableBulkDto = exports.TimetableBulkItemDto = exports.TimetableQueryDto = exports.TimetablePageDto = exports.TimetableAttendanceDto = exports.TimetableImportDto = exports.TimetableImportRowDto = exports.TimetableImportProvenanceDto = exports.TimetableConfigDto = exports.TimetableOverrideDto = exports.TimetablePublishDto = exports.TimetableVersionDto = exports.TimetableLessonWriteDto = exports.TimetableLessonDto = exports.TimetableRevisionDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
class DatesDto {
    startsOn;
    endsOn;
    static _OPENAPI_METADATA_FACTORY() {
        return { startsOn: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, endsOn: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" } };
    }
}
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], DatesDto.prototype, "startsOn", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], DatesDto.prototype, "endsOn", void 0);
class TimetableRevisionDto {
    expectedRevision;
    static _OPENAPI_METADATA_FACTORY() {
        return { expectedRevision: { required: true, type: () => Number, minimum: 0 } };
    }
}
exports.TimetableRevisionDto = TimetableRevisionDto;
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], TimetableRevisionDto.prototype, "expectedRevision", void 0);
class TimetableLessonDto extends DatesDto {
    classroomId;
    classBookId;
    teacherId;
    periodId;
    locationId;
    weekday;
    startTime;
    endTime;
    notes;
    static _OPENAPI_METADATA_FACTORY() {
        return { classroomId: { required: true, type: () => String, format: "uuid" }, classBookId: { required: true, type: () => String, format: "uuid" }, teacherId: { required: false, type: () => String, nullable: true, format: "uuid" }, periodId: { required: true, type: () => String, format: "uuid" }, locationId: { required: false, type: () => String, nullable: true, format: "uuid" }, weekday: { required: true, type: () => Number, minimum: 0, maximum: 6 }, startTime: { required: true, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, endTime: { required: true, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, notes: { required: false, type: () => String, maxLength: 1000 } };
    }
}
exports.TimetableLessonDto = TimetableLessonDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableLessonDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableLessonDto.prototype, "classBookId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], TimetableLessonDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableLessonDto.prototype, "periodId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], TimetableLessonDto.prototype, "locationId", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], TimetableLessonDto.prototype, "weekday", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/),
    __metadata("design:type", String)
], TimetableLessonDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/),
    __metadata("design:type", String)
], TimetableLessonDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], TimetableLessonDto.prototype, "notes", void 0);
class TimetableLessonWriteDto extends TimetableRevisionDto {
    lesson;
    static _OPENAPI_METADATA_FACTORY() {
        return { lesson: { required: true, type: () => require("./timetable.dto").TimetableLessonDto } };
    }
}
exports.TimetableLessonWriteDto = TimetableLessonWriteDto;
__decorate([
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TimetableLessonDto),
    __metadata("design:type", TimetableLessonDto)
], TimetableLessonWriteDto.prototype, "lesson", void 0);
class TimetableVersionDto {
    termId;
    name;
    copyVersionId;
    effectiveOn;
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { termId: { required: true, type: () => String, format: "uuid" }, name: { required: true, type: () => String, minLength: 2, maxLength: 160 }, copyVersionId: { required: false, type: () => String, format: "uuid" }, effectiveOn: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, reason: { required: true, type: () => String, minLength: 2, maxLength: 1000 } };
    }
}
exports.TimetableVersionDto = TimetableVersionDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableVersionDto.prototype, "termId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], TimetableVersionDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableVersionDto.prototype, "copyVersionId", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TimetableVersionDto.prototype, "effectiveOn", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], TimetableVersionDto.prototype, "reason", void 0);
class TimetablePublishDto extends TimetableRevisionDto {
    reason;
    static _OPENAPI_METADATA_FACTORY() {
        return { reason: { required: true, type: () => String, minLength: 2, maxLength: 1000 } };
    }
}
exports.TimetablePublishDto = TimetablePublishDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], TimetablePublishDto.prototype, "reason", void 0);
class TimetableOverrideDto extends TimetablePublishDto {
    lessonId;
    date;
    cancelled;
    teacherId;
    locationId;
    startTime;
    endTime;
    static _OPENAPI_METADATA_FACTORY() {
        return { lessonId: { required: true, type: () => String, format: "uuid" }, date: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, cancelled: { required: true, type: () => Boolean }, teacherId: { required: false, type: () => String, nullable: true, format: "uuid" }, locationId: { required: false, type: () => String, nullable: true, format: "uuid" }, startTime: { required: false, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, endTime: { required: false, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" } };
    }
}
exports.TimetableOverrideDto = TimetableOverrideDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableOverrideDto.prototype, "lessonId", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TimetableOverrideDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TimetableOverrideDto.prototype, "cancelled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], TimetableOverrideDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], TimetableOverrideDto.prototype, "locationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/),
    __metadata("design:type", String)
], TimetableOverrideDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/),
    __metadata("design:type", String)
], TimetableOverrideDto.prototype, "endTime", void 0);
class TimetableConfigDto {
    kind;
    id;
    parentId;
    name;
    startsOn;
    endsOn;
    date;
    timeZone;
    active;
    sectionId;
    sessionKind;
    startTime;
    endTime;
    number;
    weekdays;
    weekday;
    teacherId;
    classroomId;
    classBookId;
    reason;
    expectedRevision;
    static _OPENAPI_METADATA_FACTORY() {
        return { kind: { required: true, type: () => String, enum: [
                    "year",
                    "term",
                    "section",
                    "location",
                    "bell",
                    "session",
                    "period",
                    "holiday",
                    "availability",
                    "allocation",
                    "classSection",
                ] }, id: { required: false, type: () => String, format: "uuid" }, parentId: { required: false, type: () => String, format: "uuid" }, name: { required: false, type: () => String, maxLength: 160 }, startsOn: { required: false, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, endsOn: { required: false, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, date: { required: false, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, timeZone: { required: false, type: () => String, maxLength: 64 }, active: { required: false, type: () => Boolean }, sectionId: { required: false, type: () => String, nullable: true, format: "uuid" }, sessionKind: { required: false, enum: ["MORNING", "AFTERNOON", "OTHER"], enum: ["MORNING", "AFTERNOON", "OTHER"] }, startTime: { required: false, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, endTime: { required: false, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, number: { required: false, type: () => Number, minimum: 1, maximum: 500 }, weekdays: { required: false, type: () => [Number], minimum: 0, maximum: 6, uniqueItems: true, maxItems: 7 }, weekday: { required: false, type: () => Number, minimum: 0, maximum: 6 }, teacherId: { required: false, type: () => String, format: "uuid" }, classroomId: { required: false, type: () => String, format: "uuid" }, classBookId: { required: false, type: () => String, format: "uuid" }, reason: { required: false, type: () => String, maxLength: 1000 }, expectedRevision: { required: false, type: () => Number, minimum: 0 } };
    }
}
exports.TimetableConfigDto = TimetableConfigDto;
__decorate([
    (0, class_validator_1.IsIn)([
        "year",
        "term",
        "section",
        "location",
        "bell",
        "session",
        "period",
        "holiday",
        "availability",
        "allocation",
        "classSection",
    ]),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "kind", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "parentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "startsOn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "endsOn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(64),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "timeZone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TimetableConfigDto.prototype, "active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], TimetableConfigDto.prototype, "sectionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["MORNING", "AFTERNOON", "OTHER"]),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "sessionKind", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(500),
    __metadata("design:type", Number)
], TimetableConfigDto.prototype, "number", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(7),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(0, { each: true }),
    (0, class_validator_1.Max)(6, { each: true }),
    __metadata("design:type", Array)
], TimetableConfigDto.prototype, "weekdays", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], TimetableConfigDto.prototype, "weekday", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "classBookId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], TimetableConfigDto.prototype, "reason", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Number)
], TimetableConfigDto.prototype, "expectedRevision", void 0);
class TimetableImportProvenanceDto {
    sheetName;
    cellAddress;
    masterCell;
    blockId;
    rawClassLabel;
    rawSubjectLabel;
    rawTeacherLabel;
    rawPeriodLabel;
    rawTimeLabel;
    merged;
    static _OPENAPI_METADATA_FACTORY() {
        return { sheetName: { required: true, type: () => String, maxLength: 160 }, cellAddress: { required: true, type: () => String, maxLength: 32 }, masterCell: { required: true, type: () => String, maxLength: 32 }, blockId: { required: true, type: () => String, maxLength: 32 }, rawClassLabel: { required: true, type: () => String, maxLength: 240 }, rawSubjectLabel: { required: true, type: () => String, maxLength: 240 }, rawTeacherLabel: { required: true, type: () => String, maxLength: 240 }, rawPeriodLabel: { required: true, type: () => String, maxLength: 240 }, rawTimeLabel: { required: true, type: () => String, maxLength: 240 }, merged: { required: true, type: () => Boolean } };
    }
}
exports.TimetableImportProvenanceDto = TimetableImportProvenanceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "sheetName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "cellAddress", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "masterCell", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(32),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "blockId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "rawClassLabel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "rawSubjectLabel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "rawTeacherLabel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "rawPeriodLabel", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], TimetableImportProvenanceDto.prototype, "rawTimeLabel", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], TimetableImportProvenanceDto.prototype, "merged", void 0);
class TimetableImportRowDto {
    source;
    provenance;
    lesson;
    static _OPENAPI_METADATA_FACTORY() {
        return { source: { required: true, type: () => String, maxLength: 160 }, provenance: { required: false, type: () => require("./timetable.dto").TimetableImportProvenanceDto }, lesson: { required: true, type: () => require("./timetable.dto").TimetableLessonDto } };
    }
}
exports.TimetableImportRowDto = TimetableImportRowDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], TimetableImportRowDto.prototype, "source", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TimetableImportProvenanceDto),
    __metadata("design:type", TimetableImportProvenanceDto)
], TimetableImportRowDto.prototype, "provenance", void 0);
__decorate([
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TimetableLessonDto),
    __metadata("design:type", TimetableLessonDto)
], TimetableImportRowDto.prototype, "lesson", void 0);
class TimetableImportDto extends TimetableRevisionDto {
    filename;
    sheetName;
    rows;
    static _OPENAPI_METADATA_FACTORY() {
        return { filename: { required: true, type: () => String, maxLength: 160 }, sheetName: { required: true, type: () => String, maxLength: 160 }, rows: { required: true, type: () => [require("./timetable.dto").TimetableImportRowDto], minItems: 1, maxItems: 200 } };
    }
}
exports.TimetableImportDto = TimetableImportDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], TimetableImportDto.prototype, "filename", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], TimetableImportDto.prototype, "sheetName", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(200),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TimetableImportRowDto),
    __metadata("design:type", Array)
], TimetableImportDto.prototype, "rows", void 0);
class TimetableAttendanceDto {
    date;
    static _OPENAPI_METADATA_FACTORY() {
        return { date: { required: true, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" } };
    }
}
exports.TimetableAttendanceDto = TimetableAttendanceDto;
__decorate([
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TimetableAttendanceDto.prototype, "date", void 0);
class TimetablePageDto {
    offset = 0;
    limit = 50;
    static _OPENAPI_METADATA_FACTORY() {
        return { offset: { required: true, type: () => Object, default: 0, minimum: 0 }, limit: { required: true, type: () => Object, default: 50, minimum: 1, maximum: 200 } };
    }
}
exports.TimetablePageDto = TimetablePageDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    __metadata("design:type", Object)
], TimetablePageDto.prototype, "offset", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Type)(() => Number),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(200),
    __metadata("design:type", Object)
], TimetablePageDto.prototype, "limit", void 0);
class TimetableQueryDto extends TimetablePageDto {
    versionId;
    classroomId;
    teacherId;
    studentId;
    academicYearId;
    locationId;
    view;
    startsOn;
    endsOn;
    static _OPENAPI_METADATA_FACTORY() {
        return { versionId: { required: false, type: () => String, format: "uuid" }, classroomId: { required: false, type: () => String, format: "uuid" }, teacherId: { required: false, type: () => String, format: "uuid" }, studentId: { required: false, type: () => String, format: "uuid" }, academicYearId: { required: false, type: () => String, format: "uuid" }, locationId: { required: false, type: () => String, format: "uuid" }, view: { required: false, enum: ["DAILY", "WEEKLY"], enum: ["DAILY", "WEEKLY"] }, startsOn: { required: false, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" }, endsOn: { required: false, type: () => String, pattern: "^\\d{4}-\\d{2}-\\d{2}$" } };
    }
}
exports.TimetableQueryDto = TimetableQueryDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "versionId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "studentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "academicYearId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "locationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["DAILY", "WEEKLY"]),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "view", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "startsOn", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{4}-\d{2}-\d{2}$/),
    (0, class_validator_1.IsDateString)({ strict: true }),
    __metadata("design:type", String)
], TimetableQueryDto.prototype, "endsOn", void 0);
class TimetableBulkItemDto {
    id;
    lesson;
    static _OPENAPI_METADATA_FACTORY() {
        return { id: { required: false, type: () => String, format: "uuid" }, lesson: { required: true, type: () => require("./timetable.dto").TimetableLessonDto } };
    }
}
exports.TimetableBulkItemDto = TimetableBulkItemDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TimetableBulkItemDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsDefined)(),
    (0, class_validator_1.ValidateNested)(),
    (0, class_transformer_1.Type)(() => TimetableLessonDto),
    __metadata("design:type", TimetableLessonDto)
], TimetableBulkItemDto.prototype, "lesson", void 0);
class TimetableBulkDto extends TimetableRevisionDto {
    items;
    static _OPENAPI_METADATA_FACTORY() {
        return { items: { required: true, type: () => [require("./timetable.dto").TimetableBulkItemDto], minItems: 1, maxItems: 100 } };
    }
}
exports.TimetableBulkDto = TimetableBulkDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMinSize)(1),
    (0, class_validator_1.ArrayMaxSize)(100),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => TimetableBulkItemDto),
    __metadata("design:type", Array)
], TimetableBulkDto.prototype, "items", void 0);
//# sourceMappingURL=timetable.dto.js.map