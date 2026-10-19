import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { todayIso } from "../../../../shared/lib/utils";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { DashboardCalendar } from "./DashboardCalendar";

describe("DashboardCalendar", () => {
  afterEach(() => {
    cleanup();
    vi.unstubAllGlobals();
  });

  it("paints the selected day and its two neighbors first, then prerenders a 30-day swipe buffer", () => {
    let idle: (() => void) | undefined;
    vi.stubGlobal("requestIdleCallback", (callback: () => void) => {
      idle = callback;
      return 1;
    });
    vi.stubGlobal("cancelIdleCallback", vi.fn());

    render(
      <LocaleProvider>
        <DashboardCalendar value="2026-10-07" onChange={() => undefined} capabilities={[]} />
      </LocaleProvider>,
    );

    expect(screen.getAllByRole("option")).toHaveLength(3);
    // CSSOM may normalize calc() or resolve it to pixels; the card sizing is
    // tied to its rail so split panes and tablet layouts still show three days.
    const expectedStyle = document.createElement("div").style;
    expectedStyle.width = "calc((100% - 1rem) / 3)";
    expect(screen.getAllByRole("option")[0].style.width).toBe(expectedStyle.width);
    act(() => idle?.());
    expect(screen.getAllByRole("option")).toHaveLength(61);
  });

  it("returns the carousel to today from its bottom-center control", () => {
    const onChange = vi.fn();
    render(
      <LocaleProvider>
        <DashboardCalendar value="2026-10-07" onChange={onChange} capabilities={[]} />
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "امروز" }));
    expect(onChange).toHaveBeenCalledWith(todayIso());
  });

  it("does not reset a deliberately selected date when the browser restores the page", () => {
    const onChange = vi.fn();
    render(
      <LocaleProvider>
        <DashboardCalendar value="2026-10-07" onChange={onChange} capabilities={[]} />
      </LocaleProvider>,
    );

    window.dispatchEvent(new Event("pageshow"));
    expect(onChange).not.toHaveBeenCalled();
  });
});
