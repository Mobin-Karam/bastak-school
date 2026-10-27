import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AuthProvider } from "../../features/identity/auth";
import { NotificationProvider } from "../../features/communications/notifications";
import { PWAProvider } from "../../features/platform/pwa";

import { ThemeProvider } from "../../shared/theme/theme";
import { LocaleProvider } from "../../shared/ui/locale";
import { ModalProvider } from "../../shared/ui/modal";
import { AppToaster } from "../../shared/ui/notifications";
import { FloatingIslandProvider } from "../../shared/ui/floating-island";

import { queryClient } from "./query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <AuthProvider>
            <ModalProvider>
              <NotificationProvider>
                <FloatingIslandProvider>{children}</FloatingIslandProvider>
                <PWAProvider />
              </NotificationProvider>

              <AppToaster />
            </ModalProvider>
          </AuthProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
