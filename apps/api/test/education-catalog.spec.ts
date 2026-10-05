import { EducationCatalogService } from "../src/modules/education-catalog/education-catalog.service";
import {
  isValidIranianNationalCode,
  normalizeNationalCode,
} from "../src/modules/onboarding/national-code";

describe("Iran education signup catalog", () => {
  const catalog = new EducationCatalogService({} as any, {} as any, {} as any, {} as any);

  it("normalizes Persian digits and validates the national checksum", () => {
    expect(normalizeNationalCode("۹۰۰۰۰۰۰۰۱۷")).toBe("9000000017");
    expect(isValidIranianNationalCode("۹۰۰۰۰۰۰۰۱۷")).toBe(true);
    expect(isValidIranianNationalCode("1111111111")).toBe(false);
    expect(isValidIranianNationalCode("9000000018")).toBe(false);
  });

  it("accepts the correct grade/type/track combinations", () => {
    expect(catalog.validateSelection(9, "general")).toEqual(
      expect.objectContaining({ gradeId: 9, trackId: "general" }),
    );
    expect(
      catalog.validateSelection(12, "theoretical", "experimental_sciences"),
    ).toEqual(
      expect.objectContaining({
        gradeLabel: "پایه دوازدهم",
        trackLabel: "علوم تجربی",
      }),
    );
    for (const selection of [
      [8, "theoretical", "experimental_sciences"],
      [11, "theoretical", "computer_network_software"],
    ] as const) {
      try {
        catalog.validateSelection(selection[0], selection[1], selection[2]);
        throw new Error("expected selection rejection");
      } catch (error) {
        expect(
          (error as { getResponse?: () => unknown }).getResponse?.(),
        ).toEqual(
          expect.objectContaining({
            error: expect.objectContaining({
              code: "INVALID_EDUCATION_SELECTION",
            }),
          }),
        );
      }
    }
  });

  it("publishes all twelve grades from the supplied taxonomy", () => {
    const options = catalog.signupOptions();
    expect(options.schoolYear).toBe("1405-1406");
    expect(options.grades.map((grade) => grade.id)).toEqual([
      1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12,
    ]);
  });

  it("does not mix vocational books into a theoretical student book list", async () => {
    const rows = [
      {
        id: "theory",
        branch: "نظری",
        track: "علوم تجربی",
        appliesTo: ["علوم تجربی"],
      },
      {
        id: "vocational",
        branch: "فنی و حرفه‌ای / کاردانش",
        track: "مشترک",
        appliesTo: ["فنی و حرفه‌ای"],
      },
      { id: "shared", branch: "مشترک", track: "مشترک", appliesTo: [] },
    ];
    const service = new EducationCatalogService(
      { find: jest.fn().mockResolvedValue(rows) } as any,
      {} as any,
      {} as any,
      {} as any,
    );
    await expect(
      service.listBooks(12, "theoretical", "experimental_sciences"),
    ).resolves.toEqual([rows[0], rows[2]]);
  });

  it("chooses books from the authenticated student's stored education profile", async () => {
    const rows = [
      {
        id: "biology",
        branch: "نظری",
        track: "علوم تجربی",
        appliesTo: ["علوم تجربی"],
      },
      {
        id: "literature",
        branch: "نظری",
        track: "مشترک",
        appliesTo: ["علوم تجربی"],
      },
      {
        id: "vocational",
        branch: "فنی و حرفه‌ای",
        track: "مکاترونیک",
        appliesTo: ["مکاترونیک"],
      },
    ];
    const service = new EducationCatalogService(
      { find: jest.fn().mockResolvedValue(rows) } as any,
      {
        findOne: jest
          .fn()
          .mockResolvedValue({
            gradeId: 12,
            educationTypeId: "theoretical",
            trackId: "experimental_sciences",
          }),
      } as any,
      {} as any,
      {} as any,
    );
    await expect(service.booksForStudentUser("user-1")).resolves.toEqual(
      expect.objectContaining({
        schoolYear: "1405-1406",
        education: expect.objectContaining({
          gradeId: 12,
          educationTypeId: "theoretical",
          trackId: "experimental_sciences",
        }),
        books: [rows[0], rows[1]],
      }),
    );
  });

  it("rejects an account whose structured education profile is incomplete", async () => {
    const service = new EducationCatalogService(
      {} as any,
      {
        findOne: jest
          .fn()
          .mockResolvedValue({ gradeId: null, educationTypeId: "general" }),
      } as any,
      {} as any,
      {} as any,
    );
    await expect(service.booksForStudentUser("user-1")).rejects.toMatchObject({
      response: { error: { code: "EDUCATION_PROFILE_INCOMPLETE" } },
    });
  });

  it("keeps drafts out of the Student projection and records catalog publication", async () => {
    const books = {
      find: jest.fn().mockResolvedValue([]),
      findOneBy: jest.fn().mockResolvedValue({ id: "draft-book", state: "DRAFT", version: 1 }),
      save: jest.fn(async (value) => value),
    };
    const audit = { create: jest.fn((value) => value), save: jest.fn(async (value) => value) };
    const service = new EducationCatalogService(books as any, {} as any, audit as any, {} as any);

    const published = await service.publishBook({ id: "admin-1" } as any, "draft-book");

    expect(published).toMatchObject({ state: "PUBLISHED", version: 2 });
    expect(audit.save).toHaveBeenCalledWith(expect.objectContaining({ action: "education.catalog_book_published" }));
    expect(books.save).toHaveBeenCalledWith(expect.objectContaining({ publishedAt: expect.any(Date) }));
  });

  it("summarizes only students in the caller's organization scope", async () => {
    const students = {
      find: jest.fn().mockResolvedValue([
        { id: "student-1", gradeId: 9, educationTypeId: "general", trackId: "general" },
      ]),
    };
    const books = {
      find: jest.fn().mockResolvedValue([{ id: "book-1", state: "PUBLISHED", grade: 9, branch: "عمومی", track: "مشترک", appliesTo: [] }]),
      countBy: jest.fn().mockResolvedValue(0),
    };
    const service = new EducationCatalogService(books as any, students as any, {} as any, { find: jest.fn().mockResolvedValue([{ user: { id: "user-1" } }]) } as any);

    const overview = await service.operationsOverview({ id: "advisor-1", role: "ADVISOR", roles: ["ADVISOR"], organizationIds: ["org-1"] } as any);

    expect(overview.students).toEqual(expect.objectContaining({ total: 1, complete: 1, incomplete: 0, missingMappings: 0 }));
    expect(students.find).toHaveBeenCalledWith(expect.objectContaining({ where: { user: { id: expect.anything() } } }));
  });

  it("prefers an organization textbook override over the global default", async () => {
    const globalBook = { id: "global", schoolYear: "1405-1406", grade: 10, textbookCode: "MATH", titleFa: "ریاضی", track: "مشترک", branch: "مشترک", appliesTo: [], state: "PUBLISHED" };
    const override = { ...globalBook, id: "org", titleFa: "ریاضی سازمان", organizationId: "org-1" };
    const service = new EducationCatalogService({ find: jest.fn().mockResolvedValue([globalBook, override]) } as any, {} as any, {} as any, {} as any);
    await expect(service.listBooks(10, "general", "general", ["org-1"])).resolves.toEqual([override]);
  });

  it("previews imports without mutation and commits valid rows as drafts", async () => {
    const books = { findOneBy: jest.fn().mockResolvedValue(null), create: jest.fn((value) => value), save: jest.fn(async (value) => value) };
    const audit = { create: jest.fn((value) => value), save: jest.fn(async (value) => value) };
    const service = new EducationCatalogService(books as any, {} as any, audit as any, {} as any);
    const row: any = { id: "import-1", country: "IR", schoolYear: "1405-1406", grade: 10, level: "second", branch: "نظری", track: "مشترک", category: "عمومی", titleFa: "کتاب ورود", titleEn: "", appliesTo: [] };
    await expect(service.previewImport({ id: "admin" } as any, [row])).resolves.toMatchObject({ valid: true, accepted: 1 });
    await expect(service.commitImport({ id: "admin" } as any, [row])).resolves.toMatchObject({ imported: 1, state: "DRAFT" });
  });

  it("calculates an affected-student preview before a catalog publication", async () => {
    const book = { id: "biology", grade: 12, branch: "نظری", track: "علوم تجربی", appliesTo: ["علوم تجربی"] };
    const books = { findOneBy: jest.fn().mockResolvedValue(book) };
    const students = { find: jest.fn().mockResolvedValue([
      { id: "student-1", name: "نگار", gradeId: 12, educationTypeId: "theoretical", trackId: "experimental_sciences", user: { id: "user-1" } },
      { id: "student-2", name: "آرین", gradeId: 12, educationTypeId: "theoretical", trackId: "mathematics_physics", user: { id: "user-2" } },
    ]) };
    const service = new EducationCatalogService(books as any, students as any, {} as any, { find: jest.fn().mockResolvedValue([]) } as any);
    await expect(service.bookImpact({ id: "platform", role: "PLATFORM_ADMIN", roles: ["PLATFORM_ADMIN"] } as any, book.id)).resolves.toEqual({ bookId: book.id, affectedStudents: 1, sample: [{ id: "student-1", name: "نگار", grade: 12 }] });
  });

  it("rejects incomplete or inverted outcome periods before querying data", async () => {
    await expect(catalog.operationsOverview({ id: "admin" } as any, "2026-09-30", undefined)).rejects.toMatchObject({ response: { error: { code: "EDUCATION_PERIOD_INVALID" } } });
    await expect(catalog.operationsOverview({ id: "admin" } as any, "2026-10-01", "2026-09-30")).rejects.toMatchObject({ response: { error: { code: "EDUCATION_PERIOD_INVALID" } } });
  });

  it("rejects an invalid grade cohort before querying data", async () => {
    await expect(catalog.operationsOverview({ id: "admin" } as any, undefined, undefined, 13)).rejects.toMatchObject({ response: { error: { code: "EDUCATION_COHORT_INVALID" } } });
  });
});
