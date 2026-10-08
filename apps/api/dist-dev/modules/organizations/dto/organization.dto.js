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
exports.UpdateMemberDto = exports.AddMemberDto = exports.SetOrganizationFeaturesDto = exports.SetOrganizationEnabledDto = exports.UpdateOrganizationDto = exports.CreateOrganizationDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
const organization_entity_1 = require("../../../database/entities/organization.entity");
class CreateOrganizationDto {
    name;
    type;
    studentSignupManagedByOrganization;
    studentSignupEnabled;
    studentSignupLimit;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: true, type: () => String, minLength: 2, maxLength: 180 }, type: { required: true, enum: require("../../../database/entities/organization.entity").OrganizationType }, studentSignupManagedByOrganization: { required: false, type: () => Boolean }, studentSignupEnabled: { required: false, type: () => Boolean }, studentSignupLimit: { required: false, type: () => Number, minimum: 0, maximum: 100000 } };
    }
}
exports.CreateOrganizationDto = CreateOrganizationDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 180),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(organization_entity_1.OrganizationType),
    __metadata("design:type", String)
], CreateOrganizationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOrganizationDto.prototype, "studentSignupManagedByOrganization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], CreateOrganizationDto.prototype, "studentSignupEnabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100000),
    __metadata("design:type", Number)
], CreateOrganizationDto.prototype, "studentSignupLimit", void 0);
class UpdateOrganizationDto {
    name;
    type;
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { name: { required: false, type: () => String, minLength: 2, maxLength: 180 }, type: { required: false, enum: require("../../../database/entities/organization.entity").OrganizationType }, status: { required: false, enum: require("../../../database/entities/organization.entity").OrganizationStatus } };
    }
}
exports.UpdateOrganizationDto = UpdateOrganizationDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 180),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "name", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(organization_entity_1.OrganizationType),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEnum)(organization_entity_1.OrganizationStatus),
    __metadata("design:type", String)
], UpdateOrganizationDto.prototype, "status", void 0);
class SetOrganizationEnabledDto {
    enabled;
    static _OPENAPI_METADATA_FACTORY() {
        return { enabled: { required: true, type: () => Boolean } };
    }
}
exports.SetOrganizationEnabledDto = SetOrganizationEnabledDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetOrganizationEnabledDto.prototype, "enabled", void 0);
class SetOrganizationFeaturesDto {
    enabledFeatures;
    static _OPENAPI_METADATA_FACTORY() {
        return { enabledFeatures: { required: true, type: () => [String], uniqueItems: true } };
    }
}
exports.SetOrganizationFeaturesDto = SetOrganizationFeaturesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SetOrganizationFeaturesDto.prototype, "enabledFeatures", void 0);
class AddMemberDto {
    userId;
    roleCodes;
    static _OPENAPI_METADATA_FACTORY() {
        return { userId: { required: true, type: () => String, format: "uuid" }, roleCodes: { required: true, type: () => [String], uniqueItems: true } };
    }
}
exports.AddMemberDto = AddMemberDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AddMemberDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AddMemberDto.prototype, "roleCodes", void 0);
class UpdateMemberDto {
    status;
    roleCodes;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: false, enum: ["ACTIVE", "INACTIVE"], enum: ["ACTIVE", "INACTIVE"] }, roleCodes: { required: false, type: () => [String], uniqueItems: true } };
    }
}
exports.UpdateMemberDto = UpdateMemberDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["ACTIVE", "INACTIVE"]),
    __metadata("design:type", String)
], UpdateMemberDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], UpdateMemberDto.prototype, "roleCodes", void 0);
//# sourceMappingURL=organization.dto.js.map