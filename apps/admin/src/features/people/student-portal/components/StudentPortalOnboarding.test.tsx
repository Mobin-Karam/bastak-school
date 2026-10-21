import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { StudentPortalOnboarding } from "./StudentPortalOnboarding";

const authState = vi.hoisted(() => ({
  activeRole: "STUDENT" as string | null,
  user: { id: "student-1" } as { id: string } | null,
}));

vi.mock("../../../identity/auth", () => ({
  useAuth: () => authState,
}));

vi.mock("../../../../app/routing/portal-domain", () => ({
  currentAppDomain: () => "student",
}));

describe("StudentPortalOnboarding", () => {
  afterEach(() => {
    cleanup();
    localStorage.clear();
    authState.activeRole = "STUDENT";
    authState.user = { id: "student-1" };
  });

  it("shows the five student welcome pages and lets the student move forward and back", async () => {
    const user = userEvent.setup();
    render(<StudentPortalOnboarding />);

    expect(screen.getByRole("dialog", { name: "راهنمای شروع، صفحه 1 از 5" })).toBeVisible();
    expect(screen.getAllByRole("tab")).toHaveLength(5);
    expect(screen.getByRole("button", { name: "بازگشت" })).toBeDisabled();

    await user.click(screen.getByRole("button", { name: "ادامه" }));
    expect(screen.getByRole("dialog", { name: "راهنمای شروع، صفحه 2 از 5" })).toBeVisible();
    expect(screen.getByRole("button", { name: "بازگشت" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "بازگشت" }));
    expect(screen.getByRole("dialog", { name: "راهنمای شروع، صفحه 1 از 5" })).toBeVisible();
  });

  it("persists completion for this student after the fifth page", async () => {
    const user = userEvent.setup();
    render(<StudentPortalOnboarding />);

    for (let page = 0; page < 4; page += 1) {
      await user.click(screen.getByRole("button", { name: "ادامه" }));
    }
    await user.click(screen.getByRole("button", { name: "شروع ورود به سامانه" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(localStorage.getItem("bastak-student-portal-onboarding:v1:student-1")).toBe("1");
  });

  it("does not render for non-student roles", () => {
    authState.activeRole = "TEACHER";
    render(<StudentPortalOnboarding />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
