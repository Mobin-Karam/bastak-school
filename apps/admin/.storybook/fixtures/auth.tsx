import type { ReactNode } from "react";

import { AuthContext } from "../../src/features/identity/auth/context";
import type { AuthState } from "../../src/features/identity/auth/model/auth.types";
import type { AccountContext, OrganizationSummary, RoleCode, User } from "../../src/shared/types/domain";

export const storybookOrganization: OrganizationSummary = {
  id: "storybook-bastak",
  membershipId: "storybook-membership",
  name: "مدرسه دینی سلطان العلماء بستک",
  type: "SCHOOL",
};

export const storybookCapabilities = [
  "students.read",
  "students.update",
  "attendance.manage",
  "attendance.review",
  "attendance.class.read",
  "attendance.class.manage",
] as const;

export function StorybookAuthProvider({
  children,
  role = "SCHOOL_ADMIN",
  capabilities = storybookCapabilities,
}: {
  children: ReactNode;
  role?: RoleCode;
  capabilities?: readonly string[];
}) {
  const user: User = { id: "storybook-admin", displayName: "مدیر نمونه", role };
  const context: AccountContext = {
    user,
    roles: [role],
    capabilities: [...capabilities],
    memberships: [storybookOrganization],
    activeOrganization: storybookOrganization,
    availableOrganizations: [storybookOrganization],
  };
  const value: AuthState = {
    user,
    context,
    activeRole: role,
    capabilities: [...capabilities],
    status: "authenticated",
    message: "",
    can: (capability) => capabilities.includes(capability),
    canAny: (requested) => requested.some((capability) => capabilities.includes(capability)),
    canAll: (requested) => requested.every((capability) => capabilities.includes(capability)),
    hasRole: (requestedRole) => requestedRole === role,
    login: async () => undefined,
    logout: async () => undefined,
    restore: async () => undefined,
    stopRestore: () => undefined,
    setActiveRole: async () => undefined,
    setActiveOrganization: async () => undefined,
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
