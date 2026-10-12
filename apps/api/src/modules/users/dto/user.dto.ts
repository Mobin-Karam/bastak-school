import {
  ArrayUnique,
  ArrayNotEmpty,
  IsArray,
  IsIn,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Matches,
  MinLength,
} from "class-validator";
export class CreateUserDto {
  @IsString() @Matches(/^09\d{9}$/) phoneNumber!: string;
  @IsString() @MinLength(12) password!: string;
  @IsOptional() @IsString() @Length(0, 100) firstName?: string;
  @IsOptional() @IsString() @Length(0, 100) lastName?: string;
  @IsOptional() @IsUUID() organizationId?: string;
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  roleCodes!: string[];
}
export class UpdateUserDto {
  @IsOptional() @IsString() @Matches(/^09\d{9}$/) phoneNumber?: string;
  @IsOptional() @IsString() @Length(0, 100) firstName?: string;
  @IsOptional() @IsString() @Length(0, 100) lastName?: string;
  @IsOptional() @IsString() @Length(2, 12) locale?: string;
  @IsOptional() @IsString() @Length(2, 64) timezone?: string;
}
export class SetRolesDto {
  @IsArray()
  @ArrayNotEmpty()
  @ArrayUnique()
  @IsString({ each: true })
  roleCodes!: string[];
  @IsOptional() @IsUUID() organizationId?: string;
}

export class TransferPlatformOwnershipDto {
  @IsUUID() targetUserId!: string;
}
