import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it } from "vitest";
import { PrincipalLandingPage } from "./PrincipalLandingPage";

describe("PrincipalLandingPage", () => {
  it("offers the detailed dashboard and the shared command-palette entry", () => {
    render(
      <MemoryRouter>
        <PrincipalLandingPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole("link", { name: /رفتن به داشبورد/ })).toHaveAttribute(
      "href",
      "/admin/dashboard/principal",
    );
    expect(screen.getByRole("link", { name: /جست‌وجو در سامانه/ })).toHaveAttribute(
      "href",
      "/admin?command=search",
    );
  });
});
