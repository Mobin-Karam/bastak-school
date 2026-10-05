import { IsArray, IsBoolean, IsDateString, IsInt, IsOptional, IsString, IsUUID, IsUrl, MaxLength, Min, MinLength } from "class-validator";

export class SaveRelaxationTrackDto {
  @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @IsOptional() @IsString() @MaxLength(120) artist?: string;
  @IsUrl({ protocols: ["https"], require_protocol: true }) @MaxLength(1600) url!: string;
  @IsOptional() @IsBoolean() active?: boolean;
  @IsOptional() @IsUUID() organizationId?: string | null;
  @IsOptional() @IsArray() @IsInt({ each: true }) @Min(1, { each: true }) gradeIds?: number[] | null;
  @IsOptional() @IsDateString() availableFrom?: string | null;
  @IsOptional() @IsDateString() availableUntil?: string | null;
}
export class SelectRelaxationTrackDto { @IsUUID() trackId!: string; }
