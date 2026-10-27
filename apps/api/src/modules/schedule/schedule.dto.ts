import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
  MinLength,
} from "class-validator";

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
}

export class ArchiveScheduleEntryDto {
  @IsIn(["ACTIVE", "ARCHIVED"]) status!: "ACTIVE" | "ARCHIVED";
}

export class CreateScheduleTimeBlockDto {
  @IsUUID() organizationId!: string;
  @IsString() name!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) startTime!: string;
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/) endTime!: string;
}
export class CreateScheduleTemplateDto {
  @IsUUID() organizationId!: string;
  @IsString() name!: string;
  @IsOptional() @IsUUID() sourceTemplateId?: string;
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
