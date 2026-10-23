import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "./locale";
import { ResponsiveDrawer } from "./responsive-drawer";

describe("ResponsiveDrawer", () => {
  it("closes through the accessible close control", () => {
    const onOpenChange = vi.fn();

    render(
      <LocaleProvider>
        <ResponsiveDrawer open onOpenChange={onOpenChange} title="پرونده حضور">
          محتوای پنل
        </ResponsiveDrawer>
      </LocaleProvider>,
    );

    fireEvent.click(screen.getByRole("button", { name: "بستن" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });

  it("uses a readable opaque surface and keeps the drawer body as the scroll owner", () => {
    const { container } = render(
      <LocaleProvider>
        <ResponsiveDrawer open onOpenChange={vi.fn()} title="پرونده حضور">
          محتوای پنل
        </ResponsiveDrawer>
      </LocaleProvider>,
    );
    const panel = container.ownerDocument.querySelector("[role=dialog]");
    const scrollBody = container.ownerDocument.querySelector(
      "[dir=rtl].flex.min-h-0.flex-1.flex-col.overflow-y-auto",
    );
    expect(panel).toHaveClass(
      "responsive-drawer-popup",
      "z-[121]",
      "bg-[rgb(var(--surface-card))]",
    );
    expect(panel).toHaveAttribute("data-swipe-direction", "right");
    expect(scrollBody).toHaveTextContent("محتوای پنل");
    expect(scrollBody).toHaveClass("flex-col", "min-h-0", "overflow-y-auto");
  });
});
