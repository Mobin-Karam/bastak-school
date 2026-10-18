import { Hash } from "lucide-react";
import { render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { LearningMetric } from "./LearningMetric";

describe("LearningMetric localization", () => {
  afterEach(() => window.localStorage.clear());

  it("formats numeric metric values for the active English locale", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <LocaleProvider>
        <LearningMetric icon={Hash} label="Total items" value={1250} />
      </LocaleProvider>,
    );

    expect(screen.getByText("Total items")).toBeVisible();
    expect(screen.getByText("1,250")).toBeVisible();
    expect(document.documentElement).toHaveAttribute("dir", "ltr");
  });
});
