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
exports.SharePlanRangeDto = exports.ShareEducationDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class ShareEducationDto {
    targetStudentId;
    date;
    static _OPENAPI_METADATA_FACTORY() {
        return { targetStudentId: { required: true, type: () => String, format: "uuid" }, date: { required: false, type: () => String } };
    }
}
exports.ShareEducationDto = ShareEducationDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], ShareEducationDto.prototype, "targetStudentId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], ShareEducationDto.prototype, "date", void 0);
class SharePlanRangeDto {
    targetStudentIds;
    sourceFrom;
    sourceTo;
    targetStartDate;
    conflictPolicy;
    static _OPENAPI_METADATA_FACTORY() {
        return { targetStudentIds: { required: true, type: () => [String], uniqueItems: true, format: "uuid", maxItems: 100 }, sourceFrom: { required: false, type: () => String }, sourceTo: { required: false, type: () => String }, targetStartDate: { required: false, type: () => String }, conflictPolicy: { required: false, description: "Skipping is deliberately the default: sharing should not erase a student's work by surprise.", enum: ["skip", "overwrite"], enum: ["skip", "overwrite"] } };
    }
}
exports.SharePlanRangeDto = SharePlanRangeDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.ArrayMaxSize)(100),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], SharePlanRangeDto.prototype, "targetStudentIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SharePlanRangeDto.prototype, "sourceFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SharePlanRangeDto.prototype, "sourceTo", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], SharePlanRangeDto.prototype, "targetStartDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["skip", "overwrite"]),
    __metadata("design:type", String)
], SharePlanRangeDto.prototype, "conflictPolicy", void 0);
//# sourceMappingURL=education-sharing.dto.js.map