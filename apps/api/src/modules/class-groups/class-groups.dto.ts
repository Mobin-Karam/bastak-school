import {
  ArrayMaxSize,
  ArrayUnique,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from "class-validator";
export const MAX_CLASS_GROUP_MEMBERS = 1000;

export class UpdateClassGroupDto {
  @IsOptional() @IsString() @Matches(/\S/) @MaxLength(80) code?: string;
  @IsOptional() @IsString() @Matches(/\S/) @MaxLength(160) name?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}
export class CreateClassGroupDto {
  @IsUUID() classId!: string;
  @IsString() @Matches(/\S/) @MaxLength(80) code!: string;
  @IsString() @Matches(/\S/) @MaxLength(160) name!: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
}
export class SetClassGroupMembersDto {
  @IsArray()
  @ArrayUnique()
  @ArrayMaxSize(MAX_CLASS_GROUP_MEMBERS)
  @IsUUID("4", { each: true })
  studentIds!: string[];
}
