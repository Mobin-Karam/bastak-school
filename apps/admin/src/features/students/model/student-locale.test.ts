import { describe, expect, it } from "vitest";
import { studentCopy } from "./student-locale";

describe("student page locale copy", () => {
  it("provides English copy for confirmations, feedback, activity metrics, and empty record states", () => {
    const copy = studentCopy.en;

    expect(copy.discardChangesTitle).toBe("Discard unsaved changes?");
    expect(copy.archiveStudentTitle).toBe("Archive student?");
    expect(copy.reviewSyncHealth).toBe("Record sync-health review");
    expect(copy.pendingSync).toBe("Pending synchronization");
    expect(copy.preparingRecords).toBe("Preparing student records...");
    expect(copy.selectStudentTitle).toBe("Select a student");
    expect(copy.usernameInUse.replace("{name}", "Avery")).toBe(
      "This username is already used by “Avery”.",
    );
  });
});
