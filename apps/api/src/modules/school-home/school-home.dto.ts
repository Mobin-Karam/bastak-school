import {
  IsDateString,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  ValidateIf,
} from "class-validator";

const time = /^([01]\d|2[0-3]):[0-5]\d$/;

export class SavePrayerTimeDto {
  /** An empty date is the organisation-wide default; ISO dates are overrides. */
  @IsOptional()
  @ValidateIf((_dto, value) => value !== "")
  @IsDateString()
  date?: string;
  @IsString() @Matches(time) fajr!: string;
  @IsString() @Matches(time) sunrise!: string;
  @IsString() @Matches(time) dhuhr!: string;
  @IsString() @Matches(time) asr!: string;
  @IsString() @Matches(time) maghrib!: string;
  @IsString() @Matches(time) isha!: string;
  @IsOptional() @IsString() @MaxLength(160) source?: string;
}

export class SaveSchoolAnnouncementDto {
  @IsString() @MaxLength(180) title!: string;
  @IsString() @MaxLength(4000) body!: string;
  @IsIn(["STAFF", "STUDENTS", "CLASS", "USERS"]) audience!:
    "STAFF" | "STUDENTS" | "CLASS" | "USERS";
  @IsOptional() @IsString() classroomId?: string;
  @IsOptional() @IsString({ each: true }) recipientIds?: string[];
  @IsOptional() @IsString() @MaxLength(48) category?: string;
  @IsOptional() @IsString() @MaxLength(2048) linkUrl?: string;
  @IsOptional() @IsString() @MaxLength(2048) mediaUrl?: string;
  @IsOptional() @IsIn(["VIDEO", "AUDIO"]) mediaType?: "VIDEO" | "AUDIO";
  @IsOptional() @IsIn(["DRAFT", "ACTIVE", "ARCHIVED"]) status?:
    "DRAFT" | "ACTIVE" | "ARCHIVED";
}
