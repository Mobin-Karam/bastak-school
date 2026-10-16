import { applyDecorators, SetMetadata } from "@nestjs/common";
import { ApiExtension, ApiForbiddenResponse } from "@nestjs/swagger";
export const CAPABILITIES_KEY = "capabilities";
export const ANY_CAPABILITIES_KEY = "any-capabilities";
export const RequireCapabilities = (...capabilities: string[]) =>
  applyDecorators(
    SetMetadata(CAPABILITIES_KEY, capabilities),
    ApiExtension("x-required-capabilities", capabilities),
    ApiForbiddenResponse({
      description: `Requires capabilities: ${capabilities.join(", ")}`,
    }),
  );

/** Use only where distinct scoped authorities can safely perform the same operation. */
export const RequireAnyCapabilities = (...capabilities: string[]) =>
  applyDecorators(
    SetMetadata(ANY_CAPABILITIES_KEY, capabilities),
    ApiExtension("x-required-any-capabilities", capabilities),
    ApiForbiddenResponse({
      description: `Requires one of: ${capabilities.join(", ")}`,
    }),
  );
