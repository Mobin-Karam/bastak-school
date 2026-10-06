import { Type } from "class-transformer";
import { IsArray, IsDateString, IsIn, IsOptional, IsString, IsUUID, MaxLength, ValidateNested } from "class-validator";

export class CreateAttendanceSessionDto {
  @IsUUID() organizationId!: string;
  @IsIn(["class", "class_group", "dorm"]) contextType!: "class" | "class_group" | "dorm";
  @IsUUID() contextId!: string;
  @IsDateString() sessionDate!: string;
  @IsOptional() @IsString() @MaxLength(1000) note?: string;
}

export class AttendanceEntryDto {
  @IsUUID() studentId!: string;
  @IsIn(["present", "absent", "late", "excused"]) status!: "present" | "absent" | "late" | "excused";
  @IsOptional() @IsString() @MaxLength(500) note?: string;
}

export class BulkMarkAttendanceDto {
  @IsUUID() organizationId!: string;
  @IsOptional() @IsUUID() sessionId?: string;
  @IsOptional() @IsIn(["class", "class_group", "dorm"]) contextType?: "class" | "class_group" | "dorm";
  @IsOptional() @IsUUID() contextId?: string;
  @IsOptional() @IsDateString() sessionDate?: string;
  @IsArray() @ValidateNested({ each: true }) @Type(() => AttendanceEntryDto) entries!: AttendanceEntryDto[];
}
