import type { Meta, StoryObj } from "@storybook/react-vite";

import { StudentRegistrationComingSoonPage } from "./StudentRegistrationComingSoonPage";

const meta = { title: "Pages/Student/Registration coming soon", component: StudentRegistrationComingSoonPage, tags: ["autodocs"] } satisfies Meta<typeof StudentRegistrationComingSoonPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
