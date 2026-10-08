import { OrganizationType } from "../src/database/entities/organization.entity";
import {
  assertPlatformRolesAreUnscoped,
  assertRoleCodesCompatibleWithOrganization,
  roleCodesForOrganizationType,
} from "../src/modules/organizations/organization-role-policy";

function expectPolicyCode(action: () => void, code: string) {
  try {
    action();
    throw new Error(
      "Expected organization role policy to reject the assignment.",
    );
  } catch (error) {
    expect(
      (
        error as { getResponse?: () => { error?: { code?: string } } }
      ).getResponse?.(),
    ).toMatchObject({ error: { code } });
  }
}

describe("organization role policy", () => {
  it("keeps school-only roles out of institution and organization tenants", () => {
    expect(roleCodesForOrganizationType(OrganizationType.SCHOOL)).toContain(
      "PRINCIPAL",
    );
    expect(
      roleCodesForOrganizationType(OrganizationType.INSTITUTION),
    ).not.toContain("PRINCIPAL");
    expect(
      roleCodesForOrganizationType(OrganizationType.ORGANIZATION),
    ).not.toContain("SCHOOL_SUPERVISOR");
  });

  it("rejects a school-only role in a non-school organization", () => {
    expectPolicyCode(
      () =>
        assertRoleCodesCompatibleWithOrganization(
          OrganizationType.INSTITUTION,
          ["PRINCIPAL"],
        ),
      "ROLE_ORGANIZATION_TYPE_MISMATCH",
    );
  });

  it("allows school roles in school organizations and keeps platform roles global", () => {
    expect(() =>
      assertRoleCodesCompatibleWithOrganization(OrganizationType.SCHOOL, [
        "PRINCIPAL",
        "STUDENT",
      ]),
    ).not.toThrow();
    expectPolicyCode(
      () => assertPlatformRolesAreUnscoped(["PLATFORM_ADMIN"], "school-1"),
      "PLATFORM_ROLE_MUST_BE_UNSCOPED",
    );
  });
});
