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
    const scrollBody = container.ownerDocument.querySelector<HTMLElement>(
      "[dir=rtl].flex.min-h-0.flex-1.flex-col.overflow-y-auto",
    );
    const interactionBody =
      container.ownerDocument.querySelector<HTMLElement>("[data-drawer-content]");
    expect(panel).toHaveClass(
      "responsive-drawer-popup",
      "z-[121]",
      "bg-[rgb(var(--surface-card))]",
    );
    expect(panel).toHaveAttribute("data-swipe-direction", "right");
    expect(scrollBody).toHaveTextContent("محتوای پنل");
    expect(scrollBody).toHaveClass("flex-col", "min-h-0", "overflow-y-auto");
    expect(scrollBody).toHaveAttribute("data-drawer-scroll-body");
    expect(interactionBody).toContainElement(scrollBody);
  });

  it("can expand and restore the panel without changing the close action", () => {
    const { container } = render(
      <LocaleProvider>
        <ResponsiveDrawer open onOpenChange={vi.fn()} title="پرونده حضور">
          محتوای پنل
        </ResponsiveDrawer>
      </LocaleProvider>,
    );
    const expand = screen.getByRole("button", { name: "باز کردن پنل در فضای کاری" });

    fireEvent.click(expand);

    expect(expand.closest(".responsive-drawer-popup")).toHaveClass(
      "responsive-drawer-popup--expanded",
    );
    expect(screen.getByRole("button", { name: "بازگرداندن اندازه پنل" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });
});
