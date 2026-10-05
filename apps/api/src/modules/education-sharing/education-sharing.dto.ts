import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsDateString,
  IsIn,
  IsOptional,
  IsUUID,
} from "class-validator";
export class ShareEducationDto {
  @IsUUID() targetStudentId!: string;
  @IsOptional() @IsDateString() date?: string;
}

/** A staff-facing copy operation. The existing single-plan endpoint stays intact. */
export class SharePlanRangeDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  targetStudentIds!: string[];

  @IsOptional() @IsDateString() sourceFrom?: string;
  @IsOptional() @IsDateString() sourceTo?: string;
  @IsOptional() @IsDateString() targetStartDate?: string;

  /** Skipping is deliberately the default: sharing should not erase a student's work by surprise. */
  @IsOptional()
  @IsIn(["skip", "overwrite"])
  conflictPolicy?: "skip" | "overwrite";
}
