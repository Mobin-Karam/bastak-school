import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../../app/layout/hooks/use-device-performance", () => ({
  useDevicePerformance: () => "reduced",
}));
vi.mock("../hooks/use-current-prayer", () => ({
  useCurrentPrayer: () => ({ label: "ظهر", time: "12:05", tomorrow: false }),
}));

import { CurrentPrayerCard } from "./CurrentPrayerCard";

describe("CurrentPrayerCard", () => {
  afterEach(cleanup);

  it("uses Persian digits while preserving an API-safe machine-readable time", () => {
    render(<CurrentPrayerCard times={null} />);

    const time = screen.getByText("۱۲:۰۵");
    expect(time).toHaveAttribute("dateTime", "12:05");
    expect(time).toHaveAttribute("lang", "fa");
    expect(screen.getByRole("group")).toHaveClass("max-md:-mx-4");
  });
});
