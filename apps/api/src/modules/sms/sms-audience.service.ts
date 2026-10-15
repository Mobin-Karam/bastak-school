import { Injectable } from "@nestjs/common";
import { DataSource } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import { MembershipStatus } from "../../database/entities/organization-membership.entity";
import { UserStatus } from "../../database/entities/user.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { isIranianMobile, normalizeIranianMobile } from "../../common/utils/phone-number";
import { AuthorizationService, UserContext } from "../authorization";
import { assertSmsManagementAuthority } from "./sms-access";

export type AudienceCriteria = { organizationId?: string; roleCodes?: string[]; userIds?: string[]; includeAll?: boolean };
export type AudienceUser = { userId: string; mobile: string; displayName: string; roles: string[]; organizationId: string | null; organization: string | null };
const mask = (phone: string) => `${phone.slice(0, 4)}•••${phone.slice(-4)}`;

@Injectable()
export class SmsAudienceService {
  constructor(private readonly db: DataSource, private readonly authorization: AuthorizationService) {}
  async resolve(context: UserContext, input: AudienceCriteria): Promise<AudienceUser[]> {
    assertSmsManagementAuthority(context);
    const organizationId = input.organizationId || context.activeOrganizationId;
    if (organizationId && !this.authorization.canAccessOrganization(context, organizationId, "sms.read")) throw new ApiException(403, "ORGANIZATION_FORBIDDEN", "به این سازمان دسترسی ندارید.");
    if (!organizationId && !context.roles.includes("PLATFORM_ADMIN")) throw new ApiException(400, "ORGANIZATION_REQUIRED", "سازمان فعال را انتخاب کنید.");
    const roleCodes = [...new Set((input.roleCodes || []).map((x) => String(x).trim()).filter(Boolean))];
    const userIds = [...new Set((input.userIds || []).map(String).filter(Boolean))];
    if (!input.includeAll && !roleCodes.length && !userIds.length) throw new ApiException(400, "SMS_AUDIENCE_REQUIRED", "حداقل یک مخاطب یا فیلتر انتخاب کنید.");
    const assignments = await this.db.getRepository(UserRoleAssignment).createQueryBuilder("assignment")
      .innerJoinAndSelect("assignment.user", "user")
      .innerJoinAndSelect("assignment.role", "role")
      .leftJoinAndSelect("assignment.membership", "membership")
      .leftJoinAndSelect("membership.organization", "organization")
      .where("user.status = :active", { active: UserStatus.ACTIVE })
      .andWhere("user.phoneNumber IS NOT NULL")
      .andWhere(organizationId ? "organization.id = :organizationId AND membership.status = :membershipStatus" : "(role.organizationScoped = 0 OR membership.status = :membershipStatus)", { organizationId, membershipStatus: MembershipStatus.ACTIVE })
      .andWhere(
        input.includeAll ? "1=1" : roleCodes.length && userIds.length ? "(role.code IN (:...roleCodes) OR user.id IN (:...userIds))" : roleCodes.length ? "role.code IN (:...roleCodes)" : "user.id IN (:...userIds)",
        { roleCodes: roleCodes.length ? roleCodes : ["_"], userIds: userIds.length ? userIds : ["_"] },
      )
      .getMany();
    const selected = new Set(userIds);
    const byUser = new Map<string, AudienceUser>();
    for (const assignment of assignments) {
      const explicitlySelected = selected.has(assignment.user.id);
      if (!input.includeAll && !roleCodes.length && !explicitlySelected) continue;
      const mobile = normalizeIranianMobile(assignment.user.phoneNumber || ""); if (!isIranianMobile(mobile)) continue;
      const current = byUser.get(assignment.user.id) || { userId: assignment.user.id, mobile, displayName: `${assignment.user.firstName} ${assignment.user.lastName}`.trim() || assignment.user.username, roles: [], organizationId: assignment.membership?.organization?.id || null, organization: assignment.membership?.organization?.name || null };
      if (!current.roles.includes(assignment.role.code)) current.roles.push(assignment.role.code);
      byUser.set(assignment.user.id, current);
    }
    if (userIds.length && [...selected].some((id) => !byUser.has(id))) throw new ApiException(403, "SMS_AUDIENCE_FORBIDDEN", "یک یا چند مخاطب انتخاب‌شده در محدوده دسترسی شما نیستند.");
    return [...byUser.values()].filter((candidate, index, values) => values.findIndex((item) => item.mobile === candidate.mobile) === index);
  }
  async preview(context: UserContext, criteria: AudienceCriteria) {
    const users = await this.resolve(context, criteria);
    const counts = new Map<string, number>(); users.forEach((user) => user.roles.forEach((role) => counts.set(role, (counts.get(role) || 0) + 1)));
    return { total: users.length, roles: [...counts].map(([role, count]) => ({ role, count })), users: users.map(({ mobile, ...user }) => ({ ...user, maskedPhoneNumber: mask(mobile) })) };
  }
}
