import { beforeEach, describe, expect, it, vi } from "vitest";

const { get, post, patch } = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  patch: vi.fn(),
}));

vi.mock("../../../../shared/api/api", () => ({ api: { get, post, patch } }));

import {
  getSchoolOccupancy,
  listExitPermissions,
  recordDeparture,
  recordReturn,
  reviewExitPermission,
} from "./exit-permissions.api";

describe("exit-permissions API", () => {
  beforeEach(() => vi.clearAllMocks());

  it("keeps the organization scope on read endpoints", () => {
    listExitPermissions("school 1");
    getSchoolOccupancy("school 1");

    expect(get).toHaveBeenNthCalledWith(1, "/exit-permissions?organizationId=school%201");
    expect(get).toHaveBeenNthCalledWith(2, "/attendance/occupancy?organizationId=school%201");
  });

  it("uses separate approval, departure, and return endpoints", () => {
    reviewExitPermission("exit-1", "APPROVED", "تا ساعت ۲۰ بازگردد");
    recordDeparture("exit-1");
    recordReturn("exit-1");

    expect(patch).toHaveBeenCalledWith("/exit-permissions/exit-1", {
      status: "APPROVED",
      note: "تا ساعت ۲۰ بازگردد",
    });
    expect(post).toHaveBeenNthCalledWith(1, "/exit-permissions/exit-1/departure", {});
    expect(post).toHaveBeenNthCalledWith(2, "/exit-permissions/exit-1/return", {});
  });
});
