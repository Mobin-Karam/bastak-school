import { describe, expect, it } from "vitest";
import { notificationTypeFilter } from "./NotificationsPage";

describe("NotificationsPage announcement view", () => {
  it("keeps announcement as an active notification type filter", () => {
    expect(notificationTypeFilter("announcement")).toBe("announcement");
  });
});
