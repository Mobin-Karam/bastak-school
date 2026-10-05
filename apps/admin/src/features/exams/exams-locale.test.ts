import { describe, expect, it } from "vitest";
import { examsCopy } from "./exams-locale";

describe("exams locale adapter", () => {
  it("provides English copy for page modal and analytics feedback", () => {
    const copy = examsCopy("en");

    expect(copy.editExam).toBe("Edit exam");
    expect(copy.assignmentTitle("Midterm")).toBe("Assign exam: Midterm");
    expect(copy.analyticsTitle("Midterm")).toBe("Exam analysis: Midterm");
    expect(copy.analyticsAttempts(2, 75)).toContain("2 attempts");
    expect(copy.responseBreakdown(1, 2, 3, 4, 5)).toContain("Blank: 5");
  });
});
