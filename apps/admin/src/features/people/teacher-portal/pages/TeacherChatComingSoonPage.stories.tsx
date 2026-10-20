import type { Meta, StoryObj } from "@storybook/react-vite";

import { TeacherChatComingSoonPage } from "./TeacherChatComingSoonPage";

const meta = {
  title: "Pages/Teacher/Chat coming soon",
  component: TeacherChatComingSoonPage,
  tags: ["autodocs"],
} satisfies Meta<typeof TeacherChatComingSoonPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
