import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { LocaleProvider } from "../../shared/ui/locale";
import { ReportSummary } from "./components/ReportSummary";

describe("ReportSummary localization", () => {
  afterEach(() => window.localStorage.clear());

  it("uses the English adapter for the summary explanation", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    render(
      <LocaleProvider>
        <ReportSummary
          summary={{
            count: 1,
            studyHours: 2,
            tests: 3,
            accuracy: 75,
            focus: 8,
            motivation: 7,
            fatigue: 2,
          }}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Calculated from the reports currently loaded.")).toBeVisible();
  });
});
