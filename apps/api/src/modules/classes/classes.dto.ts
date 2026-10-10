import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Matches,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export const SCHOOL_YEAR_PATTERN =
  /^(140[5-9]|14[1-2][0-9]|1430)-(140[6-9]|14[1-3][0-9]|1431)$/;

export class SaveEducationClassDto {
  @IsUUID() organizationId!: string;
  @IsString() @MinLength(2) @MaxLength(80) code!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsString() @Matches(SCHOOL_YEAR_PATTERN) schoolYear!: string;
  @IsOptional() @IsInt() @Min(1) @Max(200) capacity?: number;
}

export class UpdateEducationClassDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) code?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional()
  @IsString()
  @Matches(SCHOOL_YEAR_PATTERN)
  schoolYear?: string;
  @IsOptional() @IsInt() @Min(1) @Max(200) capacity?: number;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsUUID() advisorId?: string | null;
  @IsOptional() @IsIn(["ACTIVE", "ARCHIVED"]) status?: "ACTIVE" | "ARCHIVED";
}

export class SetClassBooksDto {
  @IsArray()
  @ArrayUnique((item: { bookId?: string }) => item.bookId)
  @ArrayMaxSize(80)
  books!: Array<{ bookId: string; teacherId: string }>;
}

export class SetClassEnrollmentsDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(200)
  @IsUUID("4", { each: true })
  studentIds!: string[];
}

export class ClassTransferRowDto {
  @IsString() @MinLength(2) @MaxLength(80) code!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsString() @Matches(SCHOOL_YEAR_PATTERN) schoolYear!: string;
  @IsOptional() @IsInt() @Min(1) @Max(200) capacity?: number;
}

export class ClassTransferDto {
  @IsUUID() organizationId!: string;
  @IsArray()
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => ClassTransferRowDto)
  rows!: ClassTransferRowDto[];
}
