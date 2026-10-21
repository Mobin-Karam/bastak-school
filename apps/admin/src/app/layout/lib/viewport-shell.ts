import { useSyncExternalStore } from "react";

export type AdminShellKind = "mobile" | "tablet" | "desktop";

export const TABLET_MIN_WIDTH = 768;
export const DESKTOP_MIN_WIDTH = 1200;

export function shellForViewportWidth(width: number): AdminShellKind {
  if (width >= DESKTOP_MIN_WIDTH) return "desktop";
  if (width >= TABLET_MIN_WIDTH) return "tablet";
  return "mobile";
}

function subscribe(onStoreChange: () => void) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};

  const mobile = window.matchMedia(`(max-width: ${TABLET_MIN_WIDTH - 1}px)`);
  const tablet = window.matchMedia(
    `(min-width: ${TABLET_MIN_WIDTH}px) and (max-width: ${DESKTOP_MIN_WIDTH - 1}px)`,
  );
  const desktop = window.matchMedia(`(min-width: ${DESKTOP_MIN_WIDTH}px)`);
  const queries = [mobile, tablet, desktop];

  queries.forEach((query) => query.addEventListener("change", onStoreChange));
  return () => queries.forEach((query) => query.removeEventListener("change", onStoreChange));
}

function getSnapshot() {
  return shellForViewportWidth(window.innerWidth);
}

/**
 * A viewport subscription is intentionally isolated from routes and feature
 * state. Changing orientation therefore swaps only shell chrome, not the
 * active page or its local form state.
 */
export function useViewportShell(): AdminShellKind {
  return useSyncExternalStore(subscribe, getSnapshot, () => "desktop");
}
