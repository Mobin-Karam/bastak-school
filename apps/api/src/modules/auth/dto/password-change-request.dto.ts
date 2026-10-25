import {
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from "class-validator";

export class CreatePasswordChangeRequestDto {
  @IsString() @MinLength(1) @MaxLength(300) currentPassword!: string;
  @IsString()
  @MinLength(12)
  @MaxLength(300)
  @Matches(/^[\x21-\x7E]+$/, {
    message: "رمز جدید فقط باید از نویسه‌های انگلیسی تشکیل شود.",
  })
  newPassword!: string;
  @IsString() @MinLength(1) @MaxLength(64) organizationId!: string;
  @IsOptional() @IsString() @MaxLength(500) reason?: string;
}
