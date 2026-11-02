import { IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

export class AdjustRewardDto {
  @IsUUID() requestId!: string;
  @IsUUID() organizationId!: string;
  @IsUUID() studentId!: string;
  @IsInt() @Min(-50) @Max(50) points!: number;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
  @IsOptional() @IsIn(["class", "class_group", "dorm"]) contextType?: "class" | "class_group" | "dorm";
  @IsOptional() @IsUUID() contextId?: string;
  @IsOptional() @IsString() @MaxLength(200) contextName?: string;
}

export class ReverseRewardDto {
  @IsUUID() requestId!: string;
  @IsString() @MinLength(3) @MaxLength(500) reason!: string;
}
