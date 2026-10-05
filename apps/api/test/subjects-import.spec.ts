import { SubjectsService } from "../src/modules/subjects/subjects.service";

describe("subject import workflow", () => {
  function service(existing: unknown = null) {
    const subjects = {
      findOne: jest.fn().mockResolvedValue(existing),
      create: jest.fn((value) => value),
      save: jest.fn(async (value) => ({ id: `subject-${value.code}`, ...value })),
    };
    const authorization = {
      requireCapability: jest.fn(),
      canAccessOrganization: jest.fn().mockReturnValue(true),
    };
    return {
      subjects,
      instance: new SubjectsService(
        subjects as any, {} as any, {} as any, {} as any, {} as any,
        {} as any, {} as any, {} as any, authorization as any,
      ),
    };
  }

  const actor = { id: "content-1", role: "CONTENT_MANAGER", roles: ["CONTENT_MANAGER"], capabilities: ["subjects.create"] } as any;

  it("rejects duplicate codes in an import before any subject is created", async () => {
    const { instance, subjects } = service();
    const preview = await instance.previewImport(actor, [
      { code: "math", name: "ریاضی", category: "علوم پایه" },
      { code: "MATH", name: "ریاضی تکمیلی", category: "علوم پایه" },
    ]);

    expect(preview).toMatchObject({ valid: false, accepted: 1, rejected: 1 });
    expect(preview.rows[1].errors).toContain("کلید درس در همین فایل تکراری است");
    await expect(instance.commitImport(actor, [
      { code: "math", name: "ریاضی" },
      { code: "MATH", name: "ریاضی تکمیلی" },
    ])).rejects.toMatchObject({ response: { error: { code: "SUBJECT_IMPORT_INVALID" } } });
    expect(subjects.save).not.toHaveBeenCalled();
  });

  it("returns a portable import sample and refuses codes already in the same scope", async () => {
    const { instance } = service({ id: "existing" });
    expect(instance.importSample()).toMatchObject({ schemaVersion: "1.0", subjects: expect.any(Array) });
    await expect(instance.previewImport(actor, [{ code: "math", name: "ریاضی" }])).resolves.toMatchObject({ valid: false, rejected: 1 });
  });
});
