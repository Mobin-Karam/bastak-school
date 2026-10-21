import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";

import { SegmentedControl } from "./segmented-control";

const meta = {
  title: "Shared/UI/Segmented control",
  component: SegmentedControl,
  tags: ["autodocs"],
} satisfies Meta<typeof SegmentedControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Interactive: Story = {
  args: {
    value: "overview",
    onValueChange: () => undefined,
    ariaLabel: "نمای بخش",
    options: [
      { value: "overview", label: "نمای کلی" },
      { value: "students", label: "دانش‌آموزان" },
      { value: "reports", label: "گزارش‌ها", disabled: true },
    ],
  },
  render: function InteractiveStory() {
    const [value, setValue] = useState("overview");
    return (
      <SegmentedControl
        ariaLabel="نمای بخش"
        value={value}
        onValueChange={setValue}
        options={[
          { value: "overview", label: "نمای کلی" },
          { value: "students", label: "دانش‌آموزان" },
          { value: "reports", label: "گزارش‌ها", disabled: true },
        ]}
      />
    );
  },
};
