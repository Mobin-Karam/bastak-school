import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  ArrayUnique,
  IsArray,
  IsInt,
  Min,
  Max,
  MinLength,
  IsBoolean,
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Matches,
  ValidateNested,
} from "class-validator";

export class CreateAttendanceSessionDto {
  @IsUUID() organizationId!: string;
  @IsIn(["class", "class_group", "dorm"]) contextType!:
    "class" | "class_group" | "dorm";
  @IsUUID() contextId!: string;
  @IsDateString() sessionDate!: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class AttendanceEntryDto {
  @IsUUID() studentId!: string;
  @IsIn(["present", "absent", "late", "excused"]) status!:
    "present" | "absent" | "late" | "excused";
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class BulkMarkAttendanceDto {
  @IsOptional() @IsInt() @Min(0) expectedRevision?: number;
  @IsOptional() @IsUUID() requestId?: string;
  @IsUUID() organizationId!: string;
  @IsOptional() @IsUUID() sessionId?: string;
  @IsOptional() @IsIn(["class", "class_group", "dorm"]) contextType?:
    "class" | "class_group" | "dorm";
  @IsOptional() @IsUUID() contextId?: string;
  @IsOptional() @IsDateString() sessionDate?: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique<AttendanceEntryDto>((entry) => entry.studentId)
  @ValidateNested({ each: true })
  @Type(() => AttendanceEntryDto)
  entries!: AttendanceEntryDto[];
}

export class ReviewAttendanceAbsenceDto {
  @IsIn(["approved", "rejected"])
  decision!: "approved" | "rejected";

  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class ResolveAttendanceSessionDto {
  @IsUUID() organizationId!: string;
  @IsIn(["class_schedule", "attendance_schedule"]) source!:
    "class_schedule" | "attendance_schedule";
  @IsUUID() scheduleId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  calendarDate!: string;
}

export class CreateExceptionalAttendanceSessionDto {
  @IsUUID() requestId!: string;
  @IsUUID() organizationId!: string;
  @IsIn(["class", "class_group", "dorm"]) contextType!:
    "class" | "class_group" | "dorm";
  @IsUUID() contextId!: string;
  @IsDateString({ strict: true }) sessionDate!: string;
  @IsString() @MinLength(3) @MaxLength(1000) reason!: string;
}

export class SessionAttendanceEntryDto {
  @IsUUID() studentId!: string;
  @IsIn(["present", "absent", "late"]) status!: "present" | "absent" | "late";
  @IsOptional() @IsString() @MaxLength(500) note?: string;
  @IsOptional() @IsInt() @Min(0) @Max(1440) minutesLate?: number;
  @IsOptional() @IsDateString({ strict: true }) arrivalAt?: string;
}

export class SaveAttendanceSessionRecordsDto {
  @IsUUID() requestId!: string;
  @IsInt() @Min(0) expectedRevision!: number;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique<SessionAttendanceEntryDto>((entry) => entry.studentId)
  @ValidateNested({ each: true })
  @Type(() => SessionAttendanceEntryDto)
  entries!: SessionAttendanceEntryDto[];
}

export class SubmitAttendanceSessionDto {
  @IsUUID() requestId!: string;
  @IsInt() @Min(0) expectedRevision!: number;
  @IsOptional() @IsBoolean() confirmPartial?: boolean;
}

export class SetDormAttendanceDelegateDto {
  @IsUUID() studentId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  startsOn!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  endsOn!: string;
}
export class DelegatedDormAttendanceDto {
  @IsUUID() requestId!: string;
  @IsInt() @Min(0) expectedRevision!: number;
  @Matches(/^\d{4}-\d{2}-\d{2}$/)
  @IsDateString({ strict: true })
  nightDate!: string;
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ArrayUnique<SessionAttendanceEntryDto>((entry) => entry.studentId)
  @ValidateNested({ each: true })
  @Type(() => SessionAttendanceEntryDto)
  entries!: SessionAttendanceEntryDto[];
}
export class CreateAttendancePoolDto {
  @IsUUID() requestId!: string;
  @IsUUID() organizationId!: string;
  @IsString() @MinLength(2) @MaxLength(160) title!: string;
  @IsString() @MinLength(2) @MaxLength(160) place!: string;
  @IsIn(["class", "class_group", "dorm"]) contextType!:
    "class" | "class_group" | "dorm";
  @IsUUID() contextId!: string;
  @IsInt() @Min(1) @Max(240) durationMinutes!: number;
}

export class AttendancePoolCheckInDto {
  @IsIn(["here"]) confirmation!: "here";
}
