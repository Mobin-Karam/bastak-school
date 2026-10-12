import { afterEach, describe, it, expect } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Field, Button } from "../../../shared/ui/ui";
import { TimetableTimeInput } from "./TimetableTimeInput";
afterEach(cleanup);
function Probe() {
  const [value, setValue] = useState("");
  return (
    <>
      <Field label="زمان شروع">
        <TimetableTimeInput
          data-field-control
          value={value}
          onChange={(event) => setValue(event.target.value)}
        />
      </Field>
      <Button>ادامه</Button>
    </>
  );
}
describe("school clock editing", () => {
  it("keeps the field accessible and converts Persian clock input on blur", async () => {
    render(<Probe />);
    const clock = screen.getByLabelText("زمان شروع");
    await userEvent.type(clock, "۷:۳۰");
    await userEvent.click(screen.getByRole("button", { name: "ادامه" }));
    expect(clock).toHaveValue("07:30");
  });
});
