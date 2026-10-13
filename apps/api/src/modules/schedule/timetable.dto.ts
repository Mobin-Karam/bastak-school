import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayUnique,
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsDefined,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
class DatesDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startsOn!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endsOn!: string;
}
export class TimetableRevisionDto {
  @IsInt() @Min(0) expectedRevision!: number;
}
export class TimetableLessonDto extends DatesDto {
  @IsUUID() classroomId!: string;
  @IsUUID() classBookId!: string;
  @IsOptional() @IsUUID() teacherId?: string | null;
  @IsUUID() periodId!: string;
  @IsOptional() @IsUUID() locationId?: string | null;
  @IsInt() @Min(0) @Max(6) weekday!: number;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
  @IsOptional() @IsString() @MaxLength(1000) notes?: string;
}
export class TimetableLessonWriteDto extends TimetableRevisionDto {
  @IsDefined()
  @ValidateNested()
  @Type(() => TimetableLessonDto)
  lesson!: TimetableLessonDto;
}
export class TimetableVersionDto {
  @IsUUID() termId!: string;
  @IsString() @MinLength(2) @MaxLength(160) name!: string;
  @IsOptional() @IsUUID() copyVersionId?: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  effectiveOn!: string;
  @IsString() @MinLength(2) @MaxLength(1000) reason!: string;
}
export class TimetablePublishDto extends TimetableRevisionDto {
  @IsString() @MinLength(2) @MaxLength(1000) reason!: string;
}
export class TimetableOverrideDto extends TimetablePublishDto {
  @IsUUID() lessonId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) date!: string;
  @IsBoolean() cancelled!: boolean;
  @IsOptional() @IsUUID() teacherId?: string | null;
  @IsOptional() @IsUUID() locationId?: string | null;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime?: string;
}
export class TimetableConfigDto {
  @IsIn([
    "year",
    "term",
    "section",
    "location",
    "bell",
    "session",
    "period",
    "holiday",
    "availability",
    "allocation",
    "classSection",
  ])
  kind!: string;
  @IsOptional() @IsUUID() id?: string;
  @IsOptional() @IsUUID() parentId?: string;
  @IsOptional() @IsString() @MaxLength(160) name?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startsOn?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endsOn?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  date?: string;
  @IsOptional() @IsString() @MaxLength(64) timeZone?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsUUID() sectionId?: string | null;
  @IsOptional() @IsIn(["MORNING", "AFTERNOON", "OTHER"]) sessionKind?:
    "MORNING" | "AFTERNOON" | "OTHER";
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime?: string;
  @IsOptional() @IsInt() @Min(1) @Max(500) number?: number;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @ArrayUnique()
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays?: number[];
  @IsOptional() @IsInt() @Min(0) @Max(6) weekday?: number;
  @IsOptional() @IsUUID() teacherId?: string;
  @IsOptional() @IsUUID() classroomId?: string;
  @IsOptional() @IsUUID() classBookId?: string;
  @IsOptional() @IsString() @MaxLength(1000) reason?: string;
  @IsOptional() @IsInt() @Min(0) expectedRevision?: number;
}
export class TimetableImportRowDto {
  @IsString() @MaxLength(160) source!: string;
  @IsDefined()
  @ValidateNested()
  @Type(() => TimetableLessonDto)
  lesson!: TimetableLessonDto;
}
export class TimetableImportDto extends TimetableRevisionDto {
  @IsString() @MaxLength(160) filename!: string;
  @IsString() @MaxLength(160) sheetName!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @ValidateNested({ each: true })
  @Type(() => TimetableImportRowDto)
  rows!: TimetableImportRowDto[];
}
export class TimetableAttendanceDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) @IsDateString({ strict: true }) date!: string;
}

export class TimetablePageDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(0) offset = 0;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200) limit = 50;
}
export class TimetableQueryDto extends TimetablePageDto {
  @IsOptional() @IsUUID() versionId?: string;
  @IsOptional() @IsUUID() classroomId?: string;
  @IsOptional() @IsUUID() teacherId?: string;
  @IsOptional() @IsUUID() studentId?: string;
  @IsOptional() @IsUUID() academicYearId?: string;
  @IsOptional() @IsUUID() locationId?: string;
  @IsOptional() @IsIn(["DAILY", "WEEKLY"]) view?: "DAILY" | "WEEKLY";
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startsOn?: string;
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endsOn?: string;
}
export class TimetableBulkItemDto {
  @IsOptional() @IsUUID() id?: string;
  @IsDefined()
  @ValidateNested()
  @Type(() => TimetableLessonDto)
  lesson!: TimetableLessonDto;
}
export class TimetableBulkDto extends TimetableRevisionDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => TimetableBulkItemDto)
  items!: TimetableBulkItemDto[];
}
