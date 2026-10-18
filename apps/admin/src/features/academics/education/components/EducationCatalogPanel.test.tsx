import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ModalProvider } from "../../../../shared/ui/modal";
import { EducationCatalogPanel } from "./EducationCatalogPanel";
import { getManagedBooks, updateEducationBook } from "../api/education-catalog.api";
vi.mock("../api/education-catalog.api.ts", () => ({
  getManagedBooks: vi.fn(),
  updateEducationBook: vi.fn(),
  createEducationBook: vi.fn(),
  publishEducationBook: vi.fn(),
  getEducationBookImpact: vi.fn(),
  previewEducationImport: vi.fn(),
  commitEducationImport: vi.fn(),
}));
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.resetAllMocks();
});
describe("catalog archive confirmation", () => {
  it("requires cross-section confirmation before deleting assignments", async () => {
    localStorage.setItem("moshaver-admin-location", "international");
    vi.mocked(getManagedBooks).mockResolvedValue([
      {
        id: "book",
        titleFa: "Math",
        titleEn: "Math",
        state: "PUBLISHED",
        grade: 1,
        schoolYear: "1405",
        category: "Subject",
      },
    ] as never);
    vi.mocked(updateEducationBook).mockResolvedValue({ id: "book", state: "ARCHIVED" } as never);
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LocaleProvider>
          <ModalProvider>
            <EducationCatalogPanel canManage canPublish />
          </ModalProvider>
        </LocaleProvider>
      </QueryClientProvider>,
    );
    await userEvent.click(await screen.findByRole("button", { name: /Archive|بایگانی/ }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(/every linked class/)).toBeInTheDocument();
    expect(updateEducationBook).not.toHaveBeenCalled();
    await userEvent.click(dialog.getByRole("button", { name: "Delete from catalog and classes" }));
    expect(updateEducationBook).toHaveBeenCalledWith("book", { state: "ARCHIVED" });
  });
});
