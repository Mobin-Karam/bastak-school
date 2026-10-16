import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { toast } from "sonner";
import { ThemeProvider } from "../../../shared/theme/theme";
import { LocaleProvider } from "../../../shared/ui/locale";
import { AppToaster } from "../../../shared/ui/notifications";
import { DormitoryPage } from "./DormitoryPage";

const {
  listDormRoomsMock,
  createDormRoomMock,
  listDormAssignmentsMock,
  setDormAssignmentsMock,
  findDormitoryStudentsMock,
  sendDormitoryAnnouncementMock,
  listRelationshipStudentsMock,
} = vi.hoisted(() => ({
  listDormRoomsMock: vi.fn(),
  createDormRoomMock: vi.fn(),
  listDormAssignmentsMock: vi.fn(),
  setDormAssignmentsMock: vi.fn(),
  findDormitoryStudentsMock: vi.fn(),
  sendDormitoryAnnouncementMock: vi.fn(),
  listRelationshipStudentsMock: vi.fn(),
}));

vi.mock("../api/dormitory.api", () => ({
  listDormRooms: listDormRoomsMock,
  createDormRoom: createDormRoomMock,
  listDormAssignments: listDormAssignmentsMock,
  setDormAssignments: setDormAssignmentsMock,
  findDormitoryStudents: findDormitoryStudentsMock,
  sendDormitoryAnnouncement: sendDormitoryAnnouncementMock,
}));

vi.mock("../../access/api/access.api", () => ({
  listRelationshipStudents: listRelationshipStudentsMock,
}));

vi.mock("../../auth", () => ({
  useAuth: () => ({
    can: () => true,
    context: { activeOrganization: { id: "org-1", name: "S1" } },
  }),
}));

function renderPage() {
  return render(
    <ThemeProvider>
      <LocaleProvider>
        <DormitoryPage />
        <AppToaster />
      </LocaleProvider>
    </ThemeProvider>,
  );
}
const room = {
  id: "room-1",
  organizationId: "org-1",
  code: "A1",
  name: "اتاق A1",
  building: "اصلی",
  floor: 1,
  capacity: 1,
  status: "ACTIVE",
  studentCount: 0,
};

