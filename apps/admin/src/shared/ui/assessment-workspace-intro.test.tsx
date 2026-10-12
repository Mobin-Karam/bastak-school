import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssessmentWorkspaceIntro } from "./assessment-workspace-intro";

describe("AssessmentWorkspaceIntro", () => {
  it("retains metrics and actions in content without a duplicate header", () => {
    const { container } = render(
      <AssessmentWorkspaceIntro
        icon={<span>i</span>}
        title="Workspace"
        description="Review the assessment data."
        actions={<button>Create assessment</button>}
        metrics={<span>12 assessments</span>}
      />,
    );
    expect(container.querySelector("header, h1")).toBeNull();
    expect(screen.getByRole("region", { name: "Workspace" })).toContainElement(
      screen.getByRole("button", { name: "Create assessment" }),
    );
    expect(screen.getByText("12 assessments")).toBeVisible();
  });
});
