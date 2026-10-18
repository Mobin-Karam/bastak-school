import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  DESKTOP_MIN_WIDTH,
  shellForViewportWidth,
  TABLET_MIN_WIDTH,
  useViewportShell,
} from "./viewport-shell";

const listeners = new Set<() => void>();

afterEach(() => {
  listeners.clear();
  vi.unstubAllGlobals();
});

function installViewport(width: number) {
  Object.defineProperty(window, "innerWidth", { configurable: true, value: width, writable: true });
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({
      matches: false,
      media: "",
      addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
      removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
    })),
  );
}

describe("adaptive Admin shell breakpoints", () => {
  it("uses the requested mobile, tablet, and desktop boundaries", () => {
    expect(shellForViewportWidth(TABLET_MIN_WIDTH - 1)).toBe("mobile");
    expect(shellForViewportWidth(TABLET_MIN_WIDTH)).toBe("tablet");
    expect(shellForViewportWidth(DESKTOP_MIN_WIDTH - 1)).toBe("tablet");
    expect(shellForViewportWidth(DESKTOP_MIN_WIDTH)).toBe("desktop");
  });

  it("keeps orientation-width changes within the same deterministic classifier", () => {
    expect(shellForViewportWidth(1024)).toBe("tablet");
    expect(shellForViewportWidth(667)).toBe("mobile");
    expect(shellForViewportWidth(1366)).toBe("desktop");
  });

  it("updates the active shell when a viewport media query changes", () => {
    installViewport(390);
    const { result } = renderHook(() => useViewportShell());
    expect(result.current).toBe("mobile");

    act(() => {
      window.innerWidth = 900;
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe("tablet");

    act(() => {
      window.innerWidth = 1280;
      listeners.forEach((listener) => listener());
    });
    expect(result.current).toBe("desktop");
  });
});
