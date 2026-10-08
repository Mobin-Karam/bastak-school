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
exports.SaveSchoolAnnouncementDto = exports.SavePrayerTimeDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const time = /^([01]\d|2[0-3]):[0-5]\d$/;
class SavePrayerTimeDto {
    date;
    fajr;
    sunrise;
    dhuhr;
    asr;
    maghrib;
    isha;
    source;
    static _OPENAPI_METADATA_FACTORY() {
        return { date: { required: false, type: () => String, description: "An empty date is the organisation-wide default; ISO dates are overrides." }, fajr: { required: true, type: () => String }, sunrise: { required: true, type: () => String }, dhuhr: { required: true, type: () => String }, asr: { required: true, type: () => String }, maghrib: { required: true, type: () => String }, isha: { required: true, type: () => String }, source: { required: false, type: () => String, maxLength: 160 } };
    }
}
exports.SavePrayerTimeDto = SavePrayerTimeDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.ValidateIf)((_dto, value) => value !== ""),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SavePrayerTimeDto.prototype, "date", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(time),
    __metadata("design:type", String)
], SavePrayerTimeDto.prototype, "fajr", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(time),
    __metadata("design:type", String)
], SavePrayerTimeDto.prototype, "sunrise", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(time),
    __metadata("design:type", String)
], SavePrayerTimeDto.prototype, "dhuhr", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(time),
    __metadata("design:type", String)
], SavePrayerTimeDto.prototype, "asr", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(time),
    __metadata("design:type", String)
], SavePrayerTimeDto.prototype, "maghrib", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(time),
    __metadata("design:type", String)
], SavePrayerTimeDto.prototype, "isha", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], SavePrayerTimeDto.prototype, "source", void 0);
class SaveSchoolAnnouncementDto {
    title;
    body;
    audience;
    classroomId;
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, maxLength: 180 }, body: { required: true, type: () => String, maxLength: 4000 }, audience: { required: true, enum: ["STAFF", "STUDENTS", "CLASS"], enum: ["STAFF", "STUDENTS", "CLASS"] }, classroomId: { required: false, type: () => String }, status: { required: false, enum: ["DRAFT", "ACTIVE", "ARCHIVED"], enum: ["DRAFT", "ACTIVE", "ARCHIVED"] } };
    }
}
exports.SaveSchoolAnnouncementDto = SaveSchoolAnnouncementDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], SaveSchoolAnnouncementDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], SaveSchoolAnnouncementDto.prototype, "body", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["STAFF", "STUDENTS", "CLASS"]),
    __metadata("design:type", String)
], SaveSchoolAnnouncementDto.prototype, "audience", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], SaveSchoolAnnouncementDto.prototype, "classroomId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["DRAFT", "ACTIVE", "ARCHIVED"]),
    __metadata("design:type", String)
], SaveSchoolAnnouncementDto.prototype, "status", void 0);
//# sourceMappingURL=school-home.dto.js.map