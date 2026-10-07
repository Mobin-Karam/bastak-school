import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../shared/ui/locale";

const can = vi.fn<(capability: string) => boolean>();
const canAny = vi.fn<(capabilities: readonly string[]) => boolean>();
const canAll = vi.fn<(capabilities: readonly string[]) => boolean>();
vi.mock("../../features/auth", () => ({
  LoginPage: () => null,
  useAuth: () => ({ can, canAny, canAll }),
}));

import { CapabilityRoute } from "./router";

describe("protected portal routes", () => {
  afterEach(cleanup);

  beforeEach(() => {
    can.mockReset();
    canAny.mockReset();
    canAll.mockReset();
    localStorage.clear();
  });

  function renderCapabilityRoute(
    capability: React.ComponentProps<typeof CapabilityRoute>["capability"],
    children: React.ReactNode,
    language: "fa" | "en" = "fa",
    allOf?: readonly string[],
  ) {
    if (language === "en") localStorage.setItem("moshaver-admin-location", "international");
    return render(
      <LocaleProvider>
        <CapabilityRoute capability={capability} allOf={allOf}>
          {children}
        </CapabilityRoute>
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
    canAny.mockImplementation((capabilities) => capabilities.includes("plans.read"));
    renderCapabilityRoute(
      ["exams.read", "plans.read", "learning.read"],
      <span>education hub</span>,
    );
    expect(screen.getByText("education hub")).toBeInTheDocument();
  });

  it("requires every explicitly required capability", () => {
    can.mockReturnValue(true);
    canAll.mockReturnValue(false);
    renderCapabilityRoute("students.read", <span>student export</span>, "fa", ["students.export"]);
    expect(screen.queryByText("student export")).not.toBeInTheDocument();
  });
});
