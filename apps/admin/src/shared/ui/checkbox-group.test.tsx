import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { Checkbox, CheckboxGroup } from "./ui";

describe("Checkbox and CheckboxGroup", () => {
  it("keeps the native checkbox contract while providing a concise checked callback", async () => {
    const user = userEvent.setup();
    const changes: boolean[] = [];
    render(
      <label>
        یادآوری پیام‌ها
        <Checkbox onCheckedChange={(checked) => changes.push(checked)} />
      </label>,
    );

    const checkbox = screen.getByRole("checkbox", { name: "یادآوری پیام‌ها" });
    await user.click(checkbox);
    expect(checkbox).toBeChecked();
    expect(changes).toEqual([true]);
  });

  it("supports labelled choices, descriptions, disabled options and select all", async () => {
    const user = userEvent.setup();
    function Example() {
      const [value, setValue] = useState<string[]>(["privacy"]);
      return (
        <CheckboxGroup
          legend="رضایت‌نامه‌ها"
          description="موارد لازم را بررسی و تأیید کنید."
          value={value}
          onValueChange={setValue}
          selectAllLabel="پذیرش همه"
          selectAllDescription="همه موارد قابل انتخاب را تأیید می‌کند."
          options={[
            { value: "privacy", label: "حریم خصوصی", description: "نگهداری امن اطلاعات." },
            { value: "photos", label: "استفاده از عکس" },
            { value: "locked", label: "گزینه قفل‌شده", disabled: true },
          ]}
        />
      );
    }

    render(<Example />);

    expect(screen.getByRole("group", { name: "رضایت‌نامه‌ها" })).toHaveAccessibleDescription(
      "موارد لازم را بررسی و تأیید کنید.",
    );
    expect(screen.getByRole("checkbox", { name: /حریم خصوصی/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "گزینه قفل‌شده" })).toBeDisabled();

    await user.click(screen.getByRole("checkbox", { name: "پذیرش همه" }));
    expect(screen.getByRole("checkbox", { name: /حریم خصوصی/ })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: "استفاده از عکس" })).toBeChecked();
    expect(screen.getByText("2 / 3")).toBeInTheDocument();

    const photos = screen.getByRole("checkbox", { name: "استفاده از عکس" });
    photos.focus();
    await user.keyboard(" ");
    expect(photos).not.toBeChecked();
    expect(screen.getByRole("checkbox", { name: "پذیرش همه" })).toHaveProperty(
      "indeterminate",
      true,
    );
    expect(screen.getByText("1 / 3")).toBeInTheDocument();
  });
});
