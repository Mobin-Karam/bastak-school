import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { MyAttendancePage } from "./MyAttendancePage";
const mocks = vi.hoisted(() => ({ encouragement: vi.fn(), assignments: vi.fn(), pools: vi.fn() }));
vi.mock("../api/attendance-operations.api.ts", () => ({
  getAttendanceEncouragement: mocks.encouragement,
  getMyDormAssignments: mocks.assignments,
  getMyAttendancePools: mocks.pools,
}));
vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    user: { id: "student" },
    activeRole: "STUDENT",
    context: { activeOrganization: { id: "org" } },
  }),
}));
beforeEach(() => {
  mocks.encouragement.mockResolvedValue({
    totalSessions: 2,
    present: 1,
    absent: 1,
    late: 0,
    excused: 0,
    attendanceRate: 50,
    message: "برای حضور منظم‌تر برنامه‌ریزی کنید.",
  });
  mocks.assignments.mockResolvedValue([]);
  mocks.pools.mockResolvedValue([]);
});
afterEach(cleanup);
describe("student attendance summary privacy", () => {
  it("shows encouragement and aggregate counts without individual session records", async () => {
    render(
      <QueryClientProvider
        client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}
      >
        <LocaleProvider>
          <MyAttendancePage />
        </LocaleProvider>
      </QueryClientProvider>,
    );
    await screen.findByText("برای حضور منظم‌تر برنامه‌ریزی کنید.");
    expect(screen.getByText(/۵۰٪ حضور/)).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /جزئیات|پرونده/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("combobox")).not.toBeInTheDocument();
    expect(screen.queryByText("آخرین وضعیت‌ها")).not.toBeInTheDocument();
  });
});
