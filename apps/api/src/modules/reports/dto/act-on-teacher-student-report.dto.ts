import { IsIn, IsOptional, IsString, MaxLength } from "class-validator";

export class ActOnTeacherStudentReportDto {
  @IsIn(["full_screen_summons", "contact_request"])
  action!: "full_screen_summons" | "contact_request";

  @IsOptional() @IsString() @MaxLength(500)
  note?: string;
}
