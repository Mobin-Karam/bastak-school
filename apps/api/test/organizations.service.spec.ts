import { OrganizationsService } from "../src/modules/organizations/organizations.service";
import { OrganizationStatus } from "../src/database/entities/organization.entity";

const platform = {
  id: "platform-admin",
  username: "platform",
  role: "PLATFORM_ADMIN",
  roles: ["PLATFORM_ADMIN"],
  sessionId: "session",
};
const organizationAdmin = {
  id: "organization-admin",
  username: "organization",
  role: "ORGANIZATION_ADMIN",
  roles: ["ORGANIZATION_ADMIN"],
  organizationIds: ["org-1"],
  sessionId: "session",
};

describe("OrganizationsService organization activation", () => {
  const serviceFor = (
    organization: { id: string; status: OrganizationStatus; disabledFeatures?: string[] } = {
      id: "org-1",
      status: OrganizationStatus.ACTIVE,
    },
  ) => {
    const orgs = {
      findOne: jest.fn().mockResolvedValue(organization),
      save: jest.fn().mockResolvedValue(organization),
    };
    const service = new OrganizationsService(
      orgs as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      { transaction: jest.fn() } as never,
    );
    return { service, orgs, organization };
  };

  it("allows only a platform admin to disable an organization", async () => {
    const { service, orgs, organization } = serviceFor();

    await expect(service.setEnabled(platform, "org-1", false)).resolves.toBe(organization);
    expect(organization.status).toBe(OrganizationStatus.INACTIVE);
    expect(orgs.save).toHaveBeenCalledWith(organization);

    await expect(service.setEnabled(organizationAdmin, "org-1", true)).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });

  it("does not reactivate an archived organization through the feature toggle", async () => {
    const { service } = serviceFor({ id: "org-1", status: OrganizationStatus.ARCHIVED });

    await expect(service.setEnabled(platform, "org-1", true)).rejects.toMatchObject({
      response: { error: { code: "ORGANIZATION_ARCHIVED" } },
    });
  });

  it("stores disabled modules from the platform-admin feature selection", async () => {
    const { service, organization } = serviceFor({
      id: "org-1",
      status: OrganizationStatus.ACTIVE,
      disabledFeatures: [],
    });

    await expect(service.setFeatures(platform, "org-1", ["PLANNER", "CHAT"])).resolves.toBe(
      organization,
    );
    expect(organization.disabledFeatures).toEqual(
      expect.arrayContaining(["LEARNING", "EXAMS"]),
    );
    expect(organization.disabledFeatures).not.toContain("PLANNER");
    await expect(service.setFeatures(organizationAdmin, "org-1", ["PLANNER"])).rejects.toMatchObject({
      response: { error: { code: "FORBIDDEN" } },
    });
  });
});
