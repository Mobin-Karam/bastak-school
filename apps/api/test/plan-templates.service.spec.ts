import { PlanTemplatesService } from "../src/modules/plan-templates/plan-templates.service";
const repo = (overrides: any = {}) =>
  ({
    find: jest.fn(),
    findOneByOrFail: jest.fn(),
    create: jest.fn((x) => x),
    save: jest.fn(async (x) => x),
    ...overrides,
  }) as never;
const context = {
  id: "user",
  roles: ["ADVISOR"],
  capabilities: ["plan_templates.manage"],
  organizationIds: ["org"],
  membershipIds: [],
  username: "u",
  sessionId: "s",
  role: "ADVISOR",
};
describe("PlanTemplatesService", () => {
  it("rejects an empty title after authorization", async () => {
    const auth = {
      canAccessOrganization: jest.fn().mockReturnValue(true),
    } as never;
    const service = new PlanTemplatesService(
      repo(),
      repo(),
      repo(),
      repo(),
      auth,
    );
    await expect(
      service.create(context, { organizationId: "org", title: "   " }),
    ).rejects.toMatchObject({
      response: { error: { code: "TEMPLATE_TITLE_REQUIRED" } },
    });
  });
  it("creates an organization-scoped draft", async () => {
    const templates: any = repo(),
      organizations: any = repo({
        findOneByOrFail: jest.fn().mockResolvedValue({ id: "org" }),
      });
    const service = new PlanTemplatesService(
      templates,
      organizations,
      repo(),
      repo(),
      { canAccessOrganization: jest.fn().mockReturnValue(true) } as never,
    );
    await expect(
      service.create(context, {
        organizationId: "org",
        title: " هفته مرور ",
        tags: ["ریاضی"],
      }),
    ).resolves.toMatchObject({
      title: "هفته مرور",
      state: "DRAFT",
      version: 1,
    });
  });
  it("applies a published template only to empty destination days by default", async () => {
    const template = {
      id: "template-1",
      version: 3,
      state: "PUBLISHED",
      organization: { id: "org" },
      days: [
        { offset: 0, title: "روز اول", motivationText: "شروع", tasks: [] },
      ],
    };
    const templates: any = repo({
      findOneOrFail: jest.fn().mockResolvedValue(template),
    });
    const plans: any = repo({ find: jest.fn().mockResolvedValue([]) });
    const plansService = {
      upsertPlan: jest.fn().mockResolvedValue({ id: "plan-1" }),
    };
    const auth = {
      canAccessOrganization: jest.fn().mockReturnValue(true),
      canAccessStudent: jest.fn().mockResolvedValue(true),
    } as never;
    const service = new PlanTemplatesService(
      templates,
      repo(),
      repo({
        findOneByOrFail: jest
          .fn()
          .mockResolvedValue({ id: "student-1", name: "ندا" }),
      }),
      plans,
      auth,
      plansService as never,
    );

    await expect(
      service.apply(context, "template-1", {
        targetStudentIds: ["student-1"],
        targetStartDate: "2026-10-01",
      }),
    ).resolves.toEqual(
      expect.objectContaining({
        created: [
          { studentId: "student-1", planId: "plan-1", date: "2026-10-01" },
        ],
        skipped: [],
      }),
    );
    expect(plansService.upsertPlan).toHaveBeenCalledWith(
      expect.objectContaining({
        studentId: "student-1",
        templateId: "template-1",
        templateVersion: 3,
        publish: true,
      }),
    );
  });
});
