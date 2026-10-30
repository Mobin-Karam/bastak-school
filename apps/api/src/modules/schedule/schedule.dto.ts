import {
  IsArray,
  IsIn,
  ArrayMaxSize,
  ArrayMinSize,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
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
export class CreateScheduleTemplateDto {
  @IsUUID() organizationId!: string;
  @IsString() name!: string;
  @IsOptional() @IsUUID() sourceTemplateId?: string;
}
export class ApplyScheduleTemplateDto {
  @IsUUID() academicYearId!: string;
  @IsUUID() termId!: string;
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
