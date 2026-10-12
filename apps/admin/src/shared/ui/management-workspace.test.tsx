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
    expect(detailPane).toHaveClass(
      "management-master-detail__detail",
      "management-master-detail__detail--scroll",
      "min-[1200px]:sticky",
      "min-[1200px]:overflow-y-auto",
      "min-[1200px]:overscroll-contain",
    );
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
    expect(detailPane).toHaveClass(
      "management-master-detail__detail",
      "management-master-detail__detail--static",
      "min-[1200px]:sticky",
      "min-[1200px]:top-0",
    );
    expect(detailPane).not.toHaveClass(
      "min-[1200px]:overflow-y-auto",
      "min-[1200px]:max-h-[calc(100dvh-6rem)]",
    );
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

    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
    expect(screen.getByLabelText("Summary and filters")).toBeInTheDocument();
    expect(screen.getByText("1,234")).toBeInTheDocument();
    localStorage.removeItem("moshaver-admin-location");
  });

  it("keeps actions in content without duplicating the global heading", () => {
    const { container, getByRole } = render(
      <ManagementPageHeader
        eyebrow="Operations"
        title="Students"
        description="Review enrolled students."
        action={<button type="button">Add student</button>}
      />,
    );

    expect(container.querySelector("header, h1")).toBeNull();
    expect(getByRole("region", { name: "Students" })).toContainElement(
      getByRole("button", { name: "Add student" }),
    );
  });

  it("uses no content space when a page has no actions", () => {
    const { container } = render(
      <ManagementPageHeader title="Students" description="Review enrolled students." />,
    );
    expect(container).toBeEmptyDOMElement();
  });
});
