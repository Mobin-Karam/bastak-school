import "reflect-metadata";
import { validate } from "class-validator";
import { DataSource } from "typeorm";
import { OrganizationsService } from "../src/modules/organizations/organizations.service";
import { OrganizationStatus } from "../src/database/entities/organization.entity";
import { UpdateOrganizationAuthProfileDto } from "../src/modules/organizations/dto/organization-profile.dto";
import { OrganizationAuthProfiles1730300000000 } from "../src/database/migrations/1730300000000-OrganizationAuthProfiles";

const principal = {
  id: "principal",
  username: "principal",
  role: "PRINCIPAL",
  roles: ["PRINCIPAL"],
  capabilities: ["organization.manage"],
  organizationIds: ["school-a"],
  sessionId: "session",
};
function setup() {
  const org = {
    id: "school-a",
    name: "School",
    type: "SCHOOL",
    status: OrganizationStatus.ACTIVE,
    authProfile: null as unknown,
  };
  const repo = {
    findOne: jest.fn().mockResolvedValue(org),
    save: jest.fn().mockImplementation((value) => value),
    find: jest.fn(),
  };
  const service = new OrganizationsService(
    repo as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
    {} as never,
  );
  return { service, repo, org };
}
describe("School auth profiles", () => {
  it("allows the scoped principal to update the public profile and organization name", async () => {
    const { service, org, repo } = setup();
    await service.updateAuthProfile(principal, "school-a", {
      name: "Updated school",
      address: "School street",
      phone: "+98 123",
      published: true,
    });
    expect(org.name).toBe("Updated school");
    expect(org.authProfile).toMatchObject({
      address: "School street",
      phone: "+98 123",
      published: true,
    });
    expect(repo.save).toHaveBeenCalledWith(org);
  });
  it("rejects cross-school edits and users without the management capability", async () => {
    const { service, repo } = setup();
    await expect(
      service.updateAuthProfile(principal, "school-b", { published: true }),
    ).rejects.toMatchObject({
      response: { error: { code: "ORGANIZATION_FORBIDDEN" } },
    });
    await expect(
      service.updateAuthProfile(
        { ...principal, capabilities: [] },
        "school-a",
        { published: true },
      ),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("keeps platform operations unavailable to school users", async () => {
    const { service, repo } = setup();
    expect(() =>
      service.create(principal, {
        name: "Other school",
        type: "SCHOOL" as never,
      }),
    ).toThrow();
    await expect(
      service.update(principal, "school-a", { type: "INSTITUTION" as never }),
    ).rejects.toMatchObject({ response: { error: { code: "FORBIDDEN" } } });
    await expect(service.archive(principal, "school-a")).rejects.toBeDefined();
    expect(repo.save).not.toHaveBeenCalled();
  });
  it("returns only published, active profiles and allowlisted presentation fields", async () => {
    const { service, repo } = setup();
    repo.find.mockResolvedValue([
      {
        id: "school-a",
        name: "School",
        authProfile: {
          published: true,
          address: "Public address",
          secret: "must-not-be-public",
        },
        studentSignupLimit: 500,
      },
      { id: "school-b", name: "Other", authProfile: { published: false } },
    ]);
    const profiles = await service.publicProfiles();
    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ where: { status: OrganizationStatus.ACTIVE } }),
    );
    expect(profiles).toHaveLength(1);
    expect(profiles[0].profile.address).toBe("Public address");
    expect(profiles[0]).not.toHaveProperty("studentSignupLimit");
    expect(profiles[0].profile).not.toHaveProperty("secret");
  });
  it.each([
    "javascript:alert(1)",
    "data:image/svg+xml,svg",
    "//unknown.example/logo.png",
    'https://example.com/a.png\")',
  ])("rejects unsafe image URL %s", async (logoUrl) => {
    const dto = Object.assign(new UpdateOrganizationAuthProfileDto(), {
      logoUrl,
    });
    expect((await validate(dto)).length).toBeGreaterThan(0);
  });
  it.each(["", "/logo.png", "https://example.com/logo.png"])(
    "accepts valid image URL %s",
    async (logoUrl) => {
      expect(
        await validate(
          Object.assign(new UpdateOrganizationAuthProfileDto(), { logoUrl }),
        ),
      ).toHaveLength(0);
    },
  );
});
describe("School auth profile migration", () => {
  it("preserves existing organizations and supports rollback", async () => {
    const db = await new DataSource({
      type: "better-sqlite3",
      database: ":memory:",
    }).initialize();
    const q = db.createQueryRunner();
    try {
      await q.query(
        "CREATE TABLE organizations(id varchar PRIMARY KEY, name varchar NOT NULL)",
      );
      await q.query(
        "INSERT INTO organizations VALUES('existing','Existing school')",
      );
      const migration = new OrganizationAuthProfiles1730300000000();
      await migration.up(q);
      expect(await q.query("SELECT * FROM organizations")).toEqual([
        { id: "existing", name: "Existing school", authProfile: null },
      ]);
      await migration.down(q);
      expect(await q.query("SELECT * FROM organizations")).toEqual([
        { id: "existing", name: "Existing school" },
      ]);
    } finally {
      await q.release();
      await db.destroy();
    }
  });
});
