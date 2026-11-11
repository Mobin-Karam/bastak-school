import {
  IsArray,
  IsIn,
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsDateString,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  Matches,
  Max,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";

export class SaveScheduleEntryDto {
  @IsUUID() organizationId!: string;
  @IsOptional() @IsUUID() classroomId?: string;
  @IsOptional() @IsUUID() classBookId?: string;
  @IsOptional() @IsUUID() teacherId?: string;
  @IsString() title!: string;
  @IsInt() @Min(0) @Max(6) weekday!: number;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
  @IsOptional() @IsString() room?: string;
  @IsOptional() @IsUUID() academicYearId?: string;
  @IsOptional() @IsUUID() termId?: string;
  @IsOptional() @IsUUID() timeBlockId?: string;
}
export class CreateLegacyAcademicYearDto {
  @IsUUID() organizationId!: string;
  @IsString() @MinLength(2) name!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) startsOn!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) endsOn!: string;
}
export class CreateLegacyAcademicTermDto {
  @IsUUID() academicYearId!: string;
  @IsString() @MinLength(2) name!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) startsOn!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) endsOn!: string;
}
export class UpdateLegacyAcademicYearDto {
  @IsString() @MinLength(2) name!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) startsOn!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) endsOn!: string;
}
export class UpdateLegacyAcademicTermDto {
  @IsString() @MinLength(2) name!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) startsOn!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) endsOn!: string;
}
export class LegacyAcademicLifecycleDto {
  @IsIn(["activate", "archive", "reopen", "close-correction"]) action!:
    "activate" | "archive" | "reopen" | "close-correction";
}

/** Explicit, auditable allocation of legacy data; never performed automatically. */
export class ReconcileLegacyAcademicCycleDto {
  @IsUUID() organizationId!: string;
  @IsUUID() academicYearId!: string;
  @IsUUID() termId!: string;
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID("4", { each: true })
  scheduleEntryIds!: string[];
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID("4", { each: true })
  attendanceSessionIds!: string[];
}
export class SetScheduleSetupReminderDto {
  @IsUUID() organizationId!: string;
  @IsDateString() dueAt!: string;
}

export class CreateScheduleEntriesDto {
  @ArrayMinSize(1)
  @ArrayMaxSize(28)
  @ValidateNested({ each: true })
  @Type(() => SaveScheduleEntryDto)
  entries!: SaveScheduleEntryDto[];
}

export class ArchiveScheduleEntryDto {
  @IsIn(["ACTIVE", "ARCHIVED"]) status!: "ACTIVE" | "ARCHIVED";
}

/** Restores selected legacy sessions atomically after explicit slot-conflict decisions. */
export class RestoreArchivedScheduleEntriesDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(200)
  @IsUUID("4", { each: true })
  entryIds!: string[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID("4", { each: true })
  archiveConflictingEntryIds?: string[];
}

export class CreateScheduleTimeBlockDto {
  @IsUUID() organizationId!: string;
  @IsUUID() groupId!: string;
  @IsString() name!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
}
export class CreateScheduleTimeBlockGroupDto {
  @IsUUID() organizationId!: string;
  @IsString() name!: string;
}
export class UpdateScheduleTimeBlockGroupDto {
  @IsString() @MinLength(1) name!: string;
}
export class UpdateScheduleTimeBlockDto {
  @IsUUID() groupId!: string;
  @IsString() @MinLength(1) name!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
}
export class BulkSessionTimeChangeDto {
  @IsUUID() organizationId!: string;
  @IsUUID() academicYearId!: string;
  @IsUUID() termId!: string;
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(500)
  @IsUUID("4", { each: true })
  entryIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(7)
  @IsInt({ each: true })
  @Min(0, { each: true })
  @Max(6, { each: true })
  weekdays?: number[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  classroomIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  teacherIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  classBookIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsString({ each: true })
  rooms?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  timeBlockGroupIds?: string[];
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @IsUUID("4", { each: true })
  timeBlockIds?: string[];
  @IsIn(["SHIFT", "SET_TIME", "APPLY_BLOCK"]) operation!:
    "SHIFT" | "SET_TIME" | "APPLY_BLOCK";
  @IsOptional() @IsInt() @Min(-720) @Max(720) offsetMinutes?: number;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime?: string;
  @IsOptional() @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime?: string;
  @IsOptional() @IsUUID() targetTimeBlockId?: string;
}
export class ApplyBulkSessionTimeChangeDto extends BulkSessionTimeChangeDto {
  @IsString() @MinLength(16) previewFingerprint!: string;
}
export class CreateScheduleTemplateDto {
  @IsUUID() organizationId!: string;
  @IsString() name!: string;
  @IsOptional() @IsUUID() sourceTemplateId?: string;
  @IsOptional() @IsUUID() academicYearId?: string;
  @IsOptional() @IsUUID() termId?: string;
}
export class ApplyScheduleTemplateDto {
  @IsUUID() academicYearId!: string;
  @IsUUID() termId!: string;
  @IsString() @MinLength(16) previewFingerprint!: string;
}
export class PreviewScheduleTemplateDto {
  @IsUUID() academicYearId!: string;
  @IsUUID() termId!: string;
}
export class SetScheduleSafeguardDto {
  @IsBoolean() active!: boolean;
  @IsString() @MinLength(3) reason!: string;
  @IsOptional() @IsInt() @Min(1) @Max(120) durationMinutes?: number;
}
export class ExtendScheduleSafeguardDto {
  @IsString() @MinLength(3) reason!: string;
  @IsInt() @Min(1) @Max(120) durationMinutes!: number;
}
export class CreateScheduleSafeguardOverrideDto {
  @IsUUID() organizationId!: string;
  @IsIn([
    "ENTRY_CREATE",
    "ENTRY_UPDATE",
    "ENTRY_ARCHIVE",
    "ENTRY_DELETE",
    "TIME_BLOCK_MANAGE",
    "ACADEMIC_CYCLE_MANAGE",
    "RECONCILIATION",
  ])
  action!: string;
  @IsString() @MinLength(3) reason!: string;
  @IsOptional() @IsInt() @Min(1) @Max(30) durationMinutes?: number;
}
export class ScheduleSubstitutionRequestDto {
  @IsUUID() sourceEntryId!: string;
  @IsUUID() targetEntryId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) freezeDate!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) replacementDate!: string;
  @IsUUID() replacementTimeBlockId!: string;
  @IsString() @MinLength(2) title!: string;
  @IsOptional() @IsString() message?: string;
}
export class ScheduleSubstitutionDecisionDto {
  @IsIn(["approved", "rejected"]) decision!: "approved" | "rejected";
}
export class TeacherLeaveRequestDto {
  @IsUUID() organizationId!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) startDate!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) endDate!: string;
  @IsString() @MinLength(2) reason!: string;
}
export class TeacherLeaveReviewDto {
  @IsIn(["approved", "rejected"]) decision!: "approved" | "rejected";
  @IsOptional() @IsIn(["cancel", "substitute"]) resolution?:
    "cancel" | "substitute";
  @IsOptional() @IsUUID() substituteTeacherId?: string;
}
export class TeacherLeaveReturnRequestDto {
  @Matches(/^\d{4}-\d{2}-\d{2}$/) returnDate!: string;
  @IsOptional() @IsString() @MinLength(2) returnMessage?: string;
}
export class TeacherLeaveReturnReviewDto {
  @IsIn(["approved", "rejected"]) decision!: "approved" | "rejected";
}
