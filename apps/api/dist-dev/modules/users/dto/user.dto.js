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
exports.TransferPlatformOwnershipDto = exports.SetRolesDto = exports.UpdateUserDto = exports.CreateUserDto = void 0;
const openapi = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateUserDto {
    phoneNumber;
    password;
    firstName;
    lastName;
    organizationId;
    roleCodes;
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: true, type: () => String, pattern: "^09\\d{9}$" }, password: { required: true, type: () => String, minLength: 12 }, firstName: { required: false, type: () => String, minLength: 0, maxLength: 100 }, lastName: { required: false, type: () => String, minLength: 0, maxLength: 100 }, organizationId: { required: false, type: () => String, format: "uuid" }, roleCodes: { required: true, type: () => [String], uniqueItems: true } };
    }
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^09\d{9}$/),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(12),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100),
    __metadata("design:type", String)
], CreateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100),
    __metadata("design:type", String)
], CreateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], CreateUserDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], CreateUserDto.prototype, "roleCodes", void 0);
class UpdateUserDto {
    phoneNumber;
    firstName;
    lastName;
    locale;
    timezone;
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: false, type: () => String, pattern: "^09\\d{9}$" }, firstName: { required: false, type: () => String, minLength: 0, maxLength: 100 }, lastName: { required: false, type: () => String, minLength: 0, maxLength: 100 }, locale: { required: false, type: () => String, minLength: 2, maxLength: 12 }, timezone: { required: false, type: () => String, minLength: 2, maxLength: 64 } };
    }
}
exports.UpdateUserDto = UpdateUserDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^09\d{9}$/),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(0, 100),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 12),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "locale", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Length)(2, 64),
    __metadata("design:type", String)
], UpdateUserDto.prototype, "timezone", void 0);
class SetRolesDto {
    roleCodes;
    organizationId;
    static _OPENAPI_METADATA_FACTORY() {
        return { roleCodes: { required: true, type: () => [String], uniqueItems: true }, organizationId: { required: false, type: () => String, format: "uuid" } };
    }
}
exports.SetRolesDto = SetRolesDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ArrayUnique)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], SetRolesDto.prototype, "roleCodes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], SetRolesDto.prototype, "organizationId", void 0);
class TransferPlatformOwnershipDto {
    targetUserId;
    static _OPENAPI_METADATA_FACTORY() {
        return { targetUserId: { required: true, type: () => String, format: "uuid" } };
    }
}
exports.TransferPlatformOwnershipDto = TransferPlatformOwnershipDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], TransferPlatformOwnershipDto.prototype, "targetUserId", void 0);
//# sourceMappingURL=user.dto.js.map