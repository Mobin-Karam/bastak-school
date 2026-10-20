import type { Meta, StoryObj } from "@storybook/react-vite";

import { AchievementsComingSoonPage } from "./AchievementsComingSoonPage";

const meta = { title: "Pages/Student/Achievements coming soon", component: AchievementsComingSoonPage, tags: ["autodocs"] } satisfies Meta<typeof AchievementsComingSoonPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
