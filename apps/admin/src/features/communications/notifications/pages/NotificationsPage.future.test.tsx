import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { MemoryRouter } from "react-router-dom";

import { NotificationsPage } from "./NotificationsPage";

describe("NotificationsPage future announcement view", () => {
  afterEach(cleanup);

  it("disables the announcement-filtered notification page without mounting the active inbox", () => {
    render(
      <MemoryRouter initialEntries={["/admin/communication/notifications?type=announcement"]}>
        <NotificationsPage />
      </MemoryRouter>,
    );

    expect(
      screen.getByRole("heading", { name: "اعلان‌های اطلاعیه‌ای فعلاً غیرفعال است" }),
    ).toBeInTheDocument();
    expect(screen.getByText("در آینده به این بخش برمی‌گردیم.")).toBeInTheDocument();
  });
});
