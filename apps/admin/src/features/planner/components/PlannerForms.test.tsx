import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { PlanForm, TaskDrawer } from "./PlannerForms";
import { LocaleProvider } from "../../../shared/ui/locale";

afterEach(() => {
  cleanup();
  localStorage.removeItem("moshaver-admin-location");
});

const emptyDay = {
  planDate: "2026-09-26",
  title: "",
  dayLabel: "",
  persianDate: "",
  jalaliId: "",
  motivationText: "",
  published: false,
};

describe("PlanForm empty-day setup", () => {
  it("offers a Persian study starter and submits its editable values", async () => {
    const user = userEvent.setup();
    const submit = vi.fn().mockResolvedValue(undefined);
    render(
      <LocaleProvider>
        <PlanForm initial={emptyDay} lockDate busy={false} onSubmit={submit} onCancel={vi.fn()} />
      </LocaleProvider>,
    );

    await user.click(screen.getByRole("button", { name: "شروع روز مطالعه" }));
    expect(screen.getByDisplayValue("برنامه مطالعاتی امروز")).toBeTruthy();
    expect(screen.getByDisplayValue("روز مطالعه")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "ذخیره" }));

    expect(submit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "برنامه مطالعاتی امروز",
        dayLabel: "روز مطالعه",
        published: false,
      }),
    );
  });

  it("offers a separate review starter", async () => {
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <PlanForm initial={emptyDay} lockDate busy={false} onSubmit={vi.fn()} onCancel={vi.fn()} />
      </LocaleProvider>,
    );
    await user.click(screen.getByRole("button", { name: "روز مرور" }));
    expect(screen.getByDisplayValue("مرور و جمع‌بندی امروز")).toBeTruthy();
    expect(screen.getByDisplayValue("روز مرور")).toBeTruthy();
  });

  it("uses the active English locale for the planner form", async () => {
    localStorage.setItem("moshaver-admin-location", "international");
    const user = userEvent.setup();
    render(
      <LocaleProvider>
        <PlanForm initial={emptyDay} lockDate busy={false} onSubmit={vi.fn()} onCancel={vi.fn()} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Start day setup")).toBeTruthy();
    await user.click(screen.getByRole("button", { name: "Start study day" }));
    expect(screen.getByDisplayValue("Today's study plan")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("docks the task drawer at the logical end in English", () => {
    localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <TaskDrawer title="Edit activity" onClose={vi.fn()}>
          <p>Task form</p>
        </TaskDrawer>
      </LocaleProvider>,
    );
    expect(screen.getByRole("dialog")).toHaveClass("md:end-0");
    expect(screen.getByRole("dialog")).not.toHaveClass("md:right-auto");
  });
});
