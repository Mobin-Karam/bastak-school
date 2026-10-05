import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";
import { normalizeNationalCode } from "./national-code";

export class StudentSignupDto {
  @IsUUID() organizationId!: string;
  @Transform(({ value }) => normalizeNationalCode(String(value ?? ""))) @IsString() @Matches(/^\d{10}$/) nationalCode!: string;
  @IsString() @MinLength(12) @MaxLength(300) password!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @Type(() => Number) @IsInt() @Min(1) @Max(12) grade!: number;
  @IsString() @MaxLength(40) educationTypeId!: string;
  @IsOptional() @IsString() @MaxLength(80) trackId?: string;
}
export class SetPlatformStudentSignupDto { @IsBoolean() enabled!: boolean; }
export class SetOrganizationStudentSignupDto {
  @IsOptional() @IsBoolean() managedByOrganization?: boolean;
  @IsOptional() @IsBoolean() enabled?: boolean;
  @IsOptional() @IsInt() @Min(0) @Max(100_000) limit?: number;
}
export class AssignStudentOnboardingDto {
  @IsOptional() @IsIn(["AUTO", "MANUAL"]) mode?: "AUTO" | "MANUAL";
  @ValidateIf((value) => value.mode !== "AUTO") @IsUUID() organizationId?: string;
  @ValidateIf((value) => value.mode !== "AUTO") @IsUUID() advisorUserId?: string;
}

export class PlatformBootstrapDto {
  @IsString() @Matches(/^[a-zA-Z0-9._-]{3,80}$/) username!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(12) @MaxLength(300) password!: string;
  @IsString() @MinLength(2) @MaxLength(100) firstName!: string;
  @IsString() @MinLength(2) @MaxLength(100) lastName!: string;
}
