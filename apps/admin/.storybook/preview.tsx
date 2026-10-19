import type { Decorator, Preview } from "@storybook/react-vite";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";

import "../src/styles/globals.css";
import "sonner/dist/styles.css";
import { ThemeProvider } from "../src/shared/theme/theme";
import { LocaleProvider } from "../src/shared/ui/locale";
import { ModalProvider } from "../src/shared/ui/modal";

function AdminStoryProviders({ children }: { children: React.ReactNode }) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, refetchOnWindowFocus: false },
      mutations: { retry: false },
    },
  });

  return (
    <MemoryRouter>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <LocaleProvider>
            <ModalProvider>{children}</ModalProvider>
          </LocaleProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </MemoryRouter>
  );
}

const withAdminProviders: Decorator = (Story, context) => (
  <div dir={context.globals.direction === "ltr" ? "ltr" : "rtl"}>
    <AdminStoryProviders>
      <Story />
    </AdminStoryProviders>
  </div>
);

const preview: Preview = {
  decorators: [withAdminProviders],
  parameters: {
    a11y: {
      test: "error",
    },
    controls: { expanded: true },
    layout: "padded",
    backgrounds: { disable: true },
  },
  globalTypes: {
    direction: {
      description: "Document direction",
      defaultValue: "rtl",
      toolbar: {
        icon: "globe",
        items: [
          { value: "rtl", title: "فارسی (RTL)" },
          { value: "ltr", title: "English (LTR)" },
        ],
      },
    },
  },
};

export default preview;
