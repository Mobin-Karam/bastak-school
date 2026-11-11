import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ModalProvider } from "../../../../shared/ui/modal";
import { ClassesPage } from "./ClassesPage";
import { getStudentProfile } from "../../../people/students/api/students.api";
import {
  getClassOptions,
  getClassBookGrades,
  listClasses,
  updateClass,
  setClassEnrollments,
  type EducationClass,
} from "../api/classes.api";

const authority = vi.hoisted(() => ({
  capabilities: [
    "classes.read",
    "classes.manage",
    "classes.roster.manage",
    "education.catalog.manage",
  ],
  role: "PRINCIPAL",
}));
vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    activeRole: authority.role,
    context: {
      activeOrganization: { id: "org-one" },
      availableOrganizations: [{ id: "org-one", name: "School One" }],
    },
    can: (capability: string) => authority.capabilities.includes(capability),
    hasRole: (role: string) => authority.role === role,
  }),
}));
vi.mock("../api/classes.api.ts", () => ({
  listClasses: vi.fn(),
  getClassOptions: vi.fn(),
  createClass: vi.fn(),
  updateClass: vi.fn(),
  deleteClass: vi.fn(),
  setClassBooks: vi.fn(),
  setClassEnrollments: vi.fn(),
  getClassBookGrades: vi.fn(),
  saveClassBookGrade: vi.fn(),
  deleteClassBookGrade: vi.fn(),
}));
vi.mock("../../../../shared/ui/notifications", () => ({ notify: vi.fn() }));
vi.mock("../../../people/students/api/students.api", () => ({ getStudentProfile: vi.fn() }));
vi.mock("../../../people/students/components/StudentOverview", () => ({
  StudentOverview: ({ student }: { student: { name: string } }) => (
    <div>Profile: {student.name}</div>
  ),
}));

