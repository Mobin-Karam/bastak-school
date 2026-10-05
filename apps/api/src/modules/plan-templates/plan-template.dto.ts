import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  MinLength,
} from "class-validator";
export class CreatePlanTemplateDto {
  @IsUUID() organizationId!: string;
  @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(30)
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  tags?: string[];
  @IsOptional() @IsArray() @ArrayMaxSize(366) days?: unknown[];
}

export class PreviewPlanTemplateApplyDto {
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  targetStudentIds!: string[];
  @IsDateString() targetStartDate!: string;
}

export class ApplyPlanTemplateDto extends PreviewPlanTemplateApplyDto {
  @IsOptional() @IsBoolean() replaceExisting?: boolean;
}
