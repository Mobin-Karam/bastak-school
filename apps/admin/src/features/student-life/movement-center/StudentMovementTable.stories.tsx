import type { Meta, StoryObj } from "@storybook/react-vite";
import { fn } from "storybook/test";
import { StudentMovementTable } from "./StudentMovementTable";
import type { StudentMovement } from "./api/student-movements.api";

const items: StudentMovement[] = [
  {
    id: "leave:leave-1",
    kind: "leave",
    state: "review",
    leave: {
      id: "leave-1",
      studentId: "student-1",
      studentName: "علی احمدی",
      leaveType: "LEAVE",
      reviewerRole: "PRINCIPAL",
      startDate: "2026-11-02T07:00:00.000Z",
      endDate: "2026-11-02T12:00:00.000Z",
      reason: "مراجعهٔ پزشکی",
      note: "",
      includesLunch: false,
      includesDinner: false,
      exitPermissionId: null,
      status: "PENDING",
      createdAt: "2026-11-01T10:00:00.000Z",
    },
    exit: null,
  },
  {
    id: "exit:exit-1",
    kind: "exit",
    state: "outside",
    leave: null,
    exit: {
      id: "exit-1",
      organizationId: "school-1",
      organizationName: "مدرسه نمونه",
      studentId: "student-2",
      studentName: "حسین رضایی",
      destination: "درمانگاه",
      reason: "مراجعهٔ پزشکی",
      requestedDepartureAt: "2026-11-01T08:00:00.000Z",
      expectedReturnAt: "2026-11-01T11:00:00.000Z",
      actualDepartureAt: "2026-11-01T08:15:00.000Z",
      actualReturnAt: null,
      returnRequestedAt: null,
      returnRequestNote: "",
      returnVerifiedById: null,
      returnVerifiedAt: null,
      note: "",
      origin: "student_request",
      status: "APPROVED",
      approverId: "principal-1",
      reviewedAt: "2026-11-01T07:45:00.000Z",
      createdAt: "2026-11-01T07:30:00.000Z",
    },
  },
];

const meta = {
  title: "Admin/Student Life/Student Movement Table",
  component: StudentMovementTable,
  tags: ["autodocs"],
  args: {
    items,
    loading: false,
    error: false,
    busy: false,
    canManageLeave: true,
    canManageExit: true,
    canResolveMovement: true,
    preferenceKey: "storybook-student-movements",
    onRefresh: fn(),
    onOpenDetails: fn(),
    onAction: fn(),
  },
} satisfies Meta<typeof StudentMovementTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OperationalQueue: Story = { args: {} };

export const Empty: Story = {
  args: { canResolveMovement: true, items: [] },
};

export const Loading: Story = {
  args: { canResolveMovement: true, loading: true, items: [] },
};
