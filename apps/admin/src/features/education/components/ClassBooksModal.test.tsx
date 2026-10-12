import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { LocaleProvider } from "../../../shared/ui/locale";
import { ClassBooksModal } from "./ClassBooksModal";
import type { EducationClass, ClassOptions } from "../api/classes.api";
import { deleteEducationBook } from "../api/education-catalog.api";
vi.mock("../../auth", () => ({ useAuth: () => ({ can: () => true }) }));
vi.mock("../api/education-catalog.api", () => ({ deleteEducationBook: vi.fn() }));
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
function mount() {
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
