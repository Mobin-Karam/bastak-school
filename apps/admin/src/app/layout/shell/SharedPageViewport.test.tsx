import axe from "axe-core";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SharedPageViewport } from "./SharedPageViewport";

describe("SharedPageViewport accessibility", () => {
  it("provides one labelled document main region without viewport-specific duplication", async () => {
    const view = render(
      <SharedPageViewport contentOffsetClassName="md:ms-[4.5rem]">
        <h1>School workspace</h1>
      </SharedPageViewport>,
    );

    const result = await axe.run(view.container, {
      rules: { "color-contrast": { enabled: false } },
    });
    expect(result.violations).toEqual([]);
    expect(view.getByRole("main")).toHaveTextContent("School workspace");
  });
});
