import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ModalProvider, useModal } from "../../../../shared/ui/modal";
import { ClassBooksModal } from "./ClassBooksModal";
import type { EducationClass, ClassOptions } from "../api/classes.api";
import { deleteEducationBook } from "../api/education-catalog.api";
vi.mock("../api/education-catalog.api.ts", () => ({ deleteEducationBook: vi.fn() }));
const classroom = {
  id: "class",
  name: "Class",
  books: [
    {
      id: "link",
      bookId: "book",
      title: "Math",
      code: "",
      teacher: { id: "teacher", name: "Teacher" },
    },
  ],
} as EducationClass;
const options = {
  books: [{ id: "book", title: "Math", category: "Subject", track: "general" }],
  teachers: [{ id: "teacher", name: "Teacher", roles: ["TEACHER"] }],
} as ClassOptions;
// Global modal content is outside AuthProvider in AppProviders.
function mount(canDeleteBooks = true) {
  render(
    <QueryClientProvider
      client={new QueryClient({ defaultOptions: { mutations: { retry: false } } })}
    >
      <LocaleProvider>
        <ClassBooksModal
          classroom={classroom}
          options={options}
          onSave={vi.fn()}
          onClose={vi.fn()}
          saving={false}
          canDeleteBooks={canDeleteBooks}
        />
      </LocaleProvider>
    </QueryClientProvider>,
  );
}
afterEach(cleanup);
beforeEach(() => {
  localStorage.setItem("moshaver-admin-location", "international");
  vi.mocked(deleteEducationBook)
    .mockReset()
    .mockResolvedValue({ id: "book", state: "ARCHIVED" } as never);
});
describe("class book deletion", () => {
  it("opens and closes through the global modal without an auth provider", async () => {
    function BooksLauncher() {
      const modal = useModal();
      return (
        <button
          onClick={() =>
            modal.open({
              title: "Manage class books",
              content: (
                <ClassBooksModal
                  classroom={classroom}
                  options={options}
                  onSave={vi.fn()}
                  onClose={modal.close}
                  saving={false}
                  canDeleteBooks
                />
              ),
            })
          }
        >
          Books management
        </button>
      );
    }
    render(
      <QueryClientProvider client={new QueryClient()}>
        <LocaleProvider>
          <ModalProvider>
            <BooksLauncher />
          </ModalProvider>
        </LocaleProvider>
      </QueryClientProvider>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Books management" }));
    expect(within(screen.getByRole("dialog")).getByText("Math")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe("hidden");
    await userEvent.click(screen.getByRole("button", { name: "Books management" }));
    expect(within(screen.getByRole("dialog")).getByText("Math")).toBeVisible();
  });
  it("renders without auth context and hides deletion without catalog capability", () => {
    mount(false);
    expect(screen.getByText("Math")).toBeVisible();
    expect(screen.getByRole("checkbox")).toBeChecked();
    expect(screen.queryByRole("button", { name: /Delete book|حذف کتاب/ })).not.toBeInTheDocument();
  });
  it("explains both sections and cancellation does not delete", async () => {
    mount();
    await userEvent.click(screen.getByRole("button", { name: /Delete book|حذف کتاب/ }));
    expect(screen.getByRole("alertdialog")).toHaveTextContent(/catalog|کاتالوگ/);
    expect(deleteEducationBook).not.toHaveBeenCalled();
    await userEvent.click(
      within(screen.getByRole("alertdialog")).getByRole("button", { name: /Cancel|انصراف|لغو/ }),
    );
    expect(screen.getByText("Math")).toBeVisible();
    expect(deleteEducationBook).not.toHaveBeenCalled();
  });
  it("deletes only after confirmation and removes the book from the editor", async () => {
    mount();
    await userEvent.click(screen.getByRole("button", { name: /Delete book|حذف کتاب/ }));
    await userEvent.click(
      screen.getByRole("button", {
        name: /Delete from catalog and classes|حذف از کاتالوگ و کلاس‌ها/,
      }),
    );
    expect(deleteEducationBook).toHaveBeenCalledWith("book");
    expect(screen.queryByText("Math")).not.toBeInTheDocument();
  });
  it("keeps the confirmation open and displays a history-protection error", async () => {
    vi.mocked(deleteEducationBook).mockRejectedValue(new Error("Book used in timetable history"));
    mount();
    await userEvent.click(screen.getByRole("button", { name: /Delete book|حذف کتاب/ }));
    await userEvent.click(
      screen.getByRole("button", {
        name: /Delete from catalog and classes|حذف از کاتالوگ و کلاس‌ها/,
      }),
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Book used in timetable history");
    expect(screen.getByRole("alertdialog")).toBeInTheDocument();
  });
});
