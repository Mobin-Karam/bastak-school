import { ApiException } from "../../common/exceptions/api.exception";
import { UserContext } from "../authorization";

/** SMS broadcasts are an organization-owner or platform operation, never a delegated UI-only permission. */
export function assertSmsManagementAuthority(context: UserContext) {
  if (context.roles.includes("PLATFORM_ADMIN")) return;
  if (
    context.activeOrganizationId &&
    context.roles.some((role) => role === "ORGANIZATION_ADMIN" || role === "PRINCIPAL")
  )
    return;
  throw new ApiException(403, "SMS_MANAGEMENT_FORBIDDEN", "مدیریت پیامک فقط برای مدیر پلتفرم یا مالک فعال مدرسه مجاز است.");
}
