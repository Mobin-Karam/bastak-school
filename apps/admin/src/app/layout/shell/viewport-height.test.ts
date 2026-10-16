import { describe, expect, it } from "vitest";
import { currentViewportHeight } from "./viewport-height";

describe("currentViewportHeight", () => {
  it("uses VisualViewport height when Safari exposes it", () => {
    expect(
      currentViewportHeight({
        innerHeight: 844,
        visualViewport: { height: 521 } as VisualViewport,
      } as Window),
    ).toBe(521);
  });

  it("falls back to the browser layout viewport", () => {
    expect(currentViewportHeight({ innerHeight: 844, visualViewport: undefined } as Window)).toBe(
      844,
    );
  });
});
