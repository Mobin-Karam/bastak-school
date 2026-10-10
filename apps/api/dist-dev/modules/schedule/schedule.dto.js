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
exports.ArchiveScheduleEntryDto = exports.SaveScheduleEntryDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SaveScheduleEntryDto {
    organizationId;
    classroomId;
    classBookId;
    teacherId;
    title;
    weekday;
    startTime;
    endTime;
    room;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, classroomId: { required: false, type: () => String, format: "uuid" }, classBookId: { required: false, type: () => String, format: "uuid" }, teacherId: { required: false, type: () => String, format: "uuid" }, title: { required: true, type: () => String }, weekday: { required: true, type: () => Number, minimum: 0, maximum: 6 }, startTime: { required: true, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, endTime: { required: true, type: () => String, pattern: "^([01]\\d|2[0-3]):[0-5]\\d$" }, room: { required: false, type: () => String } };
    }
}
exports.SaveScheduleEntryDto = SaveScheduleEntryDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaveScheduleEntryDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaveScheduleEntryDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaveScheduleEntryDto.prototype, "classBookId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SaveScheduleEntryDto.prototype, "teacherId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveScheduleEntryDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(6),
    __metadata("design:type", Number)
], SaveScheduleEntryDto.prototype, "weekday", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/),
    __metadata("design:type", String)
], SaveScheduleEntryDto.prototype, "startTime", void 0);
__decorate([
    (0, class_validator_1.Matches)(/^([01]\d|2[0-3]):[0-5]\d$/),
    __metadata("design:type", String)
], SaveScheduleEntryDto.prototype, "endTime", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveScheduleEntryDto.prototype, "room", void 0);
class ArchiveScheduleEntryDto {
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: ["ARCHIVED", "ACTIVE"], enum: ["ACTIVE", "ARCHIVED"] } };
    }
}
exports.ArchiveScheduleEntryDto = ArchiveScheduleEntryDto;
__decorate([
    (0, class_validator_1.IsIn)(["ACTIVE", "ARCHIVED"]),
    __metadata("design:type", String)
], ArchiveScheduleEntryDto.prototype, "status", void 0);
//# sourceMappingURL=schedule.dto.js.map