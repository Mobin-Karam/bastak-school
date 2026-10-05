import { BookOpen } from "lucide-react";
import { afterEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "../../shared/ui/locale";
import { EducationOverviewSkeleton } from "./components/ EducationOverviewSkeleton";
import { EducationSectionCard } from "./components/EducationSectionGrid";

describe("education locale flow", () => {
  afterEach(() => window.localStorage.clear());

  it("uses English loading copy and a right-facing disclosure affordance in LTR", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");

    const { container } = render(
      <LocaleProvider>
        <MemoryRouter>
          <EducationOverviewSkeleton />
          <ul>
            <EducationSectionCard
              section={{
                path: "subjects",
                title: "Subjects",
                description: "Manage subjects",
                icon: BookOpen,
              }}
            />
          </ul>
        </MemoryRouter>
      </LocaleProvider>,
    );

    expect(screen.getByRole("status", { name: "Loading the analytics section" })).toBeVisible();
    expect(screen.getByRole("link", { name: /subjects/i })).toContainHTML("lucide-arrow-up-right");
    expect(container.querySelector(".translate-x-1")).toBeTruthy();
  });
});
