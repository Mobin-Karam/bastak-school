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
exports.ApplyPlanTemplateDto = exports.PreviewPlanTemplateApplyDto = exports.CreatePlanTemplateDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreatePlanTemplateDto {
    organizationId;
    title;
    description;
    tags;
    days;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, title: { required: true, type: () => String, minLength: 1, maxLength: 180 }, description: { required: false, type: () => String, maxLength: 4000 }, tags: { required: false, type: () => [String], maxLength: 80, maxItems: 30 }, days: { required: false, type: () => [Object], maxItems: 366 } };
    }
}
exports.CreatePlanTemplateDto = CreatePlanTemplateDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreatePlanTemplateDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], CreatePlanTemplateDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], CreatePlanTemplateDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(30),
    (0, class_validator_1.IsString)({ each: true }),
    (0, class_validator_1.MaxLength)(80, { each: true }),
    __metadata("design:type", Array)
], CreatePlanTemplateDto.prototype, "tags", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(366),
    __metadata("design:type", Array)
], CreatePlanTemplateDto.prototype, "days", void 0);
class PreviewPlanTemplateApplyDto {
    targetStudentIds;
    targetStartDate;
    static _OPENAPI_METADATA_FACTORY() {
        return { targetStudentIds: { required: true, type: () => [String], format: "uuid", maxItems: 100 }, targetStartDate: { required: true, type: () => String } };
    }
}
exports.PreviewPlanTemplateApplyDto = PreviewPlanTemplateApplyDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayMaxSize)(100),
    (0, class_validator_1.IsUUID)("4", { each: true }),
    __metadata("design:type", Array)
], PreviewPlanTemplateApplyDto.prototype, "targetStudentIds", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], PreviewPlanTemplateApplyDto.prototype, "targetStartDate", void 0);
class ApplyPlanTemplateDto extends PreviewPlanTemplateApplyDto {
    replaceExisting;
    static _OPENAPI_METADATA_FACTORY() {
        return { replaceExisting: { required: false, type: () => Boolean } };
    }
}
exports.ApplyPlanTemplateDto = ApplyPlanTemplateDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], ApplyPlanTemplateDto.prototype, "replaceExisting", void 0);
//# sourceMappingURL=plan-template.dto.js.map