import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
} from "class-validator";

const time = /^([01]\d|2[0-3]):[0-5]\d$/;

export class SavePrayerTimeDto {
  @IsOptional() @IsDateString() date?: string;
  @IsString() @Matches(time) fajr!: string;
  @IsString() @Matches(time) sunrise!: string;
  @IsString() @Matches(time) dhuhr!: string;
  @IsString() @Matches(time) maghrib!: string;
  @IsString() @Matches(time) isha!: string;
  @IsOptional() @IsString() @MaxLength(160) source?: string;
}

export class SaveSchoolAnnouncementDto {
  @IsString() @MaxLength(180) title!: string;
  @IsString() @MaxLength(4000) body!: string;
  @IsIn(["STAFF", "STUDENTS", "CLASS"]) audience!:
    "STAFF" | "STUDENTS" | "CLASS";
  @IsOptional() @IsString() classroomId?: string;
  @IsOptional() @IsIn(["DRAFT", "ACTIVE", "ARCHIVED"]) status?:
    "DRAFT" | "ACTIVE" | "ARCHIVED";
  @IsOptional() @IsDateString() expiresAt?: string;
}
