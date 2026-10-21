import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "./locale";
import { ResponsiveDrawer } from "./responsive-drawer";

describe("ResponsiveDrawer", () => {
  it("closes when its mobile handle is dragged down past the close threshold", () => {
    const onOpenChange = vi.fn();

    render(
      <LocaleProvider>
        <ResponsiveDrawer open onOpenChange={onOpenChange} title="پرونده حضور">
          محتوای پنل
        </ResponsiveDrawer>
      </LocaleProvider>,
    );

    const handle = screen.getByRole("button", {
      name: "کشیدن برای بستن پنل",
    });
    fireEvent.pointerDown(handle, { pointerId: 1, clientY: 12 });
    fireEvent.pointerMove(handle, { pointerId: 1, clientY: 96 });
    fireEvent.pointerUp(handle, { pointerId: 1, clientY: 96 });

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
