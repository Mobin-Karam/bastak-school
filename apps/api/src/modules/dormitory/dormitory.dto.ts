import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength, ValidateIf } from "class-validator";

export class CreateDormRoomDto {
  @IsUUID() organizationId!: string;
  @IsString() @MinLength(1) @MaxLength(80) code!: string;
  @IsString() @MinLength(1) @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MinLength(1) @MaxLength(120) building?: string;
  @IsOptional() @IsInt() @Min(1) @Max(200) floor?: number;
  @IsOptional() @IsInt() @Min(1) @Max(14) capacity?: number;
}

export class SetDormRoomAssignmentsDto {
  @IsArray() @IsUUID("4", { each: true }) studentIds!: string[];
}

export class SendDormAnnouncementDto {
  @IsUUID() organizationId!: string;
  @IsString() @MinLength(1) @MaxLength(180) title!: string;
  @IsString() @MinLength(1) @MaxLength(4000) body!: string;
  @IsIn(["ROOM", "STUDENT"]) target!: "ROOM" | "STUDENT";
  @ValidateIf((dto) => dto.target === "ROOM") @IsUUID() roomId?: string;
  @ValidateIf((dto) => dto.target === "STUDENT") @IsUUID() studentId?: string;
}
