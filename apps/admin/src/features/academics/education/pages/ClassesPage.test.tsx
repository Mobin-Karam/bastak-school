import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { ModalProvider } from "../../../../shared/ui/modal";
import { ClassesPage } from "./ClassesPage";
import {
  getClassOptions,
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
}));
vi.mock("../../../../shared/ui/notifications", () => ({ notify: vi.fn() }));

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
function mount() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <MemoryRouter>
          <ModalProvider>
            <ClassesPage />
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
    expect(await screen.findByText(/No teacher:/)).toBeVisible();
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

  it("opens the selected class in a mobile detail sheet", async () => {
    const originalWidth = window.innerWidth;
    Object.defineProperty(window, "innerWidth", { configurable: true, value: 390 });
    try {
      const user = userEvent.setup();
      mount();
      await user.click(await screen.findByRole("button", { name: /Alpha/ }));
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

  it("archives and restores through the existing update endpoint", async () => {
    const user = userEvent.setup();
    mount();
    await user.click(await screen.findByRole("button", { name: /Alpha/ }));
    await user.click(screen.getByRole("button", { name: "Archive class" }));
    await user.click(
      within(await screen.findByRole("dialog")).getByRole("button", { name: "Archive class" }),
    );
    expect(updateClass).toHaveBeenCalledWith("one", { status: "ARCHIVED" });
    expect(await screen.findByRole("combobox", { name: "Status" })).toHaveValue("ARCHIVED");
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
});
