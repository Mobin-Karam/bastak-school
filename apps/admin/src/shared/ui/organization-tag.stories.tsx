import type { Meta, StoryObj } from "@storybook/react-vite";

import { OrganizationTag } from "./organization-tag";

const meta = {
  title: "Shared/UI/Organization tag",
  component: OrganizationTag,
  tags: ["autodocs"],
} satisfies Meta<typeof OrganizationTag>;

export default meta;
type Story = StoryObj<typeof meta>;

export const ActiveSchool: Story = {
  args: {
    organization: { name: "مدرسه دینی سلطان العلماء بستک", type: "SCHOOL", status: "ACTIVE" },
  },
};

export const InactiveCompact: Story = {
  args: {
    organization: { name: "واحد آزمایشی", type: "INSTITUTION", status: "INACTIVE" },
    compact: true,
  },
};
