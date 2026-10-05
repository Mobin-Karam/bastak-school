import { Type } from "class-transformer";
import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  ValidateNested,
} from "class-validator";
import { RetryRequestStatus } from "../../../database/entities/exam-retry-request.entity";
import { SyllabusProgressStatus } from "../../../database/entities/syllabus-progress.entity";

export class SyllabusDto {
  @IsString() subject!: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsBoolean() required?: boolean;
  @IsOptional() @IsString() track?: string;
}
export class SyllabusProgressDto {
  @IsEnum(SyllabusProgressStatus) status!: SyllabusProgressStatus;
  @IsOptional() @IsInt() @Min(0) @Max(100) accuracy?: number;
  @IsOptional() @IsString() note?: string;
}
export class RetryRequestDto {
  @IsOptional() @IsString() message?: string;
}
export class ModerateRetryDto {
  @IsEnum(RetryRequestStatus) status!: RetryRequestStatus;
  @IsOptional() @IsString() note?: string;
}
export class QuizQuestionDto {
  @IsString() text!: string;
  @IsArray() @IsString({ each: true }) options!: string[];
  @IsString() correctAnswer!: string;
  @IsOptional() @IsString() explanation?: string;
  @IsOptional() @IsInt() sortOrder?: number;
}
export class CreateQuizDto {
  @IsString() title!: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsUUID() examId?: string;
  @IsOptional() @IsUUID() organizationId?: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() @Min(1) attemptLimit?: number;
  @IsOptional() @IsDateString() openAt?: string | null;
  @IsOptional() @IsDateString() closeAt?: string | null;
  @IsOptional() @IsIn(["immediate", "manual"]) resultPolicy?:
    "immediate" | "manual";
}
export class UpdateQuizDto {
  @IsOptional() @IsString() title?: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsInt() @Min(1) durationMinutes?: number;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsInt() @Min(1) attemptLimit?: number;
  @IsOptional() @IsDateString() openAt?: string | null;
  @IsOptional() @IsDateString() closeAt?: string | null;
  @IsOptional() @IsIn(["immediate", "manual"]) resultPolicy?:
    "immediate" | "manual";
}
export class QuizAssignmentsDto {
  @IsArray() @IsUUID("4", { each: true }) studentIds!: string[];
}
export class QuizClassAssignmentsDto {
  @IsArray() @IsUUID("4", { each: true }) classIds!: string[];
}
export class QuizAudienceRulesDto {
  @IsArray() @IsInt({ each: true }) @Min(1, { each: true }) gradeIds!: number[];
  @IsArray() @IsString({ each: true }) educationTypeIds!: string[];
  @IsArray() @IsString({ each: true }) trackIds!: string[];
  @IsArray()
  @IsIn(["school", "independent"], { each: true })
  learnerProfiles!: string[];
  @IsArray()
  @IsIn(["adult", "gap_year", "homeschool", "other"], { each: true })
  independentTypes!: string[];
}
export class QuizAnswerDto {
  @IsUUID() questionId!: string;
  @IsOptional() @IsString() selectedOption?: string | null;
}
export class SubmitQuizDto {
  @IsUUID() runId!: string;
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => QuizAnswerDto)
  answers!: QuizAnswerDto[];
}
