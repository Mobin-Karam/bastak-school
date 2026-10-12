import { Injectable } from "@nestjs/common";
import {
  buildAuthorizationContext,
  canAccessOrganization,
  hasCapability,
} from "@moshaver/cmb-authorization";
import { InjectRepository } from "@nestjs/typeorm";
import { In, IsNull, Repository } from "typeorm";
import { ApiException } from "../../common/exceptions/api.exception";
import {
  OrganizationMembership,
  MembershipStatus,
} from "../../database/entities/organization-membership.entity";
import {
  RelationshipStatus,
  UserRelationship,
} from "../../database/entities/user-relationship.entity";
import { UserRoleAssignment } from "../../database/entities/user-role-assignment.entity";
import { Student } from "../../database/entities/student.entity";
import { Permission } from "../../database/entities/permission.entity";
import { UserCapabilityGrant } from "../../database/entities/user-capability-grant.entity";
import { OrganizationStatus } from "../../database/entities/organization.entity";
import { isCapabilityEnabledForOrganization } from "../organizations";

import { relationshipTypesForRoles } from "./relationship-policy";

export type UserContext = {
  id: string;
  username: string;
  sessionId: string;
  role: string;
  roles: string[];
  capabilities: string[];
  membershipIds: string[];
  organizationIds: string[];
  activeOrganizationId?: string;
};

@Injectable()
export class AuthorizationService {
  constructor(
    @InjectRepository(UserRoleAssignment)
    private readonly assignments: Repository<UserRoleAssignment>,
    @InjectRepository(OrganizationMembership)
    private readonly memberships: Repository<OrganizationMembership>,
    @InjectRepository(UserRelationship)
    private readonly relationships: Repository<UserRelationship>,
    @InjectRepository(Student)
    private readonly students: Repository<Student>,
    @InjectRepository(Permission)
    private readonly permissions?: Repository<Permission>,
    @InjectRepository(UserCapabilityGrant)
    private readonly grants?: Repository<UserCapabilityGrant>,
  ) {}

  async enrich(
    base: {
      id: string;
      username: string;
      sessionId: string;
      role: string;
    },
    requestedRole?: string,
    requestedOrganizationId?: string,
  ): Promise<UserContext> {
    const [assignments, memberships] = await Promise.all([
      this.assignments.find({
        where: { user: { id: base.id } },
        relations: {
          role: { permissions: { permission: true } },
          membership: { organization: true },
        },
      }),
      this.memberships.find({
        where: {
          user: { id: base.id },
          status: MembershipStatus.ACTIVE,
          organization: { status: OrganizationStatus.ACTIVE },
        },
        relations: { organization: true },
        order: { joinedAt: "ASC", id: "ASC" },
      }),
    ]);
    const activeMembershipIds = new Set(
      memberships.map((membership) => membership.id),
    );
    const student = assignments.some((item) => item.role.code === "STUDENT")
      ? await this.students.findOne({
          where: { user: { id: base.id } },
          relations: { organization: true },
        })
      : null;
    const activeAssignments = assignments
      .filter(
        (item) =>
          item.role.code !== "STUDENT" ||
          (student?.accountStatus === "active" &&
            (!student.organization ||
              student.organization.id === item.membership?.organization.id)),
      )
      .filter(
        (assignment) =>
          !assignment.role.organizationScoped ||
          Boolean(
            assignment.membership?.id &&
            activeMembershipIds.has(assignment.membership.id),
          ),
      );
    const allRoles = [
      ...new Set(activeAssignments.map((item) => item.role.code)),
    ];
    if (
      requestedOrganizationId &&
      !memberships.some(
        (item) => item.organization.id === requestedOrganizationId,
      ) &&
      !allRoles.includes("PLATFORM_ADMIN")
    )
      throw new ApiException(
        403,
        "ORGANIZATION_FORBIDDEN",
        "به این سازمان دسترسی ندارید.",
      );
    // Missing headers must never combine tenant authority. Use the same first
    // membership fallback as /me/context; platform assignments remain global.
    requestedOrganizationId ??= allRoles.includes("PLATFORM_ADMIN")
      ? undefined
      : memberships.find((membership) =>
          activeAssignments.some(
            (item) => item.membership?.id === membership.id,
          ),
        )?.organization.id;
    const eligibleAssignments = activeAssignments.filter(
      (item) =>
        !item.role.organizationScoped ||
        item.membership?.organization.id === requestedOrganizationId,
    );
    if (
      requestedRole &&
      !eligibleAssignments.some((item) => item.role.code === requestedRole)
    )
      throw new ApiException(
        403,
        "WORK_CONTEXT_FORBIDDEN",
        "زمینه کاری انتخاب‌شده در این سازمان در دسترس نیست.",
      );
    const featureOrganization = memberships.find(
      (membership) => membership.organization.id === requestedOrganizationId,
    );
    // Requests normally carry the active organization header. Without one, use
    // the restrictive union so a multi-organization account cannot bypass an
    // entitlement simply by omitting its work context.
    const disabledFeatures = allRoles.includes("PLATFORM_ADMIN")
      ? []
      : featureOrganization
        ? (featureOrganization.organization.disabledFeatures ?? [])
        : memberships.flatMap(
            (membership) => membership.organization.disabledFeatures ?? [],
          );
    const context = buildAuthorizationContext(
      base,
      eligibleAssignments.map((item) => ({
        role: item.role.code,
        organizationScoped: item.role.organizationScoped,
        organizationId: item.membership?.organization?.id,
        capabilities: item.role.permissions
          .map((rp) => rp.permission.code)
          .filter((capability) =>
            isCapabilityEnabledForOrganization(capability, disabledFeatures),
          ),
      })),
      memberships.map((item) => ({
        id: item.id,
        organizationId: item.organization.id,
      })),
      { requestedRole, requestedOrganizationId },
    );
    // Unscoped platform roles remain valid while a school is selected.
    // but their permissions remain valid while a school is selected. Keep the
    // host adapter compatible with an already-installed 0.1.x authorization
    // package that filtered those roles too aggressively; the set merge is a
    // no-op with the corrected package implementation.
    const unscopedCapabilities = eligibleAssignments
      .filter(
        (item) =>
          !item.role.organizationScoped &&
          (!requestedRole || item.role.code === requestedRole),
      )
      .flatMap((item) => item.role.permissions.map((rp) => rp.permission.code))
      .filter((capability) =>
        isCapabilityEnabledForOrganization(capability, disabledFeatures),
      );
    const effectiveCapabilities = [
      ...new Set([...context.capabilities, ...unscopedCapabilities]),
    ].sort();
    const grantCapabilities = this.grants
      ? (
          await this.grants.find({
            where: {
              user: { id: base.id },
              organization: {
                id: In(memberships.map((item) => item.organization.id)),
              },
            },
            relations: { organization: true },
          })
        )
          .filter(
            (grant) =>
              !requestedOrganizationId ||
              grant.organization.id === requestedOrganizationId,
          )
          .filter((grant) =>
            isCapabilityEnabledForOrganization(
              grant.capability,
              disabledFeatures,
            ),
          )
          .map((grant) => grant.capability)
      : [];
    if (!context.roles.includes("PLATFORM_ADMIN") || !this.permissions)
      return {
        ...context,
        activeOrganizationId: requestedOrganizationId,
        capabilities: [
          ...new Set([...effectiveCapabilities, ...grantCapabilities]),
        ].sort(),
      };
    const permissions = await this.permissions.find({ select: { code: true } });
    return {
      ...context,
      activeOrganizationId: requestedOrganizationId,
      capabilities: [
        ...new Set([
          ...effectiveCapabilities,
          ...grantCapabilities,
          ...permissions.map((item) => item.code),
        ]),
      ].sort(),
    };
  }

