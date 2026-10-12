import {
  IsBoolean,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Length,
} from "class-validator";
import type { OrganizationAuthProfile } from "@moshaver/api-contract";

// Same-origin asset paths or HTTPS images only; no script/data URLs or CSS injection.
const imageUrl =
  /^(?:$|\/(?!\/)[A-Za-z0-9/_.%-]+|https:\/\/[A-Za-z0-9.-]+(?::\d+)?(?:\/[A-Za-z0-9/_.%?=&+-]*)?)$/;
export class UpdateOrganizationAuthProfileDto implements Partial<OrganizationAuthProfile> {
  @IsOptional() @IsString() @Length(2, 180) name?: string;
  @IsOptional() @IsBoolean() published?: boolean;
  @IsOptional() @IsString() @MaxLength(180) displayName?: string;
  @IsOptional() @IsString() @MaxLength(100) brandName?: string;
  @IsOptional() @IsString() @MaxLength(1000) description?: string;
  @IsOptional() @IsString() @MaxLength(500) address?: string;
  @IsOptional()
  @IsString()
  @MaxLength(40)
  @Matches(/^[0-9۰-۹٠-٩+()\s-]*$/)
  phone?: string;
  @IsOptional() @IsString() @MaxLength(180) location?: string;
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Matches(imageUrl)
  logoUrl?: string;
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  @Matches(imageUrl)
  backgroundUrl?: string;
  @IsOptional() @IsString() @MaxLength(180) loginTitle?: string;
  @IsOptional() @IsString() @MaxLength(180) signupTitle?: string;
  @IsOptional() @IsString() @MaxLength(180) signupLabel?: string;
  @IsOptional() @IsString() @MaxLength(1000) securityNotice?: string;
}
