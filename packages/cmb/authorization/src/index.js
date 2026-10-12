"use strict";
const { defineModule } = require("@moshaver/cmb-kernel");
const { uniqueValues } = require("@moshaver/cmb-identity");
const { TenancyPolicy } = require("@moshaver/cmb-tenancy");
const AUTHORIZATION_MODULE = defineModule({
  id: "authorization",
  version: "0.1.0",
  kind: "platform",
  dependencies: ["identity", "kernel", "tenancy"],
  provides: ["security.authorization"],
  requires: ["identity.context", "tenancy.policy"],
});
function buildAuthorizationContext(
  base,
  assignments,
  memberships,
  options = {},
) {
  const requestedRole = options.requestedRole;
  const requestedOrganizationId = options.requestedOrganizationId;
  const effectiveAssignments = assignments.filter(
    (item) =>
      (!requestedRole || item.role === requestedRole) &&
      (!requestedOrganizationId ||
        !item.organizationScoped ||
        item.organizationId === requestedOrganizationId),
  );
  const scopedMemberships = requestedOrganizationId
    ? memberships.filter(
        (item) => item.organizationId === requestedOrganizationId,
      )
    : memberships;
  const roles = uniqueValues(effectiveAssignments.map((item) => item.role));
  return {
    ...base,
    role:
      requestedRole && roles.includes(requestedRole)
        ? requestedRole
        : (roles[0] ?? ""),
    roles,
    capabilities: uniqueValues(
      effectiveAssignments.flatMap((item) => item.capabilities),
    ),
    membershipIds: scopedMemberships.map((item) => item.id),
    organizationIds: scopedMemberships.map((item) => item.organizationId),
  };
}
function hasCapability(context, capability) {
  return context.capabilities.includes(capability);
}
function canAccessOrganization(context, organizationId, capability) {
  return (
    hasCapability(context, capability) &&
    new TenancyPolicy().canAccessOrganization(context, organizationId)
  );
}
module.exports = {
  AUTHORIZATION_MODULE,
  buildAuthorizationContext,
  hasCapability,
  canAccessOrganization,
};
