import type { Meta, StoryObj } from "@storybook/react-vite";

import { componentCatalog } from "./component-catalog.generated";
import { ComponentWorkbench } from "./ComponentWorkbench.stories";

const sharedUiCatalog = componentCatalog.filter((entry) =>
  entry.sourcePath.startsWith("shared/ui/"),
);

const meta = {
  title: "Bastak School/Shared UI studio",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Every exported shared UI module in one catalog. Use this as the starting
 * point for tokens, primitives, responsive controls, and RTL states.
 */
export const AllSharedUi: Story = {
  render: () => (
    <ComponentWorkbench
      entries={sharedUiCatalog}
      title="کارگاه رابط مشترک"
      description="همهٔ اجزای صادرشده از shared/ui در یک فهرست RTL. برای اجزای نیازمند props یا دادهٔ اختصاصی، نیاز fixture به‌صورت شفاف نمایش داده می‌شود."
    />
  ),
};
