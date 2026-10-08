import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { DormitoryPage } from "./DormitoryPage";

const { listDormRoomsMock, createDormRoomMock, listDormAssignmentsMock, setDormAssignmentsMock, findDormitoryStudentsMock, sendDormitoryAnnouncementMock, listRelationshipStudentsMock } = vi.hoisted(() => ({
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
    context: { activeOrganization: { id: "org-1", name: "S1" } },
  }),
}));

describe("DormitoryPage", () => {
  beforeEach(() => {
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
    render(<DormitoryPage />);

    await waitFor(() => {
      expect(screen.getByText("مدیریت اتاق‌های خوابگاه")).toBeInTheDocument();
    });

    expect(screen.getByText("هنوز اتاقی ثبت نشده است")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /ایجاد اولین اتاق/i }));
    expect(screen.getByRole("dialog")).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "ایجاد اتاق جدید" })).toBeInTheDocument();
  });
});
