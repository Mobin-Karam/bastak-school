import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../shared/ui/locale";
import { ModalProvider } from "../../../shared/ui/modal";
import { BookShelfPage } from "./BookShelfPage";
import {
  getClassOptions,
  listClasses,
  setClassBooks,
  type EducationClass,
} from "../api/classes.api";
import {
  createEducationBook,
  deleteEducationBook,
  updateEducationBook,
  type ManagedEducationBook,
} from "../api/education-catalog.api";

const authority = vi.hoisted(() => ({ manage: true, organizationId: "org-one" }));
vi.mock("../../auth", () => ({
  useAuth: () => ({
    user: { id: "staff-one" },
    activeRole: "ORGANIZATION_ADMIN",
    context: { activeOrganization: { id: authority.organizationId } },
    can: (capability: string) =>
      capability === "classes.read" ||
      (authority.manage && capability === "education.catalog.manage"),
  }),
}));
vi.mock("../api/classes.api", () => ({
  listClasses: vi.fn(),
  setClassBooks: vi.fn(),
  getClassOptions: vi.fn(),
}));
vi.mock("../api/education-catalog.api", () => ({
  createEducationBook: vi.fn(),
  deleteEducationBook: vi.fn(),
  updateEducationBook: vi.fn(),
}));
vi.mock("../../../shared/ui/notifications", () => ({ notify: vi.fn() }));
const fixture = (): EducationClass => ({
  id: "class-one",
  organization: { id: "org-one", name: "School One" },
  code: "class-1",
  name: "First class",
  schoolYear: "1405-1406",
  gradeId: null,
  educationTypeId: null,
  trackId: null,
  capacity: 35,
  status: "ACTIVE",
  description: "",
  advisor: null,
  enrollmentCount: 0,
  students: [],
  books: [
    {
      id: "link-one",
      bookId: "book-one",
      title: "Mathematics",
      code: "M1",
      teacher: { id: "teacher-one", name: "Teacher One" },
    },
    {
      id: "link-two",
      bookId: "book-two",
      title: "Science",
      code: "S1",
      teacher: { id: "teacher-two", name: "Teacher Two" },
    },
    {
      id: "link-three",
      bookId: "book-three",
      title: "English",
      code: "E1",
      teacher: { id: "teacher-one", name: "Teacher One" },
    },
  ],
});
let classroom: EducationClass;
function Location() {
  return <output data-testid="location">{useLocation().search}</output>;
}
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const tree = () => (
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <MemoryRouter initialEntries={["/?class=class-one"]}>
          <ModalProvider>
            <BookShelfPage />
            <Location />
          </ModalProvider>
        </MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>
  );
  const view = render(tree());
  return { ...view, rerenderWorkspace: () => view.rerender(tree()) };
}

