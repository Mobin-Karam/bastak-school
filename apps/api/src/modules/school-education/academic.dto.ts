import { Type } from "class-transformer";
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
  Matches,
  Max,
  MaxLength,
  Min,
} from "class-validator";
export class AcademicPageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit = 50;
  @IsOptional() @IsUUID() teacherId?: string;
  @IsOptional() @IsUUID() classroomId?: string;
  @IsOptional() @IsUUID() academicYearId?: string;
}
export class TeachingAssignmentDto {
  @IsUUID() academicYearId!: string;
  @IsOptional() @IsUUID() termId?: string;
  @IsUUID() classroomId!: string;
  @IsUUID() subjectId!: string;
  @IsUUID() teacherId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startsOn!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endsOn!: string;
}
export class SubjectBookReferenceDto {
  @IsUUID() subjectId!: string;
  @IsString() @MinLength(1) @MaxLength(120) bookId!: string;
}

export class EndTeachingAssignmentDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endsOn!: string;
  @IsString() @MinLength(2) @MaxLength(1000) reason!: string;
}
