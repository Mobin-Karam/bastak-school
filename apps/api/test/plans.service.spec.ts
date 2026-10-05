import { PlansService } from "../src/modules/plans/plans.service";

function repository(overrides: Record<string, unknown> = {}) {
  return {
    find: jest.fn(),
    findOne: jest.fn(),
    findOneByOrFail: jest.fn(),
    findOneOrFail: jest.fn(),
    create: jest.fn((value) => value),
    save: jest.fn(async (value) => value),
    delete: jest.fn(),
    ...overrides,
  } as any;
}

describe("PlansService task time integrity", () => {
  function serviceFor(task = { id: "task-1", startTime: "09:00", endTime: "10:30", duration: 90, plan: { id: "plan-1" } }) {
    const plans = repository({ findOneOrFail: jest.fn().mockResolvedValue({ id: "plan-1", tasks: [task] }) });
    const tasks = repository({ findOneOrFail: jest.fn().mockResolvedValue(task) });
    return { service: new PlansService(plans, repository(), tasks), tasks };
  }

  it.each(["5:00", "25:00", "12:60", "abc"])('rejects malformed %s task times', async (startTime) => {
    const { service } = serviceFor();
    await expect(service.updateTask("task-1", { startTime, endTime: "10:30" })).rejects.toMatchObject({ status: 400 });
  });

  it.each([
    ["10:00", "10:00"],
    ["11:00", "10:00"],
  ])('rejects an invalid range %s to %s', async (startTime, endTime) => {
    const { service } = serviceFor();
    await expect(service.updateTask("task-1", { startTime, endTime })).rejects.toMatchObject({ status: 400 });
  });

  it.each([
    ["05:00", "06:00", 60],
    ["09:30", "11:00", 90],
    ["14:15", "15:00", 45],
    ["22:30", "23:00", 30],
  ])('persists duration calculated from %s to %s', async (startTime, endTime, duration) => {
    const { service, tasks } = serviceFor();
    await service.updateTask("task-1", { startTime, endTime, duration: 1 });
    expect(tasks.save).toHaveBeenCalledWith(expect.objectContaining({ startTime, endTime, duration }));
  });
});
