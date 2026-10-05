import {
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  MinLength,
  IsIn,
} from "class-validator";
export class CreateStudentDto {
  @IsString() @Length(2, 160) name!: string;
  @IsString() @Length(2, 120) username!: string;
  @IsString() @MinLength(12) password!: string;
  @IsOptional() @IsUUID() organizationId?: string;
  @IsOptional() @IsIn(["school", "independent"]) learnerProfile?:
    "school" | "independent";
  @IsOptional()
  @IsIn(["adult", "gap_year", "homeschool", "other"])
  independentType?: "adult" | "gap_year" | "homeschool" | "other";
  @IsOptional() @IsString() @Length(0, 120) learningLevel?: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) gradeId?: number;
  @IsOptional() @IsString() @Length(1, 40) educationTypeId?: string;
  @IsOptional() @IsString() @Length(1, 80) trackId?: string;
  @IsOptional() @IsString() @Length(0, 80) grade?: string;
  @IsOptional() @IsString() @Length(0, 80) major?: string;
}
export class UpdateStudentDto {
  @IsOptional() @IsIn(["school", "independent"]) learnerProfile?:
    "school" | "independent";
  @IsOptional()
  @IsIn(["adult", "gap_year", "homeschool", "other"])
  independentType?: "adult" | "gap_year" | "homeschool" | "other";
  @IsOptional() @IsString() @Length(0, 120) learningLevel?: string;
  @IsOptional() @IsString() @Length(2, 160) name?: string;
  @IsOptional() @IsString() @Length(2, 120) username?: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) gradeId?: number;
  @IsOptional() @IsString() @Length(1, 40) educationTypeId?: string;
  @IsOptional() @IsString() @Length(1, 80) trackId?: string;
  @IsOptional() @IsString() @Length(0, 80) grade?: string;
  @IsOptional() @IsString() @Length(0, 80) major?: string;
  @IsOptional() @IsString() @Length(0, 160) targetUniversity?: string;
  @IsOptional() @IsString() @Length(0, 160) targetField?: string;
  @IsOptional() @IsString() @Length(0, 40) targetRank?: string;
  @IsOptional() @IsString() @Length(0, 40) dailyCapacity?: string;
}
export class ResetStudentPasswordDto {
  @IsString() @MinLength(12) password!: string;
}
