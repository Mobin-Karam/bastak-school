"use strict";
const test = require("node:test"); const assert = require("node:assert/strict"); const { buildAuthorizationContext, canAccessOrganization } = require("../src");
const base = { id: "u1", username: "user", sessionId: "s1", role: "ADMIN" }; const assignments = [{ role: "ORGANIZATION_ADMIN", organizationScoped: true, organizationId: "o1", capabilities: ["users.read"] }, { role: "PLATFORM_ADMIN", organizationScoped: false, organizationId: null, capabilities: ["system.read"] }]; const memberships = [{ id: "m1", organizationId: "o1" }];
test("builds role and tenant scoped contexts", () => { const all = buildAuthorizationContext(base, assignments, memberships); assert.deepEqual(all.roles, ["ORGANIZATION_ADMIN", "PLATFORM_ADMIN"]); const scoped = buildAuthorizationContext(base, assignments, memberships, { requestedOrganizationId: "o1" }); assert.deepEqual(scoped.capabilities.sort(), ["system.read", "users.read"]); });
test("requires capability and scope together", () => { const context = buildAuthorizationContext(base, assignments, memberships, { requestedRole: "ORGANIZATION_ADMIN" }); assert.equal(canAccessOrganization(context, "o1", "users.read"), true); assert.equal(canAccessOrganization(context, "o2", "users.read"), false); assert.equal(canAccessOrganization(context, "o1", "users.write"), false); });
test("keeps global role capabilities when a tenant is selected", () => {
  const context = buildAuthorizationContext(
    { ...base, role: "STUDENT" },
    [{ role: "STUDENT", organizationScoped: false, capabilities: ["schedule.read", "attendance.self.read"] }],
    memberships,
    { requestedOrganizationId: "o1" },
  );
  assert.deepEqual(context.roles, ["STUDENT"]);
  assert.deepEqual(context.capabilities.sort(), ["attendance.self.read", "schedule.read"]);
  assert.deepEqual(context.organizationIds, ["o1"]);
});
