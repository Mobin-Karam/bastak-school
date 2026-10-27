import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { TeachersPage } from "./TeachersPage";
import { listAcademicTeachers } from "../api/academic.api";
import { listClasses } from "../api/classes.api";
import { listSchedule } from "../../schedule/api/schedule.api";

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    context: { activeOrganization: { id: "school-one" } },
    can: () => true,
  }),
}));
vi.mock("../api/academic.api", () => ({ listAcademicTeachers: vi.fn() }));
vi.mock("../api/classes.api", () => ({ listClasses: vi.fn() }));
vi.mock("../../schedule/api/schedule.api", () => ({ listSchedule: vi.fn() }));
vi.mock("../../../../shared/ui/responsive-drawer", () => ({
  ResponsiveDrawer: ({
    open,
    title,
    children,
  }: {
    open: boolean;
    title: string;
    children: React.ReactNode;
  }) =>
    open ? (
      <div role="dialog" aria-label={title}>
        {children}
      </div>
    ) : null,
}));

function mount() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <LocaleProvider>
        <TeachersPage />
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

describe("TeachersPage", () => {
  beforeEach(() => {
    vi.mocked(listAcademicTeachers).mockResolvedValue({
      items: [
        {
          id: "teacher-one",
          firstName: "زهرا",
          lastName: "محمدی",
          username: "teacher.one",
          membershipId: "membership-one",
          roles: ["TEACHER", "SCHOOL_SUPERVISOR"],
        },
      ],
      total: 1,
      offset: 0,
      limit: 100,
    });
    vi.mocked(listClasses).mockResolvedValue([
      {
        id: "class-one",
        organization: { id: "school-one", name: "مدرسه" },
        code: "one",
        name: "کلاس اول",
        schoolYear: "1405-1406",
        gradeId: null,
        educationTypeId: null,
        trackId: null,
        capacity: 30,
        status: "ACTIVE",
        description: "",
        advisor: null,
        enrollmentCount: 0,
        students: [],
        books: [
          {
            id: "book-link-one",
            bookId: "book-one",
            code: "math",
            title: "ریاضی",
            teacher: { id: "teacher-one", name: "زهرا محمدی" },
          },
        ],
      },
    ]);
    vi.mocked(listSchedule).mockResolvedValue([
      {
        id: "schedule-one",
        title: "ریاضی",
        weekday: 0,
        startTime: "08:00",
        endTime: "09:30",
        room: "",
        status: "ACTIVE",
        organization: { id: "school-one", name: "مدرسه" },
        classroom: { id: "class-one", name: "کلاس اول" },
        teacher: {
          id: "teacher-one",
          username: "teacher.one",
          firstName: "زهرا",
          lastName: "محمدی",
        },
        classBook: null,
      },
    ]);
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it("lists every teacher-role holder and opens their profile drawer with multi-role context", async () => {
    mount();
    const table = await screen.findByRole("table");
    expect(within(table).getByText("زهرا محمدی")).toBeInTheDocument();
    expect(screen.getAllByText("دبیر").length).toBeGreaterThan(0);
    expect(screen.getAllByText("معاون آموزشی").length).toBeGreaterThan(0);

    fireEvent.click(within(table).getByText("زهرا محمدی").closest("tr")!);

    const drawer = await screen.findByRole("dialog", { name: "زهرا محمدی" });
    expect(within(drawer).getByText("ریاضی")).toBeInTheDocument();
    expect(within(drawer).getByText(/کلاس اول/)).toBeInTheDocument();
    expect(await within(drawer).findByText("۱")).toBeInTheDocument();
    expect(within(drawer).getByText(/۱٫۵ ساعت/)).toBeInTheDocument();
  });
});
