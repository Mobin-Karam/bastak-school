import { IsEmail, IsOptional, IsString, Length } from "class-validator";

/** Fields a learner can correct without changing school-controlled identity or placement. */
export class UpdateOwnStudentProfileDto {
  @IsOptional()
  @IsString()
  @Length(1, 100)
  firstName?: string;

  @IsOptional()
  @IsString()
  @Length(1, 100)
  lastName?: string;

  @IsOptional()
  @IsEmail()
  @Length(3, 254)
  email?: string;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  targetUniversity?: string;

  @IsOptional()
  @IsString()
  @Length(0, 160)
  targetField?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  targetRank?: string;

  @IsOptional()
  @IsString()
  @Length(0, 40)
  dailyCapacity?: string;
}
