import { Meta, StoryObj } from "@storybook/react";
import { RegistrationDashboardPage } from "./RegistrationDashboardPage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

const queryClient = new QueryClient();

const meta = {
  title: "Features/Registration/Dashboard",
  component: RegistrationDashboardPage,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter>
          <Story />
        </MemoryRouter>
      </QueryClientProvider>
    ),
  ],
} satisfies Meta<typeof RegistrationDashboardPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};

export const Loading: Story = {
  render: () => <RegistrationDashboardPage />,
};

export const Completed: Story = {
  render: () => <RegistrationDashboardPage />,
};
