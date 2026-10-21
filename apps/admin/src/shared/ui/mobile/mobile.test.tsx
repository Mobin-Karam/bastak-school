import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import {
  BackButton,
  FilterChips,
  MobileListItem,
  MobilePageContainer,
  MobileRadioGroup,
  ProgressIndicator,
} from "./index";

describe("mobile shared UI foundation", () => {
  it("keeps mobile list rows keyboard-operable and gives the page semantic structure", async () => {
    const user = userEvent.setup();
    const onOpen = vi.fn();
    render(
      <MobilePageContainer aria-label="صفحه آزمون">
        <MobileListItem title="پرونده طلبه" description="مشاهده جزئیات" onClick={onOpen} />
      </MobilePageContainer>,
    );
    expect(screen.getByRole("main", { name: "صفحه آزمون" })).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /پرونده طلبه/ }));
    expect(onOpen).toHaveBeenCalledOnce();
  });

  it("preserves explicit selection and progress semantics", async () => {
    const user = userEvent.setup();
    const onFilterChange = vi.fn();
    const onRadioChange = vi.fn();
    render(
      <>
        <FilterChips
          value={[]}
          onValueChange={onFilterChange}
          options={[{ value: "active", label: "فعال" }]}
        />
        <MobileRadioGroup
          label="نوع ثبت"
          value="weekly"
          onValueChange={onRadioChange}
          options={[{ value: "daily", label: "روزانه" }]}
        />
        <ProgressIndicator value={40} label="تکمیل پرونده" />
      </>,
    );
    await user.click(screen.getByRole("button", { name: "فعال" }));
    await user.click(screen.getByRole("radio", { name: "روزانه" }));
    expect(onFilterChange).toHaveBeenCalledWith(["active"]);
    expect(onRadioChange).toHaveBeenCalledWith("daily");
    expect(screen.getByText("۴۰٪")).toBeInTheDocument();
  });

  it("provides a labelled touch-sized back action", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(<BackButton onClick={onClick} />);
    await user.click(screen.getByRole("button", { name: "بازگشت" }));
    expect(onClick).toHaveBeenCalledOnce();
  });
});
