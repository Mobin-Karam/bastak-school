import React from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { LocaleProvider } from "./src/shared/ui/locale";
import { ModalProvider } from "./src/shared/ui/modal";
import { BookShelfPage } from "./src/features/education/pages/BookShelfPage";
import "./src/styles/globals.css";
createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <LocaleProvider><MemoryRouter initialEntries={["/?class=class-one"]}><ModalProvider>
      <main className="mx-auto min-h-screen max-w-6xl bg-[rgb(var(--surface-page))] p-4 md:p-8"><BookShelfPage /></main>
    </ModalProvider></MemoryRouter></LocaleProvider>
  </QueryClientProvider>
);
