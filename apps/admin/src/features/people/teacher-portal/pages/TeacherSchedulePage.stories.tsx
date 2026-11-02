import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  StorybookAuthProvider,
  storybookOrganization,
} from "../../../../../.storybook/fixtures/auth";
import type { TeacherWeekAttendanceSummary } from "../../../student-life/attendance/public";
import { TeacherSchedulePage } from "./TeacherSchedulePage";

const meta = {
  title: "Pages/Teacher/Weekly schedule",
  component: TeacherSchedulePage,
  decorators: [
    (Story) => (
      <StorybookAuthProvider role="TEACHER">
        <Story />
      </StorybookAuthProvider>
    ),
  ],
  tags: ["autodocs"],
} satisfies Meta<typeof TeacherSchedulePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    weekOfDate: "2026-10-10",
    now: new Date("2026-10-11T05:30:00.000Z"),
    entries: [
      {
        id: "schedule-1",
        title: "فقه و اصول · حضور ثبت‌شده",
        weekday: 1,
        startTime: "08:00",
        endTime: "09:30",
        room: "کلاس ۲",
        status: "ACTIVE",
        organization: storybookOrganization,
        classroom: { id: "class-8", name: "هشتم الف" },
      },
      {
        id: "schedule-2",
        title: "تفسیر قرآن · حضور ثبت‌نشده",
        weekday: 0,
        startTime: "08:00",
        endTime: "09:30",
        room: "کلاس ۲",
        status: "ACTIVE",
        organization: storybookOrganization,
        classroom: { id: "class-8", name: "هشتم الف" },
      },
      {
        id: "schedule-3",
        title: "قرائت قرآن · جلسه آینده",
        weekday: 3,
        startTime: "10:00",
        endTime: "11:30",
        room: "کتابخانه",
        status: "ACTIVE",
        organization: storybookOrganization,
        classroom: { id: "class-9", name: "نهم ب" },
      },
    ],
    attendanceSummaries: [
      {
        entryId: "schedule-1",
        date: "2026-10-11",
        attendanceRecorded: true,
        rosterCount: 22,
        unmarkedCount: 3,
        pastUnmarkedCount: 2,
        mostRecentUnmarkedDate: "2026-10-04",
      },
      {
        entryId: "schedule-2",
        date: "2026-10-10",
        attendanceRecorded: false,
        rosterCount: 18,
        unmarkedCount: 18,
        pastUnmarkedCount: 0,
        mostRecentUnmarkedDate: null,
      },
      {
        entryId: "schedule-3",
        date: "2026-10-13",
        attendanceRecorded: false,
        rosterCount: 24,
        unmarkedCount: 24,
        pastUnmarkedCount: 0,
        mostRecentUnmarkedDate: null,
      },
    ] satisfies TeacherWeekAttendanceSummary[],
  },
};

export const Empty: Story = {
  args: { entries: [], attendanceSummaries: [], weekOfDate: "2026-10-10" },
};
