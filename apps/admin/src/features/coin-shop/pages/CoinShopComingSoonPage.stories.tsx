import type { Meta, StoryObj } from "@storybook/react-vite";

import { CoinShopComingSoonPage } from "./CoinShopComingSoonPage";

const meta = { title: "Pages/Student/Coin shop coming soon", component: CoinShopComingSoonPage, tags: ["autodocs"] } satisfies Meta<typeof CoinShopComingSoonPage>;
export default meta;
type Story = StoryObj<typeof meta>;
export const Default: Story = {};
