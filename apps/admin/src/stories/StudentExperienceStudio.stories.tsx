import type { Meta, StoryObj } from "@storybook/react-vite";

import { componentCatalog } from "./component-catalog.generated";
import { ComponentWorkbench } from "./ComponentWorkbench.stories";

const studentSourceMarkers = [
  "features/people/student-portal/",
  "features/analytics/dashboard/components/Student",
  "features/achievements/",
  "features/coin-shop/",
  "features/student-life/attendance/components/Student",
  "features/student-life/attendance/pages/MyAttendancePage",
  "features/academics/schedule/pages/SchedulePage",
  "features/academics/education/pages/BookShelfPage",
  "features/communications/notifications/pages/NotificationsPage",
] as const;

const studentCatalog = componentCatalog.filter((entry) =>
  studentSourceMarkers.some((marker) => entry.sourcePath.includes(marker)),
);

const meta = {
  title: "Bastak School/Student experience studio",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Student-owned pages and components, rendered only with local Storybook fixtures. */
export const PagesAndComponents: Story = {
  render: () => (
    <ComponentWorkbench
      entries={studentCatalog}
      title="کارگاه تجربهٔ دانش‌آموز"
      description="همهٔ صفحه‌ها و اجزای مالک تجربهٔ دانش‌آموز در یک فهرست. داده‌ها و نشست نمونه هستند و هیچ API واقعی فراخوانی نمی‌شود."
      role="STUDENT"
      capabilities={["schedule.read", "attendance.self.read", "leave.read", "leave.manage"]}
    />
  ),
};