const classroom = (id: string, overrides: Partial<EducationClass> = {}): EducationClass => ({
  id,
  organization: { id: "org-one", name: "School One" },
  code: id,
  name: id === "one" ? "Alpha" : "Beta",
  schoolYear: id === "one" ? "1405-1406" : "1404-1405",
  gradeId: null,
  educationTypeId: null,
  trackId: null,
  capacity: 35,
  status: "ACTIVE",
  description: "",
  advisor: null,
  books: [],
  students: [],
  enrollmentCount: 0,
  ...overrides,
});
let rows: EducationClass[];
function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{location.search}</output>;
}
function mount(initialEntry = "/admin/classes") {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          <ModalProvider>
            <ClassesPage />
            <LocationProbe />
          </ModalProvider>
        </MemoryRouter>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
  localStorage.setItem("moshaver-admin-location", "international");
  authority.capabilities = [
    "classes.read",
    "classes.manage",
    "classes.roster.manage",
    "education.catalog.manage",
  ];
  authority.role = "PRINCIPAL";
  rows = [
    classroom("one"),
    classroom("two", {
      advisor: { id: "advisor", name: "Advisor" },
      books: [
        {
          id: "link",
          bookId: "book",
          title: "Math",
          code: "M",
          teacher: { id: "teacher", name: "Teacher" },
        },
      ],
    }),
  ];
  vi.mocked(listClasses)
    .mockReset()
    .mockImplementation(async () => rows);
  vi.mocked(getClassOptions)
    .mockReset()
    .mockImplementation(async (id) => ({
      classroom: rows.find((row) => row.id === id)!,
      books: [],
      teachers: [],
      advisors: [],
      eligibleStudents: [],
    }));
  vi.mocked(getClassBookGrades)
    .mockReset()
    .mockResolvedValue({
      classBookId: "link",
      className: "Beta",
      bookTitle: "Math",
      teacher: { id: "teacher", name: "Teacher", username: "teacher" },
      students: [{ id: "student", name: "Student" }],
      sessions: [
        {
          id: "session",
          title: "Quiz",
          heldOn: "2026-11-11",
          description: "",
          grades: [
            {
              id: "grade",
              studentId: "student",
              score: 16,
              note: "",
              principalEdited: true,
              principalEditedAt: "2026-11-11",
              updatedAt: "2026-11-11",
            },
          ],
        },
      ],
    });
  vi.mocked(getStudentProfile)
    .mockReset()
    .mockResolvedValue({ id: "student", name: "Sara" } as Awaited<
      ReturnType<typeof getStudentProfile>
    >);
  vi.mocked(updateClass)
    .mockReset()
    .mockImplementation(async (id, change) => {
      rows = rows.map((row) => (row.id === id ? ({ ...row, ...change } as EducationClass) : row));
      return rows.find((row) => row.id === id)!;
    });
  vi.mocked(setClassEnrollments)
    .mockReset()
    .mockImplementation(async (id) => rows.find((row) => row.id === id)!);
});
afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("classes workspace", () => {
  it("lets a principal find classes by name, year and status and see setup counts", async () => {
    const user = userEvent.setup();
    mount();
    expect(await screen.findByRole("button", { name: /No teacher/ })).toBeVisible();
    await user.type(screen.getByRole("searchbox", { name: /Search name/ }), "Alpha");
    expect(screen.getByRole("button", { name: /Alpha/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Beta/ })).not.toBeInTheDocument();
    await user.clear(screen.getByRole("searchbox", { name: /Search name/ }));
    await user.selectOptions(screen.getByRole("combobox", { name: "School year" }), "1404-1405");
    expect(screen.getByRole("button", { name: /Beta/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Alpha/ })).not.toBeInTheDocument();
  });

  it("keeps read-only class details available without mutation actions", async () => {
    authority.capabilities = ["classes.read"];
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole("button", { name: /Alpha/ }));
    expect(screen.getByText("Alpha", { selector: "h2" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Manage books" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit class" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Manage students" })).not.toBeInTheDocument();
  });

  it("opens the teacher and book grade drawer for REM with read-only grades", async () => {
    authority.role = "RELIGIOUS_EDUCATION_MANAGER";
    authority.capabilities = ["classes.read", "class_grades.read"];
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole("button", { name: /Beta/ }));
    await user.click(screen.getByRole("button", { name: /Books and teachers/ }));
    await user.click(screen.getByRole("button", { name: "Teacher · Math" }));
    const drawer = await screen.findByRole("dialog", { name: "Teacher" });
    expect(within(drawer).getByText("Student")).toBeVisible();
    expect(within(drawer).getByText("16 / 20")).toBeVisible();
    expect(within(drawer).getByText("Edited by principal")).toBeVisible();
    expect(within(drawer).queryByRole("spinbutton")).not.toBeInTheDocument();
    await user.click(within(drawer).getByRole("button", { name: "Back to books" }));
    expect(
      within(screen.getByRole("dialog", { name: "Books and teachers" })).getByRole("button", {
        name: "Teacher · Math",
      }),
    ).toBeVisible();
  });

  it("opens the selected class in a mobile detail sheet", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      rows = [
        classroom("one", {
          students: [
            {
              id: "student",
              name: "Sara",
              grade: "12",
              major: "Science",
              phoneNumber: "09123456789",
            },
          ],
        }),
      ];
      const user = userEvent.setup();
      mount();
      await user.click(await screen.findByRole("button", { name: /Alpha/ }));
      expect(await screen.findByRole("dialog", { name: "Alpha" })).toBeVisible();
      await user.click(screen.getByRole("button", { name: /Class students/ }));
      const roster = await screen.findByRole("dialog", { name: "Class students" });
      expect(within(roster).getByText("Sara")).toBeVisible();
      expect(within(roster).getByRole("link", { name: /Sara: 09123456789/ })).toHaveAttribute(
        "href",
        "tel:09123456789",
      );
      await user.click(within(roster).getByRole("button", { name: "Close" }));
      expect(await screen.findByRole("dialog", { name: "Alpha" })).toBeVisible();
    } finally {
      Object.defineProperty(window, "innerWidth", { configurable: true, value: originalWidth });
    }
  });

  it("renders the principal filters and actions in Persian", async () => {
    localStorage.setItem("moshaver-admin-location", "iran");
    const user = userEvent.setup();
    mount();
    expect(await screen.findByRole("searchbox", { name: /جست‌وجوی نام/ })).toBeVisible();
    await user.click(screen.getByRole("button", { name: /Alpha/ }));
    expect(screen.getByRole("button", { name: "بایگانی کلاس" })).toBeVisible();
  });

  it("requires catalog management for class books even when class management is granted", async () => {
    authority.capabilities = ["classes.read", "classes.manage"];
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole("button", { name: /Alpha/ }));
    expect(screen.getByRole("button", { name: "Edit class" })).toBeVisible();
    expect(screen.queryByRole("button", { name: "Manage books" })).not.toBeInTheDocument();
  });

  it("sends only update fields when editing a class and keeps the dialog open on failure", async () => {
    const user = userEvent.setup();
    vi.mocked(updateClass).mockRejectedValueOnce(new Error("Could not update class"));
    mount();
    await user.click(await screen.findByRole("button", { name: /Alpha/ }));
    await user.click(screen.getByRole("button", { name: "Edit class" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit class" });
    await user.clear(within(dialog).getByRole("textbox", { name: "Class name" }));
    await user.type(within(dialog).getByRole("textbox", { name: "Class name" }), "Alpha revised");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(updateClass).toHaveBeenCalledWith("one", { name: "Alpha revised" });
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Could not update class");
    expect(within(dialog).getByRole("textbox", { name: "Class name" })).toHaveValue(
      "Alpha revised",
    );
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(await screen.findByRole("heading", { name: "Alpha revised" })).toBeVisible();
  });

  it("edits a legacy class without resending its old school year", async () => {
    rows = [classroom("one", { schoolYear: "1404-1405" })];
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole("button", { name: /Alpha/ }));
    await user.click(screen.getByRole("button", { name: "Edit class" }));
    const dialog = await screen.findByRole("dialog", { name: "Edit class" });
    expect(within(dialog).getByRole("button", { name: "1404–1405" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.clear(within(dialog).getByRole("textbox", { name: "Class name" }));
    await user.type(within(dialog).getByRole("textbox", { name: "Class name" }), "Legacy revised");
    await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
    expect(updateClass).toHaveBeenCalledWith("one", { name: "Legacy revised" });
  });

  it("archives and restores through the existing update endpoint", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole("button", { name: /Alpha/ }));
    await user.click(screen.getByRole("button", { name: "Archive class" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Archive class" }),
    );
    expect(updateClass).toHaveBeenCalledWith("one", { status: "ARCHIVED" });
    expect(await screen.findByRole("button", { name: "Archived" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await user.click(await screen.findByRole("button", { name: "Restore class" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Restore class" }),
    );
    expect(updateClass).toHaveBeenCalledWith("one", { status: "ACTIVE" });
  });

  it("keeps the roster editor open after a save failure and allows retry", async () => {
    const user = userEvent.setup();
    vi.mocked(setClassEnrollments).mockRejectedValueOnce(new Error("Save failed"));
    mount();
    await user.click(await screen.findByRole("button", { name: /Alpha/ }));
    await user.click(await screen.findByRole("button", { name: "Manage students" }));
    const dialog = await screen.findByRole("dialog");
    await user.click(within(dialog).getByRole("button", { name: "Save roster" }));
    expect(await within(dialog).findByRole("alert")).toHaveTextContent("Save failed");
    await user.click(within(dialog).getByRole("button", { name: "Save roster" }));
    expect(setClassEnrollments).toHaveBeenCalledTimes(2);
  });

  it("filters classes needing attention and keeps selection in the URL", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole("button", { name: /No teacher/ }));
    expect(screen.getByRole("button", { name: /Alpha/ })).toBeVisible();
    expect(screen.queryByRole("button", { name: /Beta/ })).not.toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: /Alpha/ }));
    expect(screen.getByTestId("location")).toHaveTextContent("classId=one");
  });

  it("loads a linked class without requesting edit options for read-only users", async () => {
    const user = userEvent.setup();
    authority.capabilities = ["classes.read", "students.read"];
    rows = [
      classroom("one", {
        students: [{ id: "student", name: "Sara", grade: "12", major: "Science" }],
      }),
    ];
    mount("/admin/classes?classId=one");
    await user.click(await screen.findByRole("button", { name: /Student profiles/ }));
    const roster = await screen.findByRole("dialog", { name: "Class students" });
    await user.click(within(roster).getByRole("button", { name: "Sara" }));
    expect(await within(roster).findByText("Profile: Sara")).toBeVisible();
    expect(getStudentProfile).toHaveBeenCalledWith("student");
    expect(screen.getByTestId("location")).not.toHaveTextContent("/students");
    expect(within(roster).getByRole("button", { name: /Back to students/ })).toHaveFocus();
    await user.click(within(roster).getByRole("button", { name: /Back to students/ }));
    expect(within(roster).getByRole("button", { name: "Sara" })).toHaveFocus();
    expect(getClassOptions).not.toHaveBeenCalled();
  });
});