describe("DormitoryPage", () => {
  afterEach(() => {
    toast.dismiss();
    cleanup();
  });
  beforeEach(() => {
    vi.clearAllMocks();
    listDormRoomsMock.mockResolvedValue([]);
    listDormAssignmentsMock.mockResolvedValue([]);
    listRelationshipStudentsMock.mockResolvedValue([]);
    findDormitoryStudentsMock.mockResolvedValue([]);
    sendDormitoryAnnouncementMock.mockResolvedValue({ delivered: 0 });
    createDormRoomMock.mockResolvedValue({
      id: "room-1",
      organizationId: "org-1",
      code: "A1",
      name: "اتاق A1",
      capacity: 12,
      status: "ACTIVE",
      studentCount: 0,
    });
    setDormAssignmentsMock.mockResolvedValue({ roomId: "room-1", count: 0 });
  });

  it("renders the dormitory management layout", async () => {
    renderPage();

    await waitFor(() => {
      expect(screen.getByText("هنوز اتاقی ثبت نشده است")).toBeInTheDocument();
    });

    expect(screen.getByText("هنوز اتاقی ثبت نشده است")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ایجاد اولین اتاق/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ایجاد اتاق جدید" })).toBeInTheDocument();
  });
  it("warns when room details are incomplete without creating a room", async () => {
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "ایجاد اولین اتاق" }));
    fireEvent.click(screen.getByRole("button", { name: "ایجاد اتاق" }));
    expect(await screen.findByText("اطلاعات اتاق را کامل کنید.")).toBeInTheDocument();
    expect(createDormRoomMock).not.toHaveBeenCalled();
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("preserves resident selections when saving fails", async () => {
    listDormRoomsMock.mockResolvedValue([room]);
    listRelationshipStudentsMock.mockResolvedValue([{ id: "student-1", name: "علی" }]);
    setDormAssignmentsMock.mockRejectedValueOnce(new Error("Offline"));
    renderPage();
    const checkbox = await screen.findByRole("checkbox", { name: "تخصیص علی" });
    fireEvent.click(checkbox);
    fireEvent.click(screen.getByRole("button", { name: "ذخیره اعضای اتاق" }));
    await screen.findByText("ذخیره اعضا انجام نشد.");
    expect(checkbox).toBeChecked();
    expect(setDormAssignmentsMock).toHaveBeenCalledWith("room-1", ["student-1"]);
    expect(await screen.findByRole("button", { name: "ذخیره اعضای اتاق" })).toBeEnabled();
  });

  it("blocks saving incomplete resident data and allows retry", async () => {
    listDormRoomsMock.mockResolvedValue([room]);
    listDormAssignmentsMock.mockRejectedValueOnce(new Error("Offline"));
    renderPage();
    await screen.findAllByText("اطلاعات ساکنان دریافت نشد.");
    expect(screen.getByRole("button", { name: "ذخیره اعضای اتاق" })).toBeDisabled();
    expect(setDormAssignmentsMock).not.toHaveBeenCalled();
    fireEvent.click(screen.getAllByRole("button", { name: "تلاش دوباره" })[0]);
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "ذخیره اعضای اتاق" })).toBeDisabled(),
    );
    expect(listDormAssignmentsMock).toHaveBeenCalledTimes(2);
  });

  it("shows capacity, narrows residents by search, and lets staff discard unsaved changes", async () => {
    listDormRoomsMock.mockResolvedValue([room]);
    listRelationshipStudentsMock.mockResolvedValue([
      { id: "s1", name: "علی احمدی" },
      { id: "s2", name: "حسین کریمی" },
    ]);
    renderPage();
    expect(await screen.findByLabelText("خلاصه ظرفیت خوابگاه")).toBeInTheDocument();
    fireEvent.change(screen.getByPlaceholderText("نام طلبه"), { target: { value: "حسین" } });
    expect(screen.getByRole("checkbox", { name: "تخصیص حسین کریمی" })).toBeInTheDocument();
    expect(screen.queryByRole("checkbox", { name: "تخصیص علی احمدی" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: "تخصیص حسین کریمی" }));
    expect(screen.getByRole("status")).toHaveTextContent("تغییرات ذخیره نشده");
    expect(screen.getByRole("button", { name: "بازگردانی تغییرات" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "بازگردانی تغییرات" }));
    expect(screen.getByRole("button", { name: "ذخیره اعضای اتاق" })).toBeDisabled();
  });

  it("warns instead of overfilling the room", async () => {
    listDormRoomsMock.mockResolvedValue([room]);
    listRelationshipStudentsMock.mockResolvedValue([
      { id: "s1", name: "علی" },
      { id: "s2", name: "رضا" },
    ]);
    renderPage();
    fireEvent.click(await screen.findByRole("checkbox", { name: "تخصیص علی" }));
    fireEvent.click(screen.getByRole("checkbox", { name: "تخصیص رضا" }));
    await screen.findByText("ظرفیت اتاق کامل است.");
    expect(screen.getByRole("checkbox", { name: "تخصیص رضا" })).not.toBeChecked();
  });
  it("keeps room details available after a failed create", async () => {
    createDormRoomMock.mockRejectedValueOnce(new Error("Duplicate code"));
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "ایجاد اولین اتاق" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText(/کد اتاق/), { target: { value: "A1" } });
    fireEvent.change(dialog.getByLabelText(/نام اتاق/), { target: { value: "اتاق تازه" } });
    fireEvent.click(dialog.getByRole("button", { name: "ایجاد اتاق" }));
    await screen.findByText("ایجاد اتاق انجام نشد.");
    expect(dialog.getByLabelText(/کد اتاق/)).toHaveValue("A1");
    expect(dialog.getByLabelText(/نام اتاق/)).toHaveValue("اتاق تازه");
    expect(dialog.getByRole("button", { name: "ایجاد اتاق" })).toBeEnabled();
  });

  it("keeps an undelivered announcement and shows a warning", async () => {
    listDormRoomsMock.mockResolvedValue([room]);
    renderPage();
    fireEvent.click(await screen.findByRole("button", { name: "ارسال اعلان" }));
    const dialog = within(screen.getByRole("dialog"));
    fireEvent.change(dialog.getByLabelText(/عنوان/), { target: { value: "یادآوری" } });
    fireEvent.change(dialog.getByLabelText(/متن اعلان/), { target: { value: "پیام خوابگاه" } });
    fireEvent.click(dialog.getByRole("button", { name: "ارسال اعلان" }));
    await screen.findByText("گیرنده‌ای پیدا نشد.");
    await waitFor(() =>
      expect(document.querySelector("[data-sonner-toast]")).toHaveAttribute("data-type", "warning"),
    );
    expect(dialog.getByLabelText(/متن اعلان/)).toHaveValue("پیام خوابگاه");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
