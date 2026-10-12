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
exports.UpdateOrganizationAuthProfileDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const imageUrl = /^(?:$|\/(?!\/)[A-Za-z0-9/_.%-]+|https:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[A-Za-z0-9/_.%?=&+-]*)?)$/;
class UpdateOrganizationAuthProfileDto {
    name;
    published;
    displayName;
    brandName;
    description;
    address;
    phone;
    location;
    logoUrl;
    backgroundUrl;
    loginTitle;
    signupTitle;
    signupLabel;
    securityNotice;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, minLength: 2, maxLength: 180 }, published: { required: false, type: () => Boolean }, displayName: { required: false, type: () => String, maxLength: 180 }, brandName: { required: false, type: () => String, maxLength: 100 }, description: { required: false, type: () => String, maxLength: 1000 }, address: { required: false, type: () => String, maxLength: 500 }, phone: { required: false, type: () => String, maxLength: 40, pattern: "^[0-9\u06F0-\u06F9\u0660-\u0669+()\\s-]*$" }, location: { required: false, type: () => String, maxLength: 180 }, logoUrl: { required: false, type: () => String, maxLength: 1000 }, backgroundUrl: { required: false, type: () => String, maxLength: 1000 }, loginTitle: { required: false, type: () => String, maxLength: 180 }, signupTitle: { required: false, type: () => String, maxLength: 180 }, signupLabel: { required: false, type: () => String, maxLength: 180 }, securityNotice: { required: false, type: () => String, maxLength: 1000 } };
    }
}
exports.UpdateOrganizationAuthProfileDto = UpdateOrganizationAuthProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 180),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], UpdateOrganizationAuthProfileDto.prototype, "published", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "displayName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "brandName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(500),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    (0, class_validator_1.Matches)(/^[0-9۰-۹٠-٩+()\s-]*$/),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "phone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    (0, class_validator_1.Matches)(imageUrl),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "logoUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    (0, class_validator_1.Matches)(imageUrl),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "backgroundUrl", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "loginTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "signupTitle", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(180),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "signupLabel", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(1000),
    __metadata("design:type", String)
], UpdateOrganizationAuthProfileDto.prototype, "securityNotice", void 0);
//# sourceMappingURL=organization-profile.dto.js.map