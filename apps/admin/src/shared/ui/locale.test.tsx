import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { LocaleProvider, useLocale } from "./locale";

function DateFormatProbe({ options }: { options: Intl.DateTimeFormatOptions }) {
  const { formatDate } = useLocale();
  return <output>{formatDate("2026-08-31", options)}</output>;
}

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("LocaleProvider date formatting", () => {
  it.each(["iran", "international"] as const)(
    "formats a styled date without mixing component options for %s",
    (location) => {
      localStorage.setItem("moshaver-admin-location", location);

      expect(() =>
        render(
          <LocaleProvider>
            <DateFormatProbe options={{ dateStyle: "short" }} />
          </LocaleProvider>,
        ),
      ).not.toThrow();

      expect(screen.getByRole("status")).toHaveTextContent(/\S/);
    },
  );

  it("keeps explicit component formatting available", () => {
    localStorage.setItem("moshaver-admin-location", "international");

    render(
      <LocaleProvider>
        <DateFormatProbe options={{ year: "2-digit", month: "2-digit", day: "2-digit" }} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("status")).toHaveTextContent("26");
  });
});
