import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { AdminShellModel } from "../../hooks/use-admin-shell-model";

vi.mock("../../navigation/mobile/AdminMobileNavigation", () => ({
  AdminMobileBottomNav: () => <nav aria-label="ناوبری پایین" />,
}));
import { MobileShell } from "./MobileShell";

const studentModel = {
  auth: { activeRole: "STUDENT", user: { firstName: "محمد" } },
  current: { path: "", title: "خانه" },
  notificationState: { unread: 2 },
  selectedStudentId: "",
  performance: "reduced",
} as unknown as AdminShellModel;

describe("MobileShell", () => {
  afterEach(cleanup);

  function renderShell(model = studentModel) {
    return render(
      <MemoryRouter>
        <MobileShell model={model} />
      </MemoryRouter>,
    );
  }

  it("keeps the masthead brand separate from the shell-level floating island", () => {
    const { container } = renderShell({
      ...studentModel,
      auth: { activeRole: "PRINCIPAL", user: { firstName: "مدیر" } },
      notificationState: { unread: 0 },
    } as AdminShellModel);

    expect(screen.getByRole("img", { name: "مدرسه دینی سلطان العلماء بستک" })).toHaveAttribute(
      "src",
      "/logo-bastak.webp",
    );
    expect(container.querySelectorAll('img[src="/right-left-angel.png"]')).toHaveLength(2);
  });
});
