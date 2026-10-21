import { describe, expect, it } from "vitest";
import { currentPrayer } from "./current-prayer";

const schedule = {
  fajr: "05:00",
  sunrise: "06:20",
  dhuhr: "12:00",
  asr: "15:30",
  maghrib: "18:00",
  isha: "19:15",
};

describe("currentPrayer", () => {
  it("moves to the following saved time once the active time has passed", () => {
    expect(currentPrayer(schedule, new Date("2026-10-08T08:40:00.000Z"))?.key).toBe("asr");
  });

  it("returns the next day's صبح after عشاء", () => {
    const active = currentPrayer(schedule, new Date("2026-10-08T18:00:00.000Z"));
    expect(active).toMatchObject({ key: "fajr", tomorrow: true });
  });

  it("supports Persian numerals from existing saved rows", () => {
    expect(
      currentPrayer({ ...schedule, asr: "۱۵:۳۰" }, new Date("2026-10-08T08:40:00.000Z"))?.key,
    ).toBe("asr");
  });
});
