import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ZaninBrand } from "./zanin-brand";

describe("ZaninBrand", () => {
  it("uses the compact optimized logo with reserved dimensions", () => {
    render(<ZaninBrand priority />);

    const logo = screen.getByRole("img", { name: "مدرسه دینی سلطان العلماء بستک" });
    expect(logo).toHaveAttribute("src", "/logo-bastak.webp");
    expect(logo).toHaveAttribute("width", "120");
    expect(logo).toHaveAttribute("height", "40");
    expect(screen.getByText("مدرسه دینی سلطان العلماء بستک")).toBeInTheDocument();
  });
});
