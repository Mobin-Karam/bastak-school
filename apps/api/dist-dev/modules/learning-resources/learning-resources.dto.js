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
exports.SaveLearningResourceDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SaveLearningResourceDto {
    title;
    description;
    type;
    category;
    url;
    status;
    studentIds;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 2, maxLength: 180 }, description: { required: false, type: () => String, maxLength: 4000 }, type: { required: true, enum: ["LINK", "VIDEO"], enum: ["LINK", "VIDEO"] }, category: { required: false, type: () => String, minLength: 1, maxLength: 80 }, url: { required: true, type: () => String, maxLength: 1200, format: "uri" }, status: { required: false, enum: ["DRAFT", "PUBLISHED", "ARCHIVED"], enum: ["DRAFT", "PUBLISHED", "ARCHIVED"] }, studentIds: { required: true, type: () => [String], uniqueItems: true, maxItems: 500 } };
    }
}
exports.SaveLearningResourceDto = SaveLearningResourceDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], SaveLearningResourceDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], SaveLearningResourceDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsIn)(["LINK", "VIDEO"]),
    __metadata("design:type", String)
], SaveLearningResourceDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], SaveLearningResourceDto.prototype, "category", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({ protocols: ["https"], require_protocol: true }),
    (0, class_validator_1.MaxLength)(1200),
    __metadata("design:type", String)
], SaveLearningResourceDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["DRAFT", "PUBLISHED", "ARCHIVED"]),
    __metadata("design:type", String)
], SaveLearningResourceDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.ArrayMaxSize)(500),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SaveLearningResourceDto.prototype, "studentIds", void 0);
//# sourceMappingURL=learning-resources.dto.js.map