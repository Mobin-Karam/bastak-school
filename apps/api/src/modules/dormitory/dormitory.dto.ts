import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateDormRoomDto {
  @IsUUID() organizationId!: string;
  @IsString() @MinLength(1) @MaxLength(80) code!: string;
  @IsString() @MinLength(1) @MaxLength(160) name!: string;
  @IsOptional() @IsInt() @Min(1) @Max(1000) capacity?: number;
}

export class SetDormRoomAssignmentsDto {
  @IsArray() @IsUUID("4", { each: true }) studentIds!: string[];
}
