import { IsArray, IsIn, IsInt, IsOptional, IsString, IsUUID, MaxLength, Min } from "class-validator";

const states = ["DRAFT", "PUBLISHED", "ARCHIVED"] as const;

export class SaveEducationBookDto {
  @IsString() @MaxLength(120) id!: string;
  @IsString() @MaxLength(12) country!: string;
  @IsString() @MaxLength(16) schoolYear!: string;
  @IsInt() @Min(1) grade!: number;
  @IsString() @MaxLength(80) level!: string;
  @IsString() @MaxLength(120) branch!: string;
  @IsString() @MaxLength(160) track!: string;
  @IsString() @MaxLength(160) category!: string;
  @IsString() @MaxLength(240) titleFa!: string;
  @IsOptional() @IsString() @MaxLength(240) titleEn?: string;
  @IsOptional() @IsString() @MaxLength(80) textbookCode?: string;
  @IsArray() @IsString({ each: true }) appliesTo!: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsIn(states) state?: (typeof states)[number];
  @IsOptional() @IsUUID() organizationId?: string | null;
}

export class UpdateEducationBookDto {
  @IsOptional() @IsString() @MaxLength(12) country?: string;
  @IsOptional() @IsString() @MaxLength(16) schoolYear?: string;
  @IsOptional() @IsInt() @Min(1) grade?: number;
  @IsOptional() @IsString() @MaxLength(80) level?: string;
  @IsOptional() @IsString() @MaxLength(120) branch?: string;
  @IsOptional() @IsString() @MaxLength(160) track?: string;
  @IsOptional() @IsString() @MaxLength(160) category?: string;
  @IsOptional() @IsString() @MaxLength(240) titleFa?: string;
  @IsOptional() @IsString() @MaxLength(240) titleEn?: string;
  @IsOptional() @IsString() @MaxLength(80) textbookCode?: string;
  @IsOptional() @IsArray() @IsString({ each: true }) appliesTo?: string[];
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsIn(states) state?: (typeof states)[number];
  @IsOptional() @IsUUID() organizationId?: string | null;
}

export class ImportEducationBooksDto {
  @IsArray() books!: SaveEducationBookDto[];
}
