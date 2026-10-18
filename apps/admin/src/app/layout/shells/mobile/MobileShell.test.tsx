import { cleanup, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import type { AdminShellModel } from "../../hooks/use-admin-shell-model";

vi.mock("../../navigation/mobile/AdminMobileNavigation", () => ({
  AdminMobileBottomNav: () => <nav aria-label="ناوبری پایین" />,
}));
vi.mock("../../../../features/analytics/dashboard/api/dashboard.api", () => ({
  getAdminDashboard: async () => ({ home: { announcements: [] } }),
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
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    return render(
      <MemoryRouter>
        <QueryClientProvider client={client}>
          <MobileShell model={model} />
        </QueryClientProvider>
      </MemoryRouter>,
    );
  }

  it("expands the student floating island into reachable notification and profile actions", async () => {
    const user = (await import("@testing-library/user-event")).default.setup();
    renderShell();

    const island = screen.getByRole("button", { name: "باز کردن گزینه‌های زنین" });
    expect(island).toHaveAttribute("aria-expanded", "false");

    await user.click(island);

    expect(island).toHaveAttribute("aria-expanded", "true");
    expect(island).toHaveAccessibleName("بستن گزینه‌های زنین");
    expect(screen.getByRole("link", { name: "۲ اعلان خوانده‌نشده" })).toHaveAttribute(
      "href",
      "/admin/communication/notifications",
    );
    expect(screen.getByRole("link", { name: "پروفایل من" })).toHaveAttribute(
      "href",
      "/admin/profile",
    );
  });

  it("uses the centered Bastak brand and mirrored ornaments when there is nothing to announce", () => {
    const { container } = renderShell({
      ...studentModel,
      notificationState: { unread: 0 },
    } as AdminShellModel);

    expect(
      screen.queryByRole("button", { name: "باز کردن گزینه‌های زنین" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("img", { name: "مدرسه دینی سلطان العلماء بستک" })).toHaveAttribute(
      "src",
      "/logo-bastak.webp",
    );
    expect(container.querySelectorAll('img[src="/right-left-angel.png"]')).toHaveLength(2);
  });
});
