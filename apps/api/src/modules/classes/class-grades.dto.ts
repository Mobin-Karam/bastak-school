import {
  IsNumber,
  IsString,
  IsUUID,
  Matches,
  IsOptional,
  MinLength,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class CreateClassBookGradeSessionDto {
  @IsString() @MinLength(2) @MaxLength(160) title!: string;
  @Matches(/^\d{4}-\d{2}-\d{2}$/) heldOn!: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class UpdateClassBookGradeSessionDto {
  @IsOptional() @IsString() @MinLength(2) @MaxLength(160) title?: string;
  @IsOptional() @Matches(/^\d{4}-\d{2}-\d{2}$/) heldOn?: string;
  @IsOptional() @IsString() @MaxLength(500) description?: string;
}

export class SaveClassBookGradeDto {
  @IsUUID() studentId!: string;
  @IsNumber({ maxDecimalPlaces: 2 }) @Min(0) @Max(20) score!: number;
  @IsString() @MaxLength(500) note!: string;
}
