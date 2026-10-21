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

export class AwardAttendancePointsDto {
  @IsUUID() requestId!: string;
  @IsUUID() organizationId!: string;
  @IsIn(["class", "class_group", "dorm"]) contextType!:
    | "class"
    | "class_group"
    | "dorm";
  @IsUUID() contextId!: string;
  @IsUUID() studentId!: string;
  @IsInt() @Min(-50) @Max(50) points!: number;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
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

/**
 * Absence-first is deliberately a separate command from progressive marking:
 * the server expands the immutable roster, so omitted students never depend
 * on a client-side interpretation of "present".
 */
export class SubmitAttendanceAbsencesDto {
  @IsUUID() requestId!: string;
  @IsInt() @Min(0) expectedRevision!: number;
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  absentStudentIds!: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @ArrayUnique()
  @IsUUID("4", { each: true })
  lateStudentIds?: string[];
}

export class FinalizeAttendanceSessionDto {
  @IsUUID() requestId!: string;
  @IsInt() @Min(0) expectedRevision!: number;
}

/** Cancelling preserves the session/audit evidence but blocks all marking. */
export class CancelAttendanceSessionDto {
  @IsUUID() requestId!: string;
  @IsInt() @Min(0) expectedRevision!: number;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}

export class CorrectAttendanceRecordDto {
  @IsUUID() requestId!: string;
  @IsInt() @Min(0) expectedRevision!: number;
  @IsIn(["present", "absent", "late"]) status!: "present" | "absent" | "late";
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
  @IsOptional() @IsInt() @Min(0) @Max(1440) minutesLate?: number;
}

export class UpdateAttendancePolicyDto {
  @IsUUID() organizationId!: string;
  @Matches(/^\d{2}:\d{2}$/) dayStartsAt!: string;
  @IsString() @MinLength(3) @MaxLength(64) timeZone!: string;
  @IsBoolean() allowPartialSubmission!: boolean;
  @IsBoolean() lateCountsAsPresent!: boolean;
  @IsOptional() @IsBoolean() correctionRequiresReview?: boolean;
}

export class ReviewAttendanceCorrectionDto {
  @IsUUID() requestId!: string;
  @IsIn(["approved", "rejected"]) decision!: "approved" | "rejected";
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class AttendanceHistoryQueryDto {
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) page?: number;
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(100) limit?: number;
  @IsOptional() @IsUUID() organizationId?: string;
  @IsOptional() @IsIn(["class", "class_group", "dorm"]) contextType?:
    "class" | "class_group" | "dorm";
  @IsOptional() @IsUUID() contextId?: string;
  @IsOptional() @IsString() @MaxLength(120) subjectId?: string;
  @IsOptional() @IsDateString({ strict: true }) from?: string;
  @IsOptional() @IsDateString({ strict: true }) to?: string;
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
