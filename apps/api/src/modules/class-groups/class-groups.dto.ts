import { IsArray, IsInt, IsOptional, IsString, IsUUID, Max, MaxLength, Min, MinLength } from "class-validator";

export class CreateClassGroupDto {
  @IsUUID() classId!: string;
  @IsString() @MinLength(1) @MaxLength(80) code!: string;
  @IsString() @MinLength(1) @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}

export class SetClassGroupMembersDto {
  @IsArray() @IsUUID("4", { each: true }) studentIds!: string[];
}
