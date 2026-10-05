import { describe, expect, it } from "vitest";
import { emptyStudentForm, studentPayload, studentToForm } from "./student-form";

describe("student education form", () => {
  it("keeps the structured grade, education type and track from an account", () => {
    const form = studentToForm({
      id: "student-1",
      name: "مها کرام",
      gradeId: 12,
      educationTypeId: "theoretical",
      trackId: "experimental_sciences",
      grade: "پایه دوازدهم",
      major: "علوم تجربی",
    });
    expect(form).toMatchObject({
      gradeId: "12",
      educationTypeId: "theoretical",
      trackId: "experimental_sciences",
    });
  });

  it("sends structured education identifiers for server-side catalog validation", () => {
    const payload = studentPayload(
      {
        ...emptyStudentForm(),
        name: "مها کرام",
        username: "mahakaram",
        password: "secure-development-password",
        gradeId: "12",
        educationTypeId: "theoretical",
        trackId: "experimental_sciences",
      },
      true,
    );
    expect(payload).toMatchObject({
      gradeId: 12,
      educationTypeId: "theoretical",
      trackId: "experimental_sciences",
    });
  });

  it("does not invent a school grade for an independent learner", () => {
    const payload = studentPayload(
      {
        ...emptyStudentForm(),
        name: "آرمان رضایی",
        username: "arman-rezaei",
        password: "secure-development-password",
        learnerProfile: "independent",
        independentType: "adult",
        learningLevel: "زبان عمومی",
      },
      true,
    );

    expect(payload).toMatchObject({
      learnerProfile: "independent",
      independentType: "adult",
      learningLevel: "زبان عمومی",
    });
    expect(payload.gradeId).toBeUndefined();
    expect(payload.educationTypeId).toBeUndefined();
  });
});
