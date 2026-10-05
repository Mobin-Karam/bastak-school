import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  ManagementMasterDetail,
  ManagementPageHeader,
  ManagementStat,
  ManagementSummaryBar,
} from "./management-workspace";
import { LocaleProvider } from "./locale";

describe("ManagementMasterDetail", () => {
  it("keeps a long desktop detail pane independently scrollable", () => {
    const { container } = render(
      <ManagementMasterDetail directory={<div>فهرست</div>} detail={<button>ثبت تغییرات</button>} />,
    );

    const detailPane = screen.getByRole("button", { name: "ثبت تغییرات" }).parentElement;
    expect(detailPane).toHaveClass("xl:sticky", "xl:overflow-y-auto", "xl:overscroll-contain");
    expect(container).toHaveTextContent("فهرست");
  });

  it("lets a detail surface own its scroll area without adding a nested scrollbar", () => {
    render(
      <ManagementMasterDetail
        directory={<div>فهرست</div>}
        detail={<div>پرونده دانش‌آموز</div>}
        detailScroll={false}
      />,
    );

    const detailPane = screen.getByText("پرونده دانش‌آموز").parentElement;
    expect(detailPane).toHaveClass("xl:sticky", "xl:top-20");
    expect(detailPane).not.toHaveClass("xl:overflow-y-auto", "xl:max-h-[calc(100dvh-6rem)]");
  });

  it("localizes generic workspace defaults and numeric formatting", () => {
    localStorage.setItem("moshaver-admin-location", "international");
    render(
      <LocaleProvider>
        <ManagementPageHeader title="Students" description="Review enrolled students." />
        <ManagementSummaryBar>
          <ManagementStat label="All students" value={1234} />
        </ManagementSummaryBar>
      </LocaleProvider>,
    );

    expect(screen.getByText("Management")).toBeInTheDocument();
    expect(screen.getByLabelText("Summary and filters")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
    localStorage.removeItem("moshaver-admin-location");
  });

  it("keeps page actions in the header action lane with an announced hierarchy", () => {
    const { container, getByRole } = render(
      <ManagementPageHeader
        eyebrow="Operations"
        title="Students"
        description="Review enrolled students."
        action={<button type="button">Add student</button>}
      />,
    );

    const heading = container.querySelector("h1");
    if (!heading) throw new Error("Expected the page heading to render.");
    expect(heading).toHaveTextContent("Students");
    expect(heading.closest("header")).toHaveAttribute("aria-labelledby", heading.id);
    expect(getByRole("button", { name: "Add student" }).parentElement).toHaveClass(
      "w-full",
      "sm:w-auto",
      "[&>*]:w-full",
    );
  });
});
