import { ArrayUnique, IsArray, IsBoolean, IsEnum, IsIn, IsInt, IsOptional, IsString, IsUUID, Length, Max, Min } from "class-validator";
import { OrganizationStatus, OrganizationType } from "../../../database/entities/organization.entity";

export class CreateOrganizationDto { @IsString() @Length(2, 180) name!: string; @IsEnum(OrganizationType) type!: OrganizationType; @IsOptional() @IsBoolean() studentSignupManagedByOrganization?: boolean; @IsOptional() @IsBoolean() studentSignupEnabled?: boolean; @IsOptional() @IsInt() @Min(0) @Max(100000) studentSignupLimit?: number; }
export class UpdateOrganizationDto { @IsOptional() @IsString() @Length(2, 180) name?: string; @IsOptional() @IsEnum(OrganizationType) type?: OrganizationType; @IsOptional() @IsEnum(OrganizationStatus) status?: OrganizationStatus; }
export class SetOrganizationEnabledDto { @IsBoolean() enabled!: boolean; }
export class SetOrganizationFeaturesDto { @IsArray() @ArrayUnique() @IsString({ each: true }) enabledFeatures!: string[]; }
export class AddMemberDto { @IsUUID() userId!: string; @IsArray() @ArrayUnique() @IsString({ each: true }) roleCodes!: string[]; }
export class UpdateMemberDto { @IsOptional() @IsIn(["ACTIVE", "INACTIVE"]) status?: "ACTIVE" | "INACTIVE"; @IsOptional() @IsArray() @ArrayUnique() @IsString({ each: true }) roleCodes?: string[]; }
