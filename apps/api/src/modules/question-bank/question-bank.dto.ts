import { IsArray, IsInt, IsOptional, IsString, IsUUID, Min } from "class-validator";

export class GenerateExamFromBankDto {
  @IsUUID() examId!: string;
  @IsOptional() @IsString() subject?: string;
  @IsOptional() @IsString() topic?: string;
  @IsOptional() @IsString() grade?: string;
  @IsOptional() @IsString() chapter?: string;
  @IsOptional() @IsInt() @Min(0) easy?: number;
  @IsOptional() @IsInt() @Min(0) medium?: number;
  @IsOptional() @IsInt() @Min(0) hard?: number;
  @IsOptional() @IsArray() @IsUUID("4", { each: true }) itemIds?: string[];
  @IsOptional() commit?: boolean;
}
