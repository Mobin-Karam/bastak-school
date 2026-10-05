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
  Min,
  MinLength,
} from "class-validator";

export class SaveEducationClassDto {
  @IsUUID() organizationId!: string;
  @IsString() @MinLength(2) @MaxLength(80) code!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsString() @MinLength(4) @MaxLength(16) schoolYear!: string;
  @IsInt() @Min(1) @Max(12) gradeId!: number;
  @IsString() @MinLength(2) @MaxLength(40) educationTypeId!: string;
  @IsString() @MinLength(2) @MaxLength(80) trackId!: string;
  @IsOptional() @IsInt() @Min(1) @Max(200) capacity?: number;
  @IsOptional() @IsString() @MaxLength(4000) description?: string;
  @IsOptional() @IsUUID() advisorId?: string | null;
}

export class UpdateEducationClassDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) code?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MinLength(4) @MaxLength(16) schoolYear?: string;
  @IsOptional() @IsInt() @Min(1) @Max(12) gradeId?: number;
  @IsOptional()
  @IsString()
  @MinLength(2)
  @MaxLength(40)
  educationTypeId?: string;
  @IsOptional() @IsString() @MinLength(2) @MaxLength(80) trackId?: string;
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
