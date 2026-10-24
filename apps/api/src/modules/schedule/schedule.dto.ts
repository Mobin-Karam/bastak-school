import {
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  Min,
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
