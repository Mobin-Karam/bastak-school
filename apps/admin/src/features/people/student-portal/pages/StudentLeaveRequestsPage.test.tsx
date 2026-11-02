import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { StudentLeaveRequestsPage } from "./StudentLeaveRequestsPage";

const { createStudentLeaveRequest } = vi.hoisted(() => ({
  createStudentLeaveRequest: vi.fn(),
}));

vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    capabilities: ["leave.read", "leave.manage"],
    context: { activeOrganization: { id: "org-1" }, availableOrganizations: [] },
  }),
}));
vi.mock("../../../analytics/dashboard/components/DashboardCalendar", () => ({
  DashboardCalendar: ({ value, onChange }: { value: string; onChange: (date: string) => void }) => (
    <button type="button" onClick={() => onChange("2026-10-12")}>
      تقویم اشتراکی: {value}
    </button>
  ),
}));
vi.mock("../../../../shared/ui/date-picker", () => ({
  DatePicker: ({ value, onChange }: { value: string; onChange: (date: string) => void }) => (
    <button type="button" onClick={() => onChange("2026-10-13")}>
      انتخاب پایان: {value}
    </button>
  ),
}));
vi.mock("../api/student-leave.api.ts", () => ({
  listStudentLeaveRequests: async () => [],
  createStudentLeaveRequest,
}));

describe("StudentLeaveRequestsPage", () => {
  it("uses a staged drawer flow and routes each request type without exposing reviewer selection", async () => {
    createStudentLeaveRequest.mockResolvedValue({ id: "request-1" });
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <LocaleProvider>
          <StudentLeaveRequestsPage />
        </LocaleProvider>
      </QueryClientProvider>,
    );

    expect(await screen.findByRole("heading", { name: "خروج و مرخصی" })).toBeVisible();
    fireEvent.click(screen.getByRole("button", { name: "درخواست جدید" }));
    expect(await screen.findByRole("button", { name: /تقویم اشتراکی/ })).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /درخواست مرخصی/ }));
    fireEvent.change(screen.getByPlaceholderText("مثلاً بیماری یا امور خانوادگی"), {
      target: { value: "مراجعه خانوادگی" },
    });
    fireEvent.click(screen.getByRole("button", { name: "بازبینی و ارسال" }));
    fireEvent.click(await screen.findByRole("button", { name: "ارسال برای مدیر مدرسه" }));

    await waitFor(() =>
      expect(createStudentLeaveRequest).toHaveBeenCalledWith(
        expect.objectContaining({
          organizationId: "org-1",
          leaveType: "LEAVE",
          reason: "مراجعه خانوادگی",
        }),
      ),
    );
  });
});
