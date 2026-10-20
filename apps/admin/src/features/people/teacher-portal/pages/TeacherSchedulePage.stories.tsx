import type { Meta, StoryObj } from "@storybook/react-vite";

import { StorybookAuthProvider, storybookOrganization } from "../../../../../.storybook/fixtures/auth";
import { TeacherSchedulePage } from "./TeacherSchedulePage";

const meta = {
  title: "Pages/Teacher/Weekly schedule",
  component: TeacherSchedulePage,
  decorators: [(Story) => <StorybookAuthProvider role="TEACHER"><Story /></StorybookAuthProvider>],
  tags: ["autodocs"],
} satisfies Meta<typeof TeacherSchedulePage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Populated: Story = {
  args: {
    entries: [
      { id: "schedule-1", title: "فقه و اصول", weekday: 1, startTime: "۰۸:۰۰", endTime: "۰۹:۳۰", room: "کلاس ۲", status: "ACTIVE", organization: storybookOrganization, classroom: { id: "class-8", name: "هشتم الف" } },
      { id: "schedule-2", title: "تفسیر قرآن", weekday: 3, startTime: "۱۰:۰۰", endTime: "۱۱:۳۰", room: "کتابخانه", status: "ACTIVE", organization: storybookOrganization, classroom: { id: "class-9", name: "نهم ب" } },
    ],
  },
};

export const Empty: Story = { args: { entries: [] } };
