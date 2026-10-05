import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { StudentAllocationControl } from "./student-allocation-control";
import { LocaleProvider } from "./locale";

const students = [
  {
    id: "school-1",
    name: "دانش‌آموز کلاس",
    gradeId: 11,
    grade: "پایه یازدهم",
    educationTypeId: "theoretical",
    trackId: "experimental_sciences",
    learnerProfile: "school" as const,
  },
  {
    id: "independent-1",
    name: "یادگیرنده بزرگسال",
    educationTypeId: "independent",
    trackId: "independent",
    learnerProfile: "independent" as const,
    independentType: "adult",
  },
];

describe("StudentAllocationControl", () => {
  it("selects active class members and keeps independent learners out of class targeting", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <StudentAllocationControl
        students={students}
        selectedIds={[]}
        onChange={onChange}
        classes={[
          { id: "class-1", name: "یازدهم تجربی", status: "ACTIVE", students: [{ id: "school-1" }] },
        ]}
      />,
    );

    await user.selectOptions(screen.getByLabelText("فیلتر کلاس"), "class-1");
    await user.click(screen.getByRole("button", { name: "انتخاب نتایج" }));
    expect(onChange).toHaveBeenCalledWith(["school-1"]);

    await user.selectOptions(screen.getByLabelText("نوع یادگیرنده"), "independent");
    expect(screen.getByLabelText("فیلتر کلاس")).toBeDisabled();
    expect(screen.getByText("یادگیرنده بزرگسال")).toBeInTheDocument();
  });

  it("filters independent learners by their supported subtype", async () => {
    const user = userEvent.setup();
    const { container } = render(
      <StudentAllocationControl students={students} selectedIds={[]} onChange={vi.fn()} />,
    );

    await user.selectOptions(within(container).getByLabelText("نوع یادگیرنده مستقل"), "adult");

    expect(within(container).getByText("یادگیرنده بزرگسال")).toBeInTheDocument();
    expect(within(container).queryByText("دانش‌آموز کلاس")).not.toBeInTheDocument();
  });

  it("uses English education labels in the resource-assignment flow", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <StudentAllocationControl students={students} selectedIds={[]} onChange={vi.fn()} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("option", { name: "Theoretical" })).toBeInTheDocument();
    expect(screen.getByRole("option", { name: "Experimental sciences" })).toBeInTheDocument();
    window.localStorage.removeItem("moshaver-admin-location");
  });
});
