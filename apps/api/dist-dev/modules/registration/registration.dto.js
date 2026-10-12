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
exports.ReviewRegistrationSectionDto = exports.SubmitRegistrationSectionDto = exports.SetRegistrationRequirementsDto = exports.RegistrationRequirementDto = exports.SetStudentContactsDto = exports.StudentContactDto = exports.UpdateRegistrationProfileDto = void 0;
const openapi = require("@nestjs/swagger");
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const onboarding_1 = require("../onboarding");
class UpdateRegistrationProfileDto {
    nationalCode;
    birthCertificateNumber;
    birthDate;
    birthPlace;
    certificateIssuePlace;
    gender;
    gradeId;
    educationTypeId;
    trackId;
    previousSchool;
    address;
    postalCode;
    homePhone;
    emergencyPhone;
    healthNotes;
    insuranceProvider;
    insuranceNumber;
    transportNotes;
    static _OPENAPI_METADATA_FACTORY() {
        return { nationalCode: { required: false, type: () => String, pattern: "^\\d{10}$" }, birthCertificateNumber: { required: false, type: () => String, maxLength: 50 }, birthDate: { required: false, type: () => String }, birthPlace: { required: false, type: () => String, maxLength: 120 }, certificateIssuePlace: { required: false, type: () => String, maxLength: 120 }, gender: { required: false, type: () => String, enum: ["male", "female", "other", "unspecified"] }, gradeId: { required: false, type: () => Number, minimum: 1, maximum: 12 }, educationTypeId: { required: false, type: () => String, maxLength: 40 }, trackId: { required: false, type: () => String, maxLength: 80 }, previousSchool: { required: false, type: () => String, maxLength: 240 }, address: { required: false, type: () => String, maxLength: 2000 }, postalCode: { required: false, type: () => String, pattern: "^\\d{10}$" }, homePhone: { required: false, type: () => String, maxLength: 24 }, emergencyPhone: { required: false, type: () => String, maxLength: 24 }, healthNotes: { required: false, type: () => String, maxLength: 4000 }, insuranceProvider: { required: false, type: () => String, maxLength: 160 }, insuranceNumber: { required: false, type: () => String, maxLength: 160 }, transportNotes: { required: false, type: () => String, maxLength: 2000 } };
    }
}
exports.UpdateRegistrationProfileDto = UpdateRegistrationProfileDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (0, onboarding_1.normalizeNationalCode)(String(value ?? ""))),
    (0, class_validator_1.Matches)(/^\d{10}$/),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "nationalCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(50),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "birthCertificateNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "birthDate", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "birthPlace", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(120),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "certificateIssuePlace", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsIn)(["male", "female", "other", "unspecified"]),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "gender", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(1),
    (0, class_validator_1.Max)(12),
    __metadata("design:type", Number)
], UpdateRegistrationProfileDto.prototype, "gradeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(40),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "educationTypeId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(80),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "trackId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(240),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "previousSchool", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "address", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.Matches)(/^\d{10}$/),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "postalCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(24),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "homePhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(24),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "emergencyPhone", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(4000),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "healthNotes", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "insuranceProvider", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "insuranceNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], UpdateRegistrationProfileDto.prototype, "transportNotes", void 0);
class StudentContactDto {
    type;
    fullName;
    nationalCode;
    phoneNumber;
    occupation;
    static _OPENAPI_METADATA_FACTORY() {
        return { type: { required: true, enum: ["FATHER", "MOTHER", "LEGAL_GUARDIAN", "EMERGENCY"], enum: ["FATHER", "MOTHER", "LEGAL_GUARDIAN", "EMERGENCY"] }, fullName: { required: true, type: () => String, maxLength: 160 }, nationalCode: { required: false, type: () => String, pattern: "^\\d{10}$" }, phoneNumber: { required: false, type: () => String, maxLength: 24 }, occupation: { required: false, type: () => String, maxLength: 160 } };
    }
}
exports.StudentContactDto = StudentContactDto;
__decorate([
    (0, class_validator_1.IsIn)(["FATHER", "MOTHER", "LEGAL_GUARDIAN", "EMERGENCY"]),
    __metadata("design:type", String)
], StudentContactDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], StudentContactDto.prototype, "fullName", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => (0, onboarding_1.normalizeNationalCode)(String(value ?? ""))),
    (0, class_validator_1.Matches)(/^\d{10}$/),
    __metadata("design:type", String)
], StudentContactDto.prototype, "nationalCode", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(24),
    __metadata("design:type", String)
], StudentContactDto.prototype, "phoneNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(160),
    __metadata("design:type", String)
], StudentContactDto.prototype, "occupation", void 0);
class SetStudentContactsDto {
    contacts;
    static _OPENAPI_METADATA_FACTORY() {
        return { contacts: { required: true, type: () => [require("./registration.dto").StudentContactDto] } };
    }
}
exports.SetStudentContactsDto = SetStudentContactsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => StudentContactDto),
    __metadata("design:type", Array)
], SetStudentContactsDto.prototype, "contacts", void 0);
class RegistrationRequirementDto {
    sectionCode;
    enabled;
    required;
    sortOrder;
    announcement;
    opensAt;
    closesAt;
    static _OPENAPI_METADATA_FACTORY() {
        return { sectionCode: { required: true, type: () => String, enum: ["BASIC_INFORMATION", "IDENTITY_INFORMATION", "ADDRESS_CONTACT", "PARENTS", "PREVIOUS_EDUCATION", "DOCUMENTS", "HEALTH", "VACCINATION", "INSURANCE", "CONSENTS", "TRANSPORT", "TUITION", "LEGAL_GUARDIAN", "EMERGENCY_CONTACT", "PHOTOGRAPHS"] }, enabled: { required: true, type: () => Boolean }, required: { required: true, type: () => Boolean }, sortOrder: { required: true, type: () => Number, minimum: 0, maximum: 1000 }, announcement: { required: false, type: () => String, maxLength: 2000 }, opensAt: { required: false, type: () => String }, closesAt: { required: false, type: () => String } };
    }
}
exports.RegistrationRequirementDto = RegistrationRequirementDto;
__decorate([
    (0, class_validator_1.IsIn)(["BASIC_INFORMATION", "IDENTITY_INFORMATION", "ADDRESS_CONTACT", "PARENTS", "PREVIOUS_EDUCATION", "DOCUMENTS", "HEALTH", "VACCINATION", "INSURANCE", "CONSENTS", "TRANSPORT", "TUITION", "LEGAL_GUARDIAN", "EMERGENCY_CONTACT", "PHOTOGRAPHS"]),
    __metadata("design:type", String)
], RegistrationRequirementDto.prototype, "sectionCode", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegistrationRequirementDto.prototype, "enabled", void 0);
__decorate([
    (0, class_validator_1.IsBoolean)(),
    __metadata("design:type", Boolean)
], RegistrationRequirementDto.prototype, "required", void 0);
__decorate([
    (0, class_validator_1.IsInt)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(1000),
    __metadata("design:type", Number)
], RegistrationRequirementDto.prototype, "sortOrder", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], RegistrationRequirementDto.prototype, "announcement", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RegistrationRequirementDto.prototype, "opensAt", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], RegistrationRequirementDto.prototype, "closesAt", void 0);
class SetRegistrationRequirementsDto {
    requirements;
    static _OPENAPI_METADATA_FACTORY() {
        return { requirements: { required: true, type: () => [require("./registration.dto").RegistrationRequirementDto] } };
    }
}
exports.SetRegistrationRequirementsDto = SetRegistrationRequirementsDto;
__decorate([
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.ValidateNested)({ each: true }),
    (0, class_transformer_1.Type)(() => RegistrationRequirementDto),
    __metadata("design:type", Array)
], SetRegistrationRequirementsDto.prototype, "requirements", void 0);
class SubmitRegistrationSectionDto {
    status;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: ["IN_PROGRESS", "SUBMITTED"], enum: ["IN_PROGRESS", "SUBMITTED"] } };
    }
}
exports.SubmitRegistrationSectionDto = SubmitRegistrationSectionDto;
__decorate([
    (0, class_validator_1.IsIn)(["IN_PROGRESS", "SUBMITTED"]),
    __metadata("design:type", String)
], SubmitRegistrationSectionDto.prototype, "status", void 0);
class ReviewRegistrationSectionDto {
    status;
    reviewNote;
    static _OPENAPI_METADATA_FACTORY() {
        return { status: { required: true, enum: ["NEEDS_CORRECTION", "APPROVED"], enum: ["APPROVED", "NEEDS_CORRECTION"] }, reviewNote: { required: false, type: () => String, maxLength: 2000 } };
    }
}
exports.ReviewRegistrationSectionDto = ReviewRegistrationSectionDto;
__decorate([
    (0, class_validator_1.IsIn)(["APPROVED", "NEEDS_CORRECTION"]),
    __metadata("design:type", String)
], ReviewRegistrationSectionDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MaxLength)(2000),
    __metadata("design:type", String)
], ReviewRegistrationSectionDto.prototype, "reviewNote", void 0);
//# sourceMappingURL=registration.dto.js.map