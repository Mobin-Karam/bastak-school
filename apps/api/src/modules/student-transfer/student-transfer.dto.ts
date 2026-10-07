import { Transform, Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";
import { normalizeNationalCode } from "../onboarding/national-code";

export class StudentImportRowDto {
  @IsString() @MaxLength(100) firstName!: string;
  @IsString() @MaxLength(100) lastName!: string;
  @IsOptional()
  @Transform(({ value }) =>
    value ? normalizeNationalCode(String(value)) : undefined,
  )
  @Matches(/^\d{10}$/)
  nationalCode?: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) gradeId?: number;
  @IsOptional() @IsString() @MaxLength(40) educationTypeId?: string;
  @IsOptional() @IsString() @MaxLength(80) trackId?: string;
}

export class PreviewStudentImportDto {
  @IsUUID() organizationId!: string;
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => StudentImportRowDto)
  rows!: StudentImportRowDto[];
}

export class CommitStudentImportDto extends PreviewStudentImportDto {}
