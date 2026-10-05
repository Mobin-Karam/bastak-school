import { describe, expect, it } from "vitest";
import { accessFlowGuidance, emptyAccessResult } from "./access-flow";
import { accessCopy } from "./access-copy";

describe("access flow guidance", () => {
  it("explains the read-only boundary without implying authorization", () => {
    expect(accessFlowGuidance("users", false)).toMatchObject({
      title: "دسترسی مشاهده کاربران",
      description: expect.stringContaining("مجوز مدیریت کاربران"),
    });
  });

  it("gives a recovery path when a filtered collection is empty", () => {
    expect(emptyAccessResult("organizations", true)).toContain("جستجو را پاک");
  });

  it("keeps the destructive impact visible to organization managers", () => {
    expect(accessFlowGuidance("organizations", true).description).toContain("دسترسی اعضا را متوقف");
  });

  it("uses English copy for the international workspace", () => {
    expect(accessFlowGuidance("users", true, "en").title).toBe("Manage accounts and access");
    expect(emptyAccessResult("organizations", true, "en")).toContain("Clear the search");
  });

  it("keeps access confirmations and form labels in the active language", () => {
    expect(accessCopy.en.disableSelectedAccountsTitle).toBe("Disable selected accounts?");
    expect(accessCopy.en.relatedUser).toBe("Related user");
    expect(accessCopy.en.deactivateOrganizationDescription("North Campus")).toContain(
      "North Campus",
    );
    expect(accessCopy.en.relationTypeLabel("GUARDIAN_OF")).toBe("Guardian");
  });
});
