import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RegistrationLayout } from "./RegistrationLayout";
const mocks = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }));
vi.mock("../../shared/api/api", () => ({ api: mocks }));
describe("registration compatibility entrypoint", () => {
  it("shows the coming-soon destination without reading or changing registration data", () => {
    render(
      <MemoryRouter>
        <RegistrationLayout />
      </MemoryRouter>,
    );
    expect(screen.getByRole("heading", { name: "ثبت‌نام و پرونده" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "بازگشت به خانه" })).toHaveAttribute("href", "/admin");
    expect(mocks.get).not.toHaveBeenCalled();
    expect(mocks.post).not.toHaveBeenCalled();
  });
});
