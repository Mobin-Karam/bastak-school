import { Transform, Type } from "class-transformer";
import { IsArray, IsBoolean, IsDateString, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, ValidateNested } from "class-validator";
import { normalizeNationalCode } from "../onboarding/national-code";

export class UpdateRegistrationProfileDto {
  @IsOptional() @Transform(({ value }) => normalizeNationalCode(String(value ?? ""))) @Matches(/^\d{10}$/) nationalCode?: string;
  @IsOptional() @IsString() @MaxLength(50) birthCertificateNumber?: string;
  @IsOptional() @IsDateString() birthDate?: string;
  @IsOptional() @IsString() @MaxLength(120) birthPlace?: string;
  @IsOptional() @IsString() @MaxLength(120) certificateIssuePlace?: string;
  @IsOptional() @IsIn(["male", "female", "other", "unspecified"]) gender?: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) gradeId?: number;
  @IsOptional() @IsString() @MaxLength(40) educationTypeId?: string;
  @IsOptional() @IsString() @MaxLength(80) trackId?: string;
  @IsOptional() @IsString() @MaxLength(240) previousSchool?: string;
  @IsOptional() @IsString() @MaxLength(2000) address?: string;
  @IsOptional() @Matches(/^\d{10}$/) postalCode?: string;
  @IsOptional() @IsString() @MaxLength(24) homePhone?: string;
  @IsOptional() @IsString() @MaxLength(24) emergencyPhone?: string;
  @IsOptional() @IsString() @MaxLength(4000) healthNotes?: string;
  @IsOptional() @IsString() @MaxLength(160) insuranceProvider?: string;
  @IsOptional() @IsString() @MaxLength(160) insuranceNumber?: string;
  @IsOptional() @IsString() @MaxLength(2000) transportNotes?: string;
}

export class StudentContactDto {
  @IsIn(["FATHER", "MOTHER", "LEGAL_GUARDIAN", "EMERGENCY"]) type!: "FATHER" | "MOTHER" | "LEGAL_GUARDIAN" | "EMERGENCY";
  @IsString() @MaxLength(160) fullName!: string;
  @IsOptional() @Transform(({ value }) => normalizeNationalCode(String(value ?? ""))) @Matches(/^\d{10}$/) nationalCode?: string;
  @IsOptional() @IsString() @MaxLength(24) phoneNumber?: string;
  @IsOptional() @IsString() @MaxLength(160) occupation?: string;
}

export class SetStudentContactsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => StudentContactDto) contacts!: StudentContactDto[];
}

export class RegistrationRequirementDto {
  @IsIn(["BASIC_INFORMATION", "IDENTITY_INFORMATION", "ADDRESS_CONTACT", "PARENTS", "PREVIOUS_EDUCATION", "DOCUMENTS", "HEALTH", "VACCINATION", "INSURANCE", "CONSENTS", "TRANSPORT", "TUITION", "LEGAL_GUARDIAN", "EMERGENCY_CONTACT", "PHOTOGRAPHS"]) sectionCode!: string;
  @IsBoolean() enabled!: boolean;
  @IsBoolean() required!: boolean;
  @IsInt() @Min(0) @Max(1000) sortOrder!: number;
  @IsOptional() @IsString() @MaxLength(2000) announcement?: string;
  @IsOptional() @IsDateString() opensAt?: string;
  @IsOptional() @IsDateString() closesAt?: string;
}

export class SetRegistrationRequirementsDto {
  @IsArray() @ValidateNested({ each: true }) @Type(() => RegistrationRequirementDto) requirements!: RegistrationRequirementDto[];
}

export class SubmitRegistrationSectionDto {
  @IsIn(["IN_PROGRESS", "SUBMITTED"]) status!: "IN_PROGRESS" | "SUBMITTED";
}

export class ReviewRegistrationSectionDto {
  @IsIn(["APPROVED", "NEEDS_CORRECTION"]) status!: "APPROVED" | "NEEDS_CORRECTION";
  @IsOptional() @IsString() @MaxLength(2000) reviewNote?: string;
}
