import { IsOptional, IsString, Matches, MaxLength } from "class-validator";

export class ChangeOwnPhoneNumberDto {
  @IsString() @Matches(/^09\d{9}$/) phoneNumber!: string;
}

export class CreatePhoneNumberChangeRequestDto extends ChangeOwnPhoneNumberDto {
  @IsString() organizationId!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}

export class ReviewPhoneNumberChangeRequestDto {
  @IsOptional() @IsString() @MaxLength(500) reviewNote?: string;
}
