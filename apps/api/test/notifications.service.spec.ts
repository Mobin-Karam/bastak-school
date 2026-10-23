import { NotificationType } from "../src/database/entities/notification.entity";
import { UserRole } from "../src/database/entities/user.entity";
import { NotificationsService } from "../src/modules/notifications/notifications.service";

function repository<T>(items: T[] = []) {
  const queryBuilder: any = {
    leftJoinAndSelect: jest.fn(function () {
      return this;
    }),
    where: jest.fn(function () {
      return this;
    }),
    andWhere: jest.fn(function () {
      return this;
    }),
    orderBy: jest.fn(function () {
      return this;
    }),
    addOrderBy: jest.fn(function () {
      return this;
    }),
    take: jest.fn(function () {
      return this;
    }),
    getMany: jest.fn(async () => items),
    getCount: jest.fn(
      async () => items.filter((item) => !(item as any).readAt).length,
    ),
    update: jest.fn(function () {
      return this;
    }),
    set: jest.fn(function () {
      return this;
    }),
    execute: jest.fn(async () => ({ affected: 1 })),
  };
  return {
    findOneByOrFail: jest.fn(async ({ id }: { id: string }) =>
      items.find((item) => (item as any).id === id),
    ),
    findOne: jest.fn(
      async ({ where }: { where: Record<string, any> }) =>
        items.find(
          (item) =>
            (item as any).id === where.id ||
            (where.user?.id && (item as any).user?.id === where.user.id),
        ) || null,
    ),
    find: jest.fn(async () => items),
    count: jest.fn(
      async () => items.filter((item) => !(item as any).readAt).length,
    ),
    update: jest.fn(async () => ({ affected: 1 })),
    create: jest.fn((item: T) => item),
    save: jest.fn(async (item: T) => item),
    createQueryBuilder: jest.fn(() => queryBuilder),
  };
}

describe("NotificationsService", () => {
  it("emits the canonical notification event after persistence", async () => {
    const realtime = { emitToUser: jest.fn() };
    const push = { sendToUser: jest.fn().mockResolvedValue({ sent: 1, removed: 0 }) };
    const service = new NotificationsService(
      repository() as any,
      repository() as any,
      realtime as any,
      repository([{ id: "user-1" }]) as any,
      push as any,
    );
    await service.createForUser("user-1", {
      type: NotificationType.MESSAGE,
      title: "پیام تازه",
      body: "متن اعلان",
    });
    expect(realtime.emitToUser).toHaveBeenCalledWith(
      "user-1",
      "notification.created",
      expect.objectContaining({ title: "پیام تازه", body: "متن اعلان" }),
    );
    expect(push.sendToUser).toHaveBeenCalledWith(
      "user-1",
      expect.objectContaining({ title: "پیام تازه", body: "متن اعلان" }),
    );
  });

  it("persists school scope on each recipient notification", async () => {
    const notifications = repository() as any;
    const service = new NotificationsService(
      notifications,
      repository() as any,
      { emitToUser: jest.fn() } as any,
      repository([{ id: "user-1" }]) as any,
    );
    await service.createForUsers(["user-1", "user-1", "user-2"], {
      type: "ANNOUNCEMENT",
      category: "announcement",
      title: "اطلاعیه مدرسه",
      body: "متن",
      organizationId: "school-1",
    });

    expect(notifications.save).toHaveBeenCalledTimes(2);
    expect(notifications.save).toHaveBeenCalledWith(
      expect.objectContaining({ organization: { id: "school-1" } }),
    );
  });

  it("lists notifications belonging to the authenticated user", async () => {
    const student = { id: "student-1", user: { id: "student-user" } } as any;
    const notification = {
      id: "n1",
      user: student.user,
      type: NotificationType.MESSAGE,
      category: "general",
      title: "Title",
      body: "Message",
      priority: "normal",
      readAt: null,
      createdAt: new Date(),
    } as any;
    const service = new NotificationsService(
      repository([notification]) as any,
      repository([student]) as any,
      {} as any,
    );

    await expect(
      service.list({ id: "student-user", role: UserRole.STUDENT } as any),
    ).resolves.toMatchObject({
      unreadCount: 1,
      items: [{ id: "n1", isRead: false }],
    });
  });

  it("limits the inbox and unread count to the active school plus global notices", async () => {
    const notifications = repository([]) as any;
    const service = new NotificationsService(
      notifications,
      repository() as any,
      {} as any,
    );

    await service.findForUser("staff-1", { organizationId: "school-1" });

    const queryBuilder = notifications.createQueryBuilder.mock.results[0].value;
    expect(queryBuilder.where).toHaveBeenCalledWith("n.userId = :userId", {
      userId: "staff-1",
    });
    expect(queryBuilder.andWhere).toHaveBeenCalledWith(
      "(n.organizationId IS NULL OR n.organizationId = :organizationId)",
      { organizationId: "school-1" },
    );
  });

  it("does not allow marking a notification from another school as read", async () => {
    const notifications = repository([]) as any;
    const service = new NotificationsService(
      notifications,
      repository() as any,
      {} as any,
    );

    await expect(
      service.markRead(
        { id: "staff-1", role: UserRole.ADMIN, activeOrganizationId: "school-1" } as any,
        "other-school-notification",
      ),
    ).rejects.toMatchObject({
      response: { error: { code: "NOTIFICATION_NOT_FOUND" } },
    });
    expect(notifications.findOne).toHaveBeenCalledWith({
      where: [
        {
          id: "other-school-notification",
          user: { id: "staff-1" },
          organization: { id: "school-1" },
        },
        {
          id: "other-school-notification",
          user: { id: "staff-1" },
          organization: expect.anything(),
        },
      ],
      relations: { organization: true },
    });
  });

  it("marks all owned unread notifications for every authenticated role", async () => {
    const student = { id: "student-1", user: { id: "student-user" } } as any;
    const notifications = repository([{ id: "n1", readAt: null }]) as any;
    const service = new NotificationsService(
      notifications,
      repository([student]) as any,
      {} as any,
    );

    await expect(
      service.markAllRead({
        id: "student-user",
        role: UserRole.STUDENT,
      } as any),
    ).resolves.toEqual({ updated: 1 });
    await expect(
      service.list({ id: "admin-user", role: UserRole.ADMIN } as any),
    ).resolves.toMatchObject({ unreadCount: 1 });
  });
});
