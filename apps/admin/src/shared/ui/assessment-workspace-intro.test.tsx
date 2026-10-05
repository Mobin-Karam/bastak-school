import { render } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { AssessmentWorkspaceIntro } from "./assessment-workspace-intro";
import { LocaleProvider } from "./locale";

afterEach(() => {
  window.localStorage.removeItem("moshaver-admin-location");
});

describe("AssessmentWorkspaceIntro", () => {
  it.each([
    ["iran", "bg-gradient-to-l"],
    ["international", "bg-gradient-to-r"],
  ] as const)("keeps its start edge and visual accent correct for %s", (location, gradient) => {
    window.localStorage.setItem("moshaver-admin-location", location);

    const { container } = render(
      <LocaleProvider>
        <AssessmentWorkspaceIntro
          icon={<span>i</span>}
          title="Workspace"
          description="Review the assessment data."
        />
      </LocaleProvider>,
    );

    const intro = container.querySelector(".border-s-4");
    expect(intro).toHaveClass("border-s-4", gradient);
    expect(intro).not.toHaveClass("border-l-4", "border-r-4");
  });
});
