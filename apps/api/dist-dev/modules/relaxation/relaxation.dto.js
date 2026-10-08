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
exports.SelectRelaxationTrackDto = exports.SaveRelaxationTrackDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class SaveRelaxationTrackDto {
    title;
    artist;
    url;
    active;
    organizationId;
    gradeIds;
    availableFrom;
    availableUntil;
    static _OPENAPI_METADATA_FACTORY() {
        return { title: { required: true, type: () => String, minLength: 1, maxLength: 180 }, artist: { required: false, type: () => String, maxLength: 120 }, url: { required: true, type: () => String, maxLength: 1600, format: "uri" }, active: { required: false, type: () => Boolean }, organizationId: { required: false, type: () => String, nullable: true, format: "uuid" }, gradeIds: { required: false, type: () => [Number], nullable: true, minimum: 1 }, availableFrom: { required: false, type: () => String, nullable: true }, availableUntil: { required: false, type: () => String, nullable: true } };
    }
}
exports.SaveRelaxationTrackDto = SaveRelaxationTrackDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(1),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], SaveRelaxationTrackDto.prototype, "title", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], SaveRelaxationTrackDto.prototype, "artist", void 0);
__decorate([
    (0, class_validator_1.IsUrl)({ protocols: ["https"], require_protocol: true }),
    (0, class_validator_1.MaxLength)(1600),
    __metadata("design:type", String)
], SaveRelaxationTrackDto.prototype, "url", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SaveRelaxationTrackDto.prototype, "active", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", Object)
], SaveRelaxationTrackDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsInt)({ each: true }),
    (0, class_validator_1.Min)(1, { each: true }),
    __metadata("design:type", Object)
], SaveRelaxationTrackDto.prototype, "gradeIds", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], SaveRelaxationTrackDto.prototype, "availableFrom", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", Object)
], SaveRelaxationTrackDto.prototype, "availableUntil", void 0);
class SelectRelaxationTrackDto {
    trackId;
    static _OPENAPI_METADATA_FACTORY() {
        return { trackId: { required: true, type: () => String, format: "uuid" } };
    }
}
exports.SelectRelaxationTrackDto = SelectRelaxationTrackDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SelectRelaxationTrackDto.prototype, "trackId", void 0);
//# sourceMappingURL=relaxation.dto.js.map