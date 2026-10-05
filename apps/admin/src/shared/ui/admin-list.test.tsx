import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdminList } from "./admin-list";

describe("AdminList", () => {
  it("uses one shared loading, error and empty-state contract", () => {
    const retry = vi.fn();
    const { rerender } = render(
      <AdminList items={[]} label="آزمون‌ها">
        {() => null}
      </AdminList>,
    );
    expect(screen.getByText("آزمون‌ها برای نمایش وجود ندارد.")).toBeInTheDocument();
    rerender(
      <AdminList items={[]} label="آزمون‌ها" error onRetry={retry}>
        {() => null}
      </AdminList>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("دریافت آزمون‌ها ناموفق بود.");
    rerender(
      <AdminList items={[]} label="آزمون‌ها" loading>
        {() => null}
      </AdminList>,
    );
    expect(screen.getByText("در حال دریافت آزمون‌ها…")).toBeInTheDocument();
  });

  it("renders a feature-owned collection when data is available", () => {
    render(
      <AdminList items={["الف"]} label="نمونه">
        {(items) => <p>{items.join("، ")}</p>}
      </AdminList>,
    );
    expect(screen.getByText("الف")).toBeInTheDocument();
  });

  it("allows a fixed-height consumer to style the shared content region", () => {
    const { container } = render(
      <AdminList items={["الف"]} label="نمونه" contentClassName="test-scroll-region">
        {() => <p>الف</p>}
      </AdminList>,
    );

    expect(container.querySelector(".test-scroll-region")).toHaveTextContent("الف");
  });

  it("can retain collection context while a bounded list is scrolled", () => {
    const { container } = render(
      <AdminList items={["الف"]} label="نمونه" stickyHeader>
        {() => <p>الف</p>}
      </AdminList>,
    );

    expect(container.querySelector("header")).toHaveClass("sticky", "z-20");
  });

  it("assigns one labeled scroll owner and keeps an operational footer available", () => {
    const { container } = render(
      <AdminList
        items={["الف"]}
        label="نمونه"
        scrollable
        contentLabel="موارد نمونه"
        stickyFooter
        footer={<button type="button">صفحه بعد</button>}
      >
        {() => <p>الف</p>}
      </AdminList>,
    );

    expect(screen.getByRole("region", { name: "موارد نمونه" })).toHaveClass(
      "overflow-y-auto",
      "overscroll-contain",
    );
    expect(container.querySelector("footer")).toHaveClass("sticky", "bottom-0");
    expect(screen.getByRole("button", { name: "صفحه بعد" })).toBeVisible();
  });
});
