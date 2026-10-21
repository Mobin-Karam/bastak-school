import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { usePWAInstall } from "./use-pwa-install";

type PromptEvent = Event & {
  prompt: ReturnType<typeof vi.fn>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function installEvent(outcome: "accepted" | "dismissed"): PromptEvent {
  const event = new Event("beforeinstallprompt", { cancelable: true }) as PromptEvent;
  event.prompt = vi.fn().mockResolvedValue(undefined);
  event.userChoice = Promise.resolve({ outcome, platform: "web" });
  return event;
}

describe("usePWAInstall", () => {
  beforeEach(() => {
    localStorage.clear();
    Object.defineProperty(window, "matchMedia", {
      configurable: true,
      value: vi.fn().mockReturnValue({ matches: false }),
    });
    Object.defineProperty(window.navigator, "userAgent", {
      configurable: true,
      value: "Mozilla/5.0 (Linux; Android 14)",
    });
  });

  afterEach(() => vi.restoreAllMocks());

  it("defers Chromium's banner and prompts exactly once from the install action", async () => {
    const { result } = renderHook(() => usePWAInstall());
    const event = installEvent("accepted");

    await act(async () => window.dispatchEvent(event));

    expect(event.defaultPrevented).toBe(true);
    expect(result.current.canInstall).toBe(true);

    await act(async () => {
      await expect(result.current.installApp()).resolves.toEqual({ outcome: "accepted" });
    });

    expect(event.prompt).toHaveBeenCalledOnce();
    expect(result.current.canInstall).toBe(false);
  });

  it("consumes a dismissed browser prompt so it cannot be prompted again", async () => {
    const { result } = renderHook(() => usePWAInstall());
    const event = installEvent("dismissed");

    await act(async () => window.dispatchEvent(event));
    await act(async () => {
      await expect(result.current.installApp()).resolves.toEqual({ outcome: "dismissed" });
    });

    await act(async () => {
      await expect(result.current.installApp()).resolves.toEqual({ outcome: "unavailable" });
    });
    expect(event.prompt).toHaveBeenCalledOnce();
  });
});
