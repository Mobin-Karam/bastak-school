import type { Meta, StoryObj } from "@storybook/react-vite";

import { ZaninBrand } from "./zanin-brand";

const meta = {
  title: "Bastak School/Brand",
  component: ZaninBrand,
  tags: ["autodocs"],
} satisfies Meta<typeof ZaninBrand>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithName: Story = { args: { showName: true, priority: true } };
export const MarkOnly: Story = { args: { showName: false } };
