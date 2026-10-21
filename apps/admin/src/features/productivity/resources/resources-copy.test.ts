import { describe, expect, it } from "vitest";
import { resourcesCopy } from "./model/resources-copy";

describe("resourcesCopy", () => {
  it("provides the English editor, recipient, and assignment language", () => {
    const copy = resourcesCopy("en");

    expect(copy.editorDescription).toContain("student recipients");
    expect(copy.locale).toBe("en-US");
    expect(copy.recipients).toBe("Recipients");
    expect(copy.students(2)).toBe("2 students");
    expect(copy.editResourceLabel("Reading list")).toBe("Edit resource Reading list");
  });
});
