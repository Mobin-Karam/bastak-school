import { describe, expect, it } from "vitest";

import {
  UNDER_BUILDING_DURATION_DAYS,
  UNDER_BUILDING_STARTED_AT,
  underBuildingEndsAt,
} from "./under-building";

describe("under-building configuration", () => {
  it("uses one shared deadline derived from the configured number of days", () => {
    expect(underBuildingEndsAt).toBe(
      Date.parse(UNDER_BUILDING_STARTED_AT) + UNDER_BUILDING_DURATION_DAYS * 24 * 60 * 60 * 1_000,
    );
  });
});
