import type { Meta, StoryObj } from "@storybook/react-vite";

import { ManagementComingSoonPage } from "./ManagementComingSoonPage";

const meta = {
  title: "Pages/Management/Coming soon",
  component: ManagementComingSoonPage,
  tags: ["autodocs"],
} satisfies Meta<typeof ManagementComingSoonPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
