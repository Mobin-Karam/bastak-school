import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { FloatingIslandProvider, useFloatingIsland } from "./FloatingIslandProvider";

describe("FloatingIslandProvider", () => {
  afterEach(() => vi.useRealTimers());

  it("deduplicates activities and selects the deterministic highest priority", () => {
    const { result } = renderHook(() => useFloatingIsland(), { wrapper: FloatingIslandProvider });

    act(() => {
      result.current.show({ id: "prayer", kind: "prayer", priority: 20, title: "نماز بعدی" });
      result.current.show({
        id: "alert",
        kind: "system",
        priority: 90,
        title: "اتصال برقرار نیست",
      });
      result.current.show({ id: "prayer", kind: "prayer", priority: 30, title: "نماز عصر" });
    });

    expect(result.current.activities.map((activity) => activity.id)).toEqual(["alert", "prayer"]);
    expect(result.current.activities[1]?.title).toBe("نماز عصر");
  });

  it("collapses a dismissed expanded activity", () => {
    const { result } = renderHook(() => useFloatingIsland(), { wrapper: FloatingIslandProvider });
    act(() =>
      result.current.show({ id: "notice", kind: "notification", priority: 70, title: "اعلان" }),
    );
    act(() => result.current.expand("notice"));
    act(() => result.current.dismiss("notice"));
    expect(result.current.expandedId).toBeNull();
    expect(result.current.activities).toHaveLength(0);
  });

  it("keeps an activity without an expiry visible", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFloatingIsland(), { wrapper: FloatingIslandProvider });
    act(() =>
      result.current.show({ id: "unread", kind: "notification", priority: 70, title: "اعلان" }),
    );
    act(() => vi.advanceTimersByTime(60_000));
    expect(result.current.activities).toHaveLength(1);
  });

  it("removes an activity when its explicit expiry elapses", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFloatingIsland(), { wrapper: FloatingIslandProvider });
    act(() =>
      result.current.show({
        id: "announcement",
        kind: "notification",
        priority: 70,
        title: "اطلاعیه",
        duration: 1_000,
      }),
    );
    act(() => vi.advanceTimersByTime(1_000));
    expect(result.current.activities).toHaveLength(0);
  });

  it("replaces an activity expiry when the activity is refreshed", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useFloatingIsland(), { wrapper: FloatingIslandProvider });
    act(() =>
      result.current.show({
        id: "announcement",
        kind: "notification",
        priority: 70,
        title: "اطلاعیه",
        duration: 1_000,
      }),
    );
    act(() => vi.advanceTimersByTime(500));
    act(() =>
      result.current.show({
        id: "announcement",
        kind: "notification",
        priority: 70,
        title: "اطلاعیه به روز شد",
        duration: 1_000,
      }),
    );
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.activities).toHaveLength(1);
    act(() => vi.advanceTimersByTime(500));
    expect(result.current.activities).toHaveLength(0);
  });
});
