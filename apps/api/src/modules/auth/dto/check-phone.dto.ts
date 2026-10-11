import { IsString, MaxLength, MinLength } from "class-validator";

export class CheckPhoneDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  phoneNumber!: string;
}
