import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { SegmentedControl } from "./segmented-control";

describe("SegmentedControl", () => {
  it("communicates the active selection and emits the new value", async () => {
    const user = userEvent.setup();
    const onValueChange = vi.fn();
    render(
      <SegmentedControl
        ariaLabel="نوع نمایش"
        value="list"
        onValueChange={onValueChange}
        options={[
          { value: "list", label: "فهرست" },
          { value: "grid", label: "شبکه" },
        ]}
      />,
    );

    expect(screen.getByRole("group", { name: "نوع نمایش" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "فهرست" })).toHaveAttribute("aria-pressed", "true");
    await user.click(screen.getByRole("button", { name: "شبکه" }));
    expect(onValueChange).toHaveBeenCalledWith("grid");
  });
});
