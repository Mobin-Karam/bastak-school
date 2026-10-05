import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Min,
  ValidateNested,
} from "class-validator";
import { Type } from "class-transformer";
import { TaskType } from "../../../database/entities/task.entity";

export class ImportTaskDto {
  @IsString()
  type!: TaskType | string;

  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  subject?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "startTime must use HH:mm" })
  startTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "start must use HH:mm" })
  start?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "endTime must use HH:mm" })
  endTime?: string;

  @IsOptional()
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d$/, { message: "end must use HH:mm" })
  end?: string;

  @IsOptional()
  duration?: number;

  @IsOptional()
  testCount?: number;

  @IsOptional()
  priority?: number;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional() @IsString() pages?: string;
  @IsOptional() @IsString() examRef?: string;
  @IsOptional() @IsString() examId?: string;
  @IsOptional() conflict?: boolean;
  @IsOptional() @IsString() conflictGroup?: string;
}

export class ImportPlanDto {
  @IsString()
  studentId!: string;

  @IsOptional()
  @IsDateString()
  date?: string;

  @IsOptional()
  @IsDateString()
  planDate?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ImportTaskDto)
  tasks!: ImportTaskDto[];

  @IsOptional()
  @IsBoolean()
  publish?: boolean;

  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() dayLabel?: string;
  @IsOptional() @IsString() persianDate?: string;
  @IsOptional() @IsString() jalaliId?: string;
  @IsOptional() @IsString() motivationText?: string;
  @IsOptional() @IsString() templateId?: string;
  @IsOptional() @IsInt() @Min(1) templateVersion?: number;
}
