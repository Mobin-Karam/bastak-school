import { cleanup, fireEvent, render } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import type { Plan } from "../../../shared/types/domain";
import { PlannerCanvas } from "./PlannerCanvas";

function dataTransfer() {
  const values = new Map<string, string>();
  return {
    effectAllowed: "move",
    setData: (type: string, value: string) => values.set(type, value),
    getData: (type: string) => values.get(type) || "",
  };
}

const plan: Plan = {
  id: "monday-plan",
  planDate: "2026-09-28",
  published: false,
  tasks: [
    { id: "task-1", type: "study", title: "فیزیک", start: "09:00", end: "10:30", duration: 90 },
  ],
};

function canvas(
  mode: "day" | "week",
  onMoveTask = vi.fn(),
  options: { plans?: Plan[]; onQuickAdd?: (date: string, start?: string) => void } = {},
) {
  return render(
    <LocaleProvider>
      <PlannerCanvas
        mode={mode}
        date="2026-09-28"
        range={{ from: "2026-09-28", to: "2026-10-04" }}
        plans={options.plans ?? [plan]}
        loading={false}
        onSelectDay={vi.fn()}
        onCreate={vi.fn()}
        onQuickAdd={options.onQuickAdd ?? vi.fn()}
        onEditTask={vi.fn()}
        onDeleteTask={vi.fn()}
        onDuplicateTask={vi.fn()}
        onEditPlan={vi.fn()}
        onDuplicatePlan={vi.fn()}
        onDeletePlan={vi.fn()}
        onMoveTask={onMoveTask}
      />
    </LocaleProvider>,
  );
}

describe("PlannerCanvas rendered drag scheduling", () => {
  afterEach(() => {
    cleanup();
    localStorage.removeItem("moshaver-admin-location");
  });
  it("moves a rendered Day task to a time band and preserves duration", () => {
    const onMoveTask = vi.fn();
    const view = canvas("day", onMoveTask);
    const transfer = dataTransfer();
    fireEvent.dragStart(view.getByText("فیزیک").closest("button")!, { dataTransfer: transfer });
    const target = view.container.querySelector(
      '[data-planner-drop-date="2026-09-28"][data-planner-drop-time="11:00"]',
    );
    expect(target).not.toBeNull();
    fireEvent.drop(target!, { dataTransfer: transfer });
    expect(onMoveTask).toHaveBeenCalledWith("task-1", "2026-09-28", "11:00", "12:30");
  });

  it("moves a rendered Week task to an empty destination day", () => {
    const onMoveTask = vi.fn();
    const view = canvas("week", onMoveTask);
    const transfer = dataTransfer();
    fireEvent.dragStart(view.getByText("فیزیک").closest("button")!, { dataTransfer: transfer });
    const targets = [...view.container.querySelectorAll('[data-planner-drop-time="14:00"]')];
    expect(targets).toHaveLength(7);
    fireEvent.drop(
      view.container.querySelector(
        '[data-planner-drop-date="2026-09-30"][data-planner-drop-time="14:00"]',
      )!,
      { dataTransfer: transfer },
    );
    expect(onMoveTask).toHaveBeenCalledWith("task-1", "2026-09-30", "14:00", "15:30");
  });

  it("guides an empty editable day into its first task", () => {
    const onQuickAdd = vi.fn();
    const view = canvas("day", vi.fn(), { plans: [], onQuickAdd });
    expect(view.getByText("این روز هنوز فعالیتی ندارد")).toBeVisible();
    fireEvent.click(view.getByRole("button", { name: /شروع برنامه‌ریزی/ }));
    expect(onQuickAdd).toHaveBeenCalledWith("2026-09-28", "08:00");
  });

  it("creates an activity at the clicked shared-timeline time band", () => {
    const onQuickAdd = vi.fn();
    const view = canvas("week", vi.fn(), { onQuickAdd });
    fireEvent.click(
      view.container.querySelector(
        '[data-planner-drop-date="2026-09-30"][data-planner-drop-time="14:00"]',
      )!,
    );
    expect(onQuickAdd).toHaveBeenCalledWith("2026-09-30", "14:00");
    expect(view.getByLabelText("خط‌کش زمان مشترک")).toBeTruthy();
  });

  it("creates an activity on the selected day when the shared ruler is clicked", () => {
    const onQuickAdd = vi.fn();
    const view = canvas("week", vi.fn(), { onQuickAdd });
    fireEvent.click(view.getByRole("button", { name: "ساخت فعالیت در زمان 14:00" }));
    expect(onQuickAdd).toHaveBeenCalledWith("2026-09-28", "14:00");
  });

  it("renders Saturday as the first week column beside the right-side ruler", () => {
    const view = canvas("week");
    const ruler = view.getByLabelText("خط‌کش زمان مشترک");
    expect(
      ruler.previousElementSibling?.querySelector('[data-planner-drop-date="2026-09-28"]'),
    ).toBeTruthy();
  });

  it("moves the shared ruler to the LTR start edge while preserving the week order", () => {
    localStorage.setItem("moshaver-admin-location", "international");
    const view = canvas("week");
    const ruler = view.getByLabelText("Shared time ruler");
    expect(
      ruler.parentElement?.children[1]?.querySelector('[data-planner-drop-date="2026-10-04"]'),
    ).toBeTruthy();
    expect(view.container.querySelector('[dir="ltr"] .border-e')).toBeTruthy();
  });

  it("uses compact and detailed task presentations based on duration", () => {
    const view = canvas("day", vi.fn(), {
      plans: [
        {
          ...plan,
          tasks: [
            { id: "short", type: "study", title: "مرور کوتاه", start: "08:00", end: "08:30" },
            { id: "long", type: "study", title: "مطالعه عمیق", start: "09:00", end: "13:00" },
          ],
        },
      ],
    });
    expect(view.container.querySelector('[data-planner-task-id="short"]')).toHaveAttribute(
      "data-task-presentation",
      "compact",
    );
    expect(view.container.querySelector('[data-planner-task-id="long"]')).toHaveAttribute(
      "data-task-presentation",
      "detail",
    );
  });
});
