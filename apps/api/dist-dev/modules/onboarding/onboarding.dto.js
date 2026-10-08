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
exports.PlatformBootstrapDto = exports.AssignStudentOnboardingDto = exports.SetOrganizationStudentSignupDto = exports.SetPlatformStudentSignupDto = exports.StudentSignupDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const phone_number_1 = require("../../common/utils/phone-number");
class StudentSignupDto {
    organizationId;
    phoneNumber;
    password;
    firstName;
    lastName;
    static _OPENAPI_METADATA_FACTORY() {
        return { organizationId: { required: true, type: () => String, format: "uuid" }, phoneNumber: { required: true, type: () => String, pattern: "^09\\d{9}$" }, password: { required: true, type: () => String, minLength: 12, maxLength: 300 }, firstName: { required: true, type: () => String, minLength: 2, maxLength: 100 }, lastName: { required: true, type: () => String, minLength: 2, maxLength: 100 } };
    }
}
exports.StudentSignupDto = StudentSignupDto;
__decorate([
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], StudentSignupDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (0, phone_number_1.normalizeIranianMobile)(String(value ?? ""))),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^09\d{9}$/, { message: "شماره همراه معتبر نیست." }),
    __metadata("design:type", String)
], StudentSignupDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(12),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], StudentSignupDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], StudentSignupDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], StudentSignupDto.prototype, "lastName", void 0);
class SetPlatformStudentSignupDto {
    enabled;
    static _OPENAPI_METADATA_FACTORY() {
        return { enabled: { required: true, type: () => Boolean } };
    }
}
exports.SetPlatformStudentSignupDto = SetPlatformStudentSignupDto;
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetPlatformStudentSignupDto.prototype, "enabled", void 0);
class SetOrganizationStudentSignupDto {
    managedByOrganization;
    enabled;
    limit;
    static _OPENAPI_METADATA_FACTORY() {
        return { managedByOrganization: { required: false, type: () => Boolean }, enabled: { required: false, type: () => Boolean }, limit: { required: false, type: () => Number, minimum: 0, maximum: 100000 } };
    }
}
exports.SetOrganizationStudentSignupDto = SetOrganizationStudentSignupDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetOrganizationStudentSignupDto.prototype, "managedByOrganization", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], SetOrganizationStudentSignupDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(100_000),
    __metadata("design:type", Number)
], SetOrganizationStudentSignupDto.prototype, "limit", void 0);
class AssignStudentOnboardingDto {
    mode;
    organizationId;
    advisorUserId;
    static _OPENAPI_METADATA_FACTORY() {
        return { mode: { required: false, enum: ["AUTO", "MANUAL"], enum: ["AUTO", "MANUAL"] }, organizationId: { required: false, type: () => String, format: "uuid" }, advisorUserId: { required: false, type: () => String, format: "uuid" } };
    }
}
exports.AssignStudentOnboardingDto = AssignStudentOnboardingDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["AUTO", "MANUAL"]),
    __metadata("design:type", String)
], AssignStudentOnboardingDto.prototype, "mode", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((value) => value.mode !== "AUTO"),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignStudentOnboardingDto.prototype, "organizationId", void 0);
__decorate([
    (0, class_validator_1.ValidateIf)((value) => value.mode !== "AUTO"),
    (0, class_validator_1.IsUUID)(),
    __metadata("design:type", String)
], AssignStudentOnboardingDto.prototype, "advisorUserId", void 0);
class PlatformBootstrapDto {
    phoneNumber;
    email;
    password;
    firstName;
    lastName;
    static _OPENAPI_METADATA_FACTORY() {
        return { phoneNumber: { required: true, type: () => String, pattern: "^09\\d{9}$" }, email: { required: true, type: () => String, maxLength: 254, format: "email" }, password: { required: true, type: () => String, minLength: 12, maxLength: 300 }, firstName: { required: true, type: () => String, minLength: 2, maxLength: 100 }, lastName: { required: true, type: () => String, minLength: 2, maxLength: 100 } };
    }
}
exports.PlatformBootstrapDto = PlatformBootstrapDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => (0, phone_number_1.normalizeIranianMobile)(String(value ?? ""))),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^09\d{9}$/, { message: "شماره همراه معتبر نیست." }),
    __metadata("design:type", String)
], PlatformBootstrapDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsEmail)(),
    (0, class_validator_1.MaxLength)(254),
    __metadata("design:type", String)
], PlatformBootstrapDto.prototype, "email", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(12),
    (0, class_validator_1.MaxLength)(300),
    __metadata("design:type", String)
], PlatformBootstrapDto.prototype, "password", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], PlatformBootstrapDto.prototype, "firstName", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(2),
    (0, class_validator_1.MaxLength)(100),
    __metadata("design:type", String)
], PlatformBootstrapDto.prototype, "lastName", void 0);
//# sourceMappingURL=onboarding.dto.js.map