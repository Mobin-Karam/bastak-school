import { describe, expect, it } from "vitest";
import {
  assignmentInputFor,
  canSubmitManualAssignment,
  displayAdvisor,
  eligibleAdvisorsForOrganization,
} from "./onboarding.model";

describe("onboarding model", () => {
  it("builds assignment payloads for both onboarding modes", () => {
    const choice = { organizationId: "org-1", advisorUserId: "advisor-1" };

    expect(assignmentInputFor("AUTO", choice)).toEqual({ mode: "AUTO" });
    expect(assignmentInputFor("MANUAL", choice)).toEqual({ mode: "MANUAL", ...choice });
  });

  it("filters advisors by their active organization assignment", () => {
    const advisors = [
      {
        id: "a-1",
        username: "first",
        assignments: [{ role: "ADVISOR", organizationId: "org-1" }],
      },
      {
        id: "a-2",
        username: "second",
        assignments: [{ role: "STUDENT", organizationId: "org-1" }],
      },
    ] as never;

    expect(eligibleAdvisorsForOrganization(advisors, "org-1").map((advisor) => advisor.id)).toEqual(
      ["a-1"],
    );
  });

  it("keeps manual submission unavailable until the directory and both choices are ready", () => {
    expect(canSubmitManualAssignment({ organizationId: "", advisorUserId: "" }, false)).toBe(false);
    expect(
      canSubmitManualAssignment({ organizationId: "org", advisorUserId: "advisor" }, true),
    ).toBe(false);
    expect(
      canSubmitManualAssignment({ organizationId: "org", advisorUserId: "advisor" }, false),
    ).toBe(true);
    expect(displayAdvisor({ username: "advisor", firstName: "نام", lastName: "خانوادگی" })).toBe(
      "نام خانوادگی",
    );
  });
});
