import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { AttendanceSelect } from "./AttendanceSelect";

afterEach(cleanup);

describe("AttendanceSelect", () => {
  it("portals readable menu choices above the drawer and commits a selection", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <AttendanceSelect
        label="فیلتر اعضای جلسه"
        mode="menu"
        value="missing"
        onChange={onChange}
        options={[
          { value: "missing", label: "غایب یا حضور تأییدنشده" },
          { value: "all", label: "همه اعضا" },
        ]}
      />,
    );
    await user.click(screen.getByRole("button", { name: "فیلتر اعضای جلسه" }));
    const menu = screen.getByRole("menu", { name: "فیلتر اعضای جلسه" });
    expect(menu.parentElement).toHaveClass("z-[140]");
    expect(menu).toHaveTextContent("غایب یا حضور تأییدنشده");
    await user.click(screen.getByRole("menuitemradio", { name: "همه اعضا" }));
    expect(onChange).toHaveBeenCalledWith("all");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });
});
