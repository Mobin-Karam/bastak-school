import { describe, expect, it } from "vitest";
import { guardianCopy } from "./guardian-copy";

describe("guardianCopy", () => {
  it("provides complete English copy for the guardian operational flow", () => {
    const copy = guardianCopy.en;

    expect(copy.title).toBe("Follow a child’s plan and progress");
    expect(copy.selectStudent).toBe("Select child");
    expect(copy.dailyReports(2)).toBe("2 daily reports available.");
    expect(copy.encouragementSent).toMatch(/sent/i);
  });

  it("keeps Persian number presentation in the Persian copy", () => {
    expect(guardianCopy.fa.dailyReports(2)).toContain("۲");
    expect(guardianCopy.fa.percent).toBe("٪");
  });
});
