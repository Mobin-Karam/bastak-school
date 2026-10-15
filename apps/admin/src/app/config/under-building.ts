/**
 * Temporary post-login maintenance switch.
 *
 * Change `underBuilding` to false to restore the normal Admin workspace.
 * To change the countdown, adjust the start date and/or the number of days.
 */
export const underBuilding = true;
export const UNDER_BUILDING_STARTED_AT = "2026-10-15T00:00:00+03:30";
export const UNDER_BUILDING_DURATION_DAYS = 4;

export const underBuildingEndsAt =
  Date.parse(UNDER_BUILDING_STARTED_AT) + UNDER_BUILDING_DURATION_DAYS * 24 * 60 * 60 * 1_000;
