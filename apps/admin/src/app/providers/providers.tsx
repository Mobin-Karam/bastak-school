import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { AuthProvider } from "../../features/identity/auth";
import { NotificationProvider } from "../../features/communications/notifications";
import { PWAProvider } from "../../features/platform/pwa";

import { ThemeProvider } from "../../shared/theme/theme";
import { LocaleProvider } from "../../shared/ui/locale";
import { ModalProvider } from "../../shared/ui/modal";
import { AppToaster } from "../../shared/ui/notifications";

import { queryClient } from "./query-client";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <ModalProvider>
            <AuthProvider>
              <NotificationProvider>
                {children}
                <PWAProvider />
              </NotificationProvider>
            </AuthProvider>

            <AppToaster />
          </ModalProvider>
        </LocaleProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
