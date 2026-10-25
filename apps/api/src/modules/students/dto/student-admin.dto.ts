import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Max,
  Min,
  MinLength,
  IsIn,
  IsBoolean,
} from "class-validator";
import { Type } from "class-transformer";
import { ValidateNested } from "class-validator";

export class GuardianAccountDto {
  @IsString() @Length(11, 11) phoneNumber!: string;
  @IsString() @MinLength(12) password!: string;
}
export class CreateStudentDto {
  @IsString() @Length(2, 160) name!: string;
  @IsString() @Length(11, 11) phoneNumber!: string;
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
  @IsOptional() @IsString() @Length(0, 160) targetUniversity?: string;
  @IsOptional() @IsString() @Length(0, 160) targetField?: string;
  @IsOptional() @IsString() @Length(0, 40) targetRank?: string;
  @IsOptional() @IsString() @Length(0, 40) dailyCapacity?: string;
  @IsOptional() @IsString() @Length(10, 10) nationalCode?: string;
  /** Jalali date in 1405/07/13 or 1405-07-13 form. */
  @IsOptional() @IsString() @Length(10, 10) birthDateJalali?: string;
  @IsOptional() @IsString() @Length(0, 240) governmentSchool?: string;
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianAccountDto)
  mother?: GuardianAccountDto;
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianAccountDto)
  father?: GuardianAccountDto;
}
export class UpdateStudentDto {
  @IsOptional() @IsIn(["school", "independent"]) learnerProfile?:
    "school" | "independent";
  @IsOptional()
  @IsIn(["adult", "gap_year", "homeschool", "other"])
  independentType?: "adult" | "gap_year" | "homeschool" | "other";
  @IsOptional() @IsString() @Length(0, 120) learningLevel?: string;
  @IsOptional() @IsString() @Length(2, 160) name?: string;
  @IsOptional() @IsString() @Length(11, 11) phoneNumber?: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) gradeId?: number;
  @IsOptional() @IsString() @Length(1, 40) educationTypeId?: string;
  @IsOptional() @IsString() @Length(1, 80) trackId?: string;
  @IsOptional() @IsString() @Length(0, 80) grade?: string;
  @IsOptional() @IsString() @Length(0, 80) major?: string;
  @IsOptional() @IsString() @Length(0, 160) targetUniversity?: string;
  @IsOptional() @IsString() @Length(0, 160) targetField?: string;
  @IsOptional() @IsString() @Length(0, 40) targetRank?: string;
  @IsOptional() @IsString() @Length(0, 40) dailyCapacity?: string;
  @IsOptional() @IsString() @Length(10, 10) nationalCode?: string;
  /** Jalali date in 1405/07/13 or 1405-07-13 form. */
  @IsOptional() @IsString() @Length(10, 10) birthDateJalali?: string;
  @IsOptional() @IsString() @Length(0, 240) governmentSchool?: string;
  @IsOptional() @IsUUID() classId?: string;
  @IsOptional() @IsBoolean() clearClass?: boolean;
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianAccountDto)
  mother?: GuardianAccountDto;
  @IsOptional()
  @ValidateNested()
  @Type(() => GuardianAccountDto)
  father?: GuardianAccountDto;
}
export class ResetStudentPasswordDto {
  @IsString() @MinLength(12) password!: string;
}

/** Password rotation for a deliberate, bounded set of authorized students. */
export class BulkResetStudentPasswordDto extends ResetStudentPasswordDto {
  @ArrayNotEmpty()
  @ArrayMaxSize(500)
  @IsUUID("4", { each: true })
  studentIds!: string[];
}
