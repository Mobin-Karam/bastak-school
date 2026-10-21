import { describe, expect, it } from "vitest";
import { resolveAdminPerformanceProfile } from "./device-performance";

describe("resolveAdminPerformanceProfile", () => {
  it("prioritizes accessibility and constrained-device signals over visual effects", () => {
    expect(resolveAdminPerformanceProfile({ prefersReducedMotion: true })).toBe("reduced");
    expect(resolveAdminPerformanceProfile({ saveData: true, deviceMemory: 8 })).toBe("reduced");
    expect(resolveAdminPerformanceProfile({ effectiveType: "2g" })).toBe("reduced");
    expect(resolveAdminPerformanceProfile({ deviceMemory: 2, hardwareConcurrency: 8 })).toBe(
      "reduced",
    );
  });

  it("keeps the default experience conservative when browser hints are unavailable", () => {
    expect(resolveAdminPerformanceProfile({})).toBe("standard");
    expect(resolveAdminPerformanceProfile({ deviceMemory: 4, hardwareConcurrency: 4 })).toBe(
      "standard",
    );
  });

  it("enables the richer presentation only with both strong memory and CPU hints", () => {
    expect(resolveAdminPerformanceProfile({ deviceMemory: 4, hardwareConcurrency: 6 })).toBe(
      "enhanced",
    );
    expect(resolveAdminPerformanceProfile({ deviceMemory: 8, hardwareConcurrency: 8 })).toBe(
      "enhanced",
    );
  });
});