beforeEach(() => {
  vi.resetAllMocks();
  vi.stubGlobal("PointerEvent", MouseEvent);
  localStorage.setItem("moshaver-admin-location", "international");
  authority.manage = true;
  authority.organizationId = "org-one";
  classroom = fixture();
  vi.mocked(listClasses).mockImplementation(async () => [
    classroom,
    { ...fixture(), id: "class-two", name: "Second class", books: [] },
  ]);
  vi.mocked(getClassOptions).mockResolvedValue({
    classroom,
    books: [],
    teachers: [{ id: "teacher-one", name: "Teacher One", roles: ["TEACHER"] }],
    advisors: [],
    eligibleStudents: [],
  });
  vi.mocked(setClassBooks).mockImplementation(async (_id, links) => {
    classroom = {
      ...classroom,
      books: classroom.books.filter((book) => links.some((link) => link.bookId === book.bookId)),
    };
    return classroom;
  });
});
afterEach(() => {
  cleanup();
  localStorage.clear();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

async function openActions(id: string) {
  await userEvent.click(await screen.findByRole("button", { name: `Actions ${id}` }));
}
describe("books shared table workflow", () => {
  it("replaces the shelf presentation and resets search/selection when switching class", async () => {
    const view = mount();
    await screen.findByRole("table");
    expect(view.container.querySelector('[style*="classic-library"]')).toBeNull();
    await userEvent.click(screen.getByRole("checkbox", { name: "Select book-one" }));
    await userEvent.type(screen.getByRole("textbox", { name: "Search records…" }), "Science");
    await screen.findByText("1 records");
    expect(screen.getByTestId("location").textContent).toContain("books=");
    await userEvent.selectOptions(screen.getByRole("combobox", { name: "Class" }), "class-two");
    expect(await screen.findByText("This class has no books yet.")).toBeInTheDocument();
    expect(screen.getByRole("textbox", { name: "Search records…" })).toHaveValue("");
    expect(screen.queryByRole("button", { name: "Remove selected" })).not.toBeInTheDocument();
  });

  it("enforces capability visibility and still allows read-only details", async () => {
    authority.manage = false;
    mount();
    await openActions("book-one");
    expect(screen.queryByRole("button", { name: "Add book" })).not.toBeInTheDocument();
    expect(screen.queryByRole("checkbox")).not.toBeInTheDocument();
    expect(screen.queryByRole("menuitem", { name: "Edit" })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("menuitem", { name: "View details" }));
    expect(screen.getByRole("dialog")).toHaveTextContent("Mathematics");
    expect(
      within(screen.getByRole("dialog")).queryByRole("button", { name: "Edit" }),
    ).not.toBeInTheDocument();
  });

  it("creates an organization-scoped book and attaches it with the selected teacher", async () => {
    vi.mocked(createEducationBook).mockResolvedValue({ id: "new-book" } as ManagedEducationBook);
    mount();
    await userEvent.click(await screen.findByRole("button", { name: "Add book" }));
    const dialog = within(screen.getByRole("dialog"));
    await dialog.findByRole("option", { name: "Teacher One" });
    await userEvent.type(dialog.getByRole("textbox", { name: "Book title" }), "New subject");
    await userEvent.selectOptions(dialog.getByRole("combobox"), "teacher-one");
    await userEvent.click(dialog.getByRole("button", { name: "Save to shelf" }));
    expect(createEducationBook).toHaveBeenCalledWith(
      expect.objectContaining({
        titleFa: "New subject",
        organizationId: "org-one",
        state: "PUBLISHED",
      }),
    );
    expect(setClassBooks).toHaveBeenCalledWith(
      "class-one",
      expect.arrayContaining([{ bookId: "new-book", teacherId: "teacher-one" }]),
    );
  });

  it("edits only the API-allowed book fields", async () => {
    vi.mocked(updateEducationBook).mockResolvedValue({ id: "book-one" } as ManagedEducationBook);
    mount();
    await openActions("book-one");
    await userEvent.click(screen.getByRole("menuitem", { name: "Edit" }));
    const dialog = within(screen.getByRole("dialog"));
    await userEvent.clear(dialog.getByRole("textbox", { name: "Book title" }));
    await userEvent.type(dialog.getByRole("textbox", { name: "Book title" }), "Updated math");
    await userEvent.click(dialog.getByRole("button", { name: "Save to shelf" }));
    expect(updateEducationBook).toHaveBeenCalledWith("book-one", {
      titleFa: "Updated math",
      textbookCode: "M1",
    });
  });

  it("confirms bulk removal and preserves all unselected class books", async () => {
    mount();
    await screen.findByRole("table");
    await userEvent.click(screen.getByRole("checkbox", { name: "Select book-one" }));
    await userEvent.click(screen.getByRole("checkbox", { name: "Select book-two" }));
    await userEvent.click(screen.getByRole("button", { name: "Remove selected" }));
    expect(setClassBooks).not.toHaveBeenCalled();
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText("Mathematics")).toBeInTheDocument();
    expect(dialog.getByText("Science")).toBeInTheDocument();
    await userEvent.click(dialog.getByRole("button", { name: "Remove from class" }));
    expect(setClassBooks).toHaveBeenCalledWith("class-one", [
      { bookId: "book-three", teacherId: "teacher-one" },
    ]);
    expect(await screen.findByText("1 records")).toBeInTheDocument();
  });
  it("confirms catalog deletion and removes the book from the refreshed class list", async () => {
    vi.mocked(deleteEducationBook).mockImplementation(async (id) => {
      classroom = { ...classroom, books: classroom.books.filter((book) => book.bookId !== id) };
      return { id, state: "ARCHIVED" } as ManagedEducationBook;
    });
    mount();
    await openActions("book-one");
    await userEvent.click(screen.getByRole("menuitem", { name: "Delete book" }));
    const dialog = within(screen.getByRole("dialog"));
    expect(dialog.getByText(/every linked class/)).toBeInTheDocument();
    expect(deleteEducationBook).not.toHaveBeenCalled();
    await userEvent.click(dialog.getByRole("button", { name: "Delete from catalog and classes" }));
    expect(deleteEducationBook).toHaveBeenCalledWith("book-one");
    expect(setClassBooks).not.toHaveBeenCalled();
    expect(await screen.findByText("2 records")).toBeInTheDocument();
  });
  it("dismisses stale book dialogs when the active organization changes", async () => {
    const view = mount();
    await userEvent.click(await screen.findByRole("button", { name: "Add book" }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    authority.organizationId = "org-two";
    vi.mocked(listClasses).mockResolvedValue([]);
    view.rerenderWorkspace();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(listClasses).toHaveBeenCalledWith("org-two");
  });
});
