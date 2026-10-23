import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { LocaleProvider } from "../../../../shared/ui/locale";
import { NotificationsToolbar } from "./NotificationsToolbar";

const mocks = vi.hoisted(() => ({
  notifications: {
    unread: 3,
    markingAllRead: false,
    markAllRead: vi.fn(),
    soundEnabled: true,
    chatSoundEnabled: true,
    setSoundEnabled: vi.fn(),
    setChatSoundEnabled: vi.fn(),
    testSound: vi.fn(),
  },
}));

vi.mock("../hooks/useAdminNotifications", () => ({
  useAdminNotifications: () => mocks.notifications,
}));

describe("NotificationsToolbar", () => {
  beforeEach(() => {
    mocks.notifications.markAllRead.mockReset();
  });

  it("marks every notification read from the compact mobile header", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <NotificationsToolbar
          compactMobile
          onOpenSettings={vi.fn()}
          onOpenMobileControls={vi.fn()}
        />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "خواندن همه" }));

    expect(mocks.notifications.markAllRead).toHaveBeenCalledOnce();
  });
});
