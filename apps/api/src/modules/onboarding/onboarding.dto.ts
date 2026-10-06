import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEmail, IsIn, IsInt, IsOptional, IsString, IsUUID, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";
import { normalizeIranianMobile } from "../../common/utils/phone-number";

export class StudentSignupDto {
  @IsUUID() organizationId!: string;
  @Transform(({ value }) => normalizeIranianMobile(String(value ?? "")))
  @IsString()
  @Matches(/^09\d{9}$/, { message: "شماره همراه معتبر نیست." })
  phoneNumber!: string;
  @IsString() @MinLength(12) @MaxLength(300) password!: string;
  @IsString() @MinLength(2) @MaxLength(100) firstName!: string;
  @IsString() @MinLength(2) @MaxLength(100) lastName!: string;
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
  @Transform(({ value }) => normalizeIranianMobile(String(value ?? ""))) @IsString() @Matches(/^09\d{9}$/, { message: "شماره همراه معتبر نیست." }) phoneNumber!: string;
  @IsEmail() @MaxLength(254) email!: string;
  @IsString() @MinLength(12) @MaxLength(300) password!: string;
  @IsString() @MinLength(2) @MaxLength(100) firstName!: string;
  @IsString() @MinLength(2) @MaxLength(100) lastName!: string;
}
