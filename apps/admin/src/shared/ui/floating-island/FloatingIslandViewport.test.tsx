import { render, screen } from "@testing-library/react";
import { useEffect } from "react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { FloatingIslandProvider, useFloatingIsland } from "./FloatingIslandProvider";
import { FloatingIslandViewport } from "./FloatingIslandViewport";

function Activity() {
  const { show } = useFloatingIsland();
  useEffect(() => {
    show({
      id: "notification",
      kind: "notification",
      priority: 70,
      title: "اعلان جدید",
      description: "پیام مدرسه",
      action: { label: "مشاهده", to: "/admin/communication/notifications" },
    });
  }, [show]);
  return null;
}

describe("FloatingIslandViewport", () => {
  it("expands with a keyboard-accessible action and collapses on Escape", async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <FloatingIslandProvider>
          <Activity />
          <FloatingIslandViewport direction="rtl" performance="reduced" />
        </FloatingIslandProvider>
      </MemoryRouter>,
    );
    const trigger = await screen.findByRole("button", { name: /اعلان جدید/ });
    await user.click(trigger);
    expect(screen.getByRole("link", { name: "مشاهده" })).toHaveAttribute(
      "href",
      "/admin/communication/notifications",
    );
    await user.keyboard("{Escape}");
    expect(trigger).toHaveAttribute("aria-expanded", "false");
  });
});
