import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen, within, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import { AttendanceReviewQueue } from "./AttendanceReviewQueue";
const mocks = vi.hoisted(() => ({ list: vi.fn(), review: vi.fn() }));
vi.mock("../api/attendance.api.ts", () => ({
  listAttendanceAbsenceReviews: mocks.list,
  reviewAttendanceAbsence: mocks.review,
}));
vi.mock("../../../identity/auth", () => ({
  useAuth: () => ({
    user: { id: "reviewer" },
    activeRole: "PRINCIPAL",
    context: { activeOrganization: { id: "org" } },
    can: () => true,
  }),
}));
vi.mock("../../../../shared/api/api", () => ({ api: { openEvents: () => ({ close: vi.fn() }) } }));
vi.mock("../../../../shared/ui/responsive-drawer", () => ({
  ResponsiveDrawer: ({ open, title, description, children, onOpenChange }: any) =>
    open ? (
      <div role="dialog" aria-label={String(title)}>
        <h2>{title}</h2>
        <p>{description}</p>
        <button type="button" aria-label="بستن" onClick={() => onOpenChange(false)}>
          بستن
        </button>
        {children}
      </div>
    ) : null,
}));
const record = {
  id: "record",
  studentName: "علی",
  teacherName: "استاد",
  sessionDate: "2026-10-11T08:00:00Z",
  reason: "بیماری",
  reviewStatus: "pending",
};
beforeEach(() => {
  vi.clearAllMocks();
  vi.stubGlobal(
    "matchMedia",
    vi.fn(() => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() })),
  );
  mocks.list.mockResolvedValue([record]);
  mocks.review.mockResolvedValue({ ...record, reviewStatus: "approved" });
});
afterEach(cleanup);
function mount(initialRecordId?: string) {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({
          defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
        })
      }
    >
      <AttendanceReviewQueue initialRecordId={initialRecordId} />
    </QueryClientProvider>,
  );
}
describe("guided absence decisions", () => {
  it("inspects and confirms a decision before issuing a scoped request", async () => {
    mount();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "بررسی" }));
    const dialog = screen.getByRole("dialog");
    expect(within(dialog).getByText("بیماری")).toBeInTheDocument();
    await user.type(within(dialog).getByRole("textbox"), "مدرک بررسی شد");
    await user.click(within(dialog).getByRole("button", { name: "پذیرش دلیل" }));
    expect(mocks.review).not.toHaveBeenCalled();
    await user.click(within(dialog).getByRole("button", { name: "تأیید و ثبت تصمیم" }));
    await waitFor(() =>
      expect(mocks.review).toHaveBeenCalledWith("record", {
        decision: "approved",
        note: "مدرک بررسی شد",
      }),
    );
    expect(mocks.list).toHaveBeenCalledWith("org");
  });
  it("keeps the decision and note available for retry after a failure", async () => {
    mocks.review.mockRejectedValueOnce(new Error("connection failed"));
    mount();
    const user = userEvent.setup();
    await user.click(await screen.findByRole("button", { name: "بررسی" }));
    await user.type(screen.getByRole("textbox"), "بررسی دلیل");
    await user.click(screen.getByRole("button", { name: "رد دلیل" }));
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت تصمیم" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("connection failed");
    await user.click(screen.getByRole("button", { name: "تأیید و ثبت تصمیم" }));
    await waitFor(() => expect(mocks.review).toHaveBeenCalledTimes(2));
    expect(mocks.review.mock.calls[1]).toEqual(mocks.review.mock.calls[0]);
  });

  it("opens the review named by an attendance notification URL", async () => {
    mount("record");
    const dialog = await screen.findByRole("dialog");
    expect(within(dialog).getByText("بیماری")).toBeInTheDocument();
    await userEvent.setup().click(within(dialog).getByRole("button", { name: "بستن" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });
});
