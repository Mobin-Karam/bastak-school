import { ActivityService } from "../src/modules/activity/activity.service";

describe("ActivityService sync-health telemetry", () => {
  function setup() {
    const row: any = { deviceId: "web-device-123", lastSuccessfulAt: null, updatedAt: new Date() };
    const syncHealth = {
      findOne: jest.fn(async () => row),
      create: jest.fn((value) => ({ ...row, ...value })),
      save: jest.fn(async (value) => ({ ...value, updatedAt: new Date() })),
      delete: jest.fn(async () => ({ affected: 0 })),
    };
    const students = { findOneOrFail: jest.fn(async () => ({ id: "student-1" })) };
    const service = new ActivityService({} as any, syncHealth as any, {} as any, {} as any, students as any, {} as any, {} as any, {} as any);
    return { service, syncHealth };
  }

  it("normalizes unknown device failure details to the fixed support taxonomy", async () => {
    const { service } = setup();
    await expect(service.reportSyncHealth("user-1", { deviceId: "web-device-123", status: "failed", pendingCount: 2, failureCode: "server said secret detail" })).resolves.toMatchObject({ failureCode: "UNKNOWN", pendingCount: 2 });
  });

  it("applies bounded retention cleanup at API startup", async () => {
    const { service, syncHealth } = setup();
    await service.onModuleInit();
    expect(syncHealth.delete).toHaveBeenCalledTimes(1);
  });
});
