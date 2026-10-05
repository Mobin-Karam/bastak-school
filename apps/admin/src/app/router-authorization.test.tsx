import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../shared/ui/locale";

const can = vi.fn<(capability: string) => boolean>();
vi.mock("../features/auth", () => ({ LoginPage: () => null, useAuth: () => ({ can }) }));

import { CapabilityRoute } from "./router";

describe("protected portal routes", () => {
  afterEach(cleanup);

  beforeEach(() => {
    can.mockReset();
    localStorage.clear();
  });

  function renderCapabilityRoute(
    capability: React.ComponentProps<typeof CapabilityRoute>["capability"],
    children: React.ReactNode,
    language: "fa" | "en" = "fa",
  ) {
    if (language === "en") localStorage.setItem("moshaver-admin-location", "international");
    return render(
      <LocaleProvider>
        <CapabilityRoute capability={capability}>{children}</CapabilityRoute>
      </LocaleProvider>,
    );
  }

  it("blocks a manipulated direct URL", () => {
    can.mockReturnValue(false);
    renderCapabilityRoute("system.manage", <span>secret system page</span>);
    expect(screen.getByRole("alert")).toHaveTextContent("این ابزار در نقش فعال شما نیست");
    expect(screen.getByRole("link", { name: "بازگشت به میز کار" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.queryByText("secret system page")).not.toBeInTheDocument();
  });
  it("keeps capability denial intact with English locale copy", () => {
    can.mockReturnValue(false);
    renderCapabilityRoute("system.manage", <span>secret system page</span>, "en");
    expect(screen.getByRole("alert")).toHaveTextContent(
      "This tool is unavailable in your active role",
    );
    expect(screen.getByRole("link", { name: "Return to workspace" })).toHaveAttribute(
      "href",
      "/admin",
    );
    expect(screen.queryByText("secret system page")).not.toBeInTheDocument();
  });
  it("renders an authorized route", () => {
    can.mockImplementation((capability) => capability === "students.read");
    renderCapabilityRoute("students.read", <span>student directory</span>);
    expect(screen.getByText("student directory")).toBeInTheDocument();
  });
  it("renders a section hub when any one of its capabilities is authorized", () => {
    can.mockImplementation((capability) => capability === "plans.read");
    renderCapabilityRoute(
      ["exams.read", "plans.read", "learning.read"],
      <span>education hub</span>,
    );
    expect(screen.getByText("education hub")).toBeInTheDocument();
  });
});
