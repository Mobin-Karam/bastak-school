import { SchoolHomeService } from "../src/modules/school-home/school-home.service";

describe("SchoolHomeService announcement delivery", () => {
  it("delivers an organization-scoped notification with announcement navigation to every active member", async () => {
    const organization = { id: "school-1", name: "مدرسه نمونه" };
    const announcement = {
      id: "announcement-1",
      organization,
      audience: "ALL",
      title: "جلسه اولیا",
      body: "دوشنبه ساعت ۱۰",
      category: "مدرسه",
      status: "ACTIVE",
      publishedAt: new Date("2026-10-20T08:00:00.000Z"),
      expiresAt: new Date("2026-10-21T08:00:00.000Z"),
      createdAt: new Date("2026-10-20T08:00:00.000Z"),
    };
    const recipients = [{ user: { id: "user-1" } }, { user: { id: "user-2" } }];
    const notifications = { createForUsers: jest.fn().mockResolvedValue([]) };
    const authorization = {
      requireCapability: jest.fn(),
      canAccessOrganization: jest.fn().mockReturnValue(true),
    };
    const service = new SchoolHomeService(
      {
        findOneBy: jest.fn().mockResolvedValue(organization),
      } as any,
      {} as any,
      {
        create: jest.fn((value) => value),
        save: jest.fn().mockResolvedValue(announcement),
        findOneOrFail: jest.fn().mockResolvedValue(announcement),
      } as any,
      {
        delete: jest.fn(),
        save: jest.fn(),
        create: jest.fn((value) => value),
        find: jest.fn().mockResolvedValue(recipients),
      } as any,
      {
        find: jest.fn().mockResolvedValue(recipients),
      } as any,
      {} as any,
      {} as any,
      {} as any,
      authorization as any,
      notifications as any,
    );

    await service.saveAnnouncement(
      {
        id: "publisher-1",
        username: "principal",
        role: "PRINCIPAL",
        sessionId: "session-1",
        organizationIds: ["school-1"],
      },
      "school-1",
      {
        audience: "ALL",
        title: "جلسه اولیا",
        body: "دوشنبه ساعت ۱۰",
        status: "ACTIVE",
      } as any,
    );

    expect(notifications.createForUsers).toHaveBeenCalledWith(
      ["user-1", "user-2"],
      expect.objectContaining({
        category: "announcement",
        organizationId: "school-1",
        url: "/admin/communication/notifications?type=announcement&announcementId=announcement-1",
        dedupeKey: expect.stringMatching(/^announcement:announcement-1:/),
        data: expect.objectContaining({ announcementId: "announcement-1" }),
      }),
    );
    expect(authorization.requireCapability).toHaveBeenCalledWith(
      expect.anything(),
      "announcements.manage",
    );
    expect(authorization.canAccessOrganization).toHaveBeenCalledWith(
      expect.anything(),
      "school-1",
      "announcements.manage",
    );
  });
});