  hasCapability(context: UserContext, capability: string) {
    return hasCapability(context, capability);
  }
  requireCapability(context: UserContext, capability: string) {
    if (!this.hasCapability(context, capability))
      throw new ApiException(403, "FORBIDDEN", "دسترسی کافی ندارید.");
  }
  canAccessOrganization(
    context: UserContext,
    organizationId: string,
    capability: string,
  ) {
    return canAccessOrganization(context, organizationId, capability);
  }

  async canAccessStudent(
    context: UserContext,
    studentId: string,
    capability: string,
  ) {
    if (!this.hasCapability(context, capability)) return false;
    if (context.roles.includes("PLATFORM_ADMIN")) return true;
    const student = await this.students.findOne({
      where: { id: studentId },
      relations: { user: true, organization: true },
    });
    if (!student) return false;
    if (student.user?.id === context.id) return true;
    if (
      [
        "ORGANIZATION_ADMIN",
        "PRINCIPAL",
        "SCHOOL_SUPERVISOR",
        "DISCIPLINARIAN",
        "RELIGIOUS_EDUCATION_MANAGER",
        "GOVERNMENT_EDUCATION_MANAGER",
      ].some((role) => context.roles.includes(role))
    ) {
      if (
        student.organization?.id &&
        context.organizationIds.includes(student.organization.id)
      )
        return true;
      if (student.organization || !student.user?.id) return false;
      const sharedMembership = await this.memberships.findOne({
        where: {
          user: { id: student.user.id },
          organization: { id: In(context.organizationIds) },
          status: MembershipStatus.ACTIVE,
        },
      });
      if (sharedMembership) return true;
    }
    const relationshipTypes = relationshipTypesForRoles(context.roles);
    if (!relationshipTypes.length) return false;
    if (
      student.organization &&
      !context.organizationIds.includes(student.organization.id)
    )
      return false;
    const relation = await this.relationships.findOne({
      where: {
        fromUser: { id: context.id },
        toStudent: { id: studentId },
        status: RelationshipStatus.ACTIVE,
        type: In(relationshipTypes),
        organization: student.organization
          ? { id: student.organization.id }
          : context.organizationIds.length
            ? { id: In(context.organizationIds) }
            : IsNull(),
      },
      relations: { organization: true },
    });
    if (!relation) return false;
    const organizationId = relation.organization?.id;
    if (!organizationId)
      return !student.organization && !context.activeOrganizationId;
    if (!context.organizationIds.includes(organizationId)) return false;
    if (student.organization?.id === organizationId) return true;
    return Boolean(
      student.user &&
      (await this.memberships.findOne({
        where: {
          user: { id: student.user.id },
          organization: { id: organizationId },
          status: MembershipStatus.ACTIVE,
        },
      })),
    );
  }
}
