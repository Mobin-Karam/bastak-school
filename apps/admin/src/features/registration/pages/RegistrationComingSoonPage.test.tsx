import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { RegistrationComingSoonPage } from "./RegistrationComingSoonPage";

describe("RegistrationComingSoonPage", () => {
  it("keeps the unreleased registration route informative and non-mutating on every shell", () => {
    render(
      <MemoryRouter>
        <RegistrationComingSoonPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("heading", { name: "ثبت‌نام و پرونده" })).toBeInTheDocument();
    expect(screen.getByText(/هیچ درخواست ثبت‌نامی ارسال نمی‌کند/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "بازگشت به خانه" })).toHaveAttribute("href", "/admin");
  });
});
