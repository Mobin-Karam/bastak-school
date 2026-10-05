import { describe, expect, it } from "vitest";
import { notificationTypeFilter } from "./NotificationsPage";

describe("NotificationsPage URL view state", () => {
  it("accepts only supported notification type filters", () => {
    expect(notificationTypeFilter("exam")).toBe("exam");
    expect(notificationTypeFilter("unknown")).toBe("all");
  });
});
