import { IsString, Matches, MaxLength, MinLength } from "class-validator";

export class ChangePasswordDto {
  @IsString()
  @MinLength(1)
  @MaxLength(300)
  currentPassword!: string;

  @IsString()
  @MinLength(12)
  @MaxLength(300)
  @Matches(/^[\x21-\x7E]+$/, {
    message: "رمز جدید فقط باید از نویسه‌های انگلیسی تشکیل شود.",
  })
  newPassword!: string;
}
