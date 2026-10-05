import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it } from "vitest";
import { DataTransferWorkspace } from "./data-transfer";
import { LocaleProvider } from "./locale";
import { ModalProvider } from "./modal";

function renderWorkspace() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <ModalProvider>
          <DataTransferWorkspace
            studentId="student-1"
            scope="all"
            title="انتقال کامل اطلاعات"
            description="ورود و خروج برنامه‌ها و آزمون‌ها"
            exportFrom="2026-08-01"
            exportTo="2026-08-31"
            showPlanReplacement
            showExamReplacement
            onImported={() => undefined}
          />
        </ModalProvider>
      </LocaleProvider>
    </QueryClientProvider>,
  );
}

afterEach(cleanup);

describe("data transfer workspace", () => {
  it("uses a direction-aware header accent and direction-neutral disclosure icon", () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    const { container } = renderWorkspace();

    expect(container.querySelector(".bg-gradient-to-r")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-chevron-down")).toBeInTheDocument();
    expect(container.querySelector("svg.lucide-chevron-left")).not.toBeInTheDocument();
    window.localStorage.removeItem("moshaver-admin-location");
  });

  it("keeps import controls unavailable for an export-only role", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <ModalProvider>
            <DataTransferWorkspace
              studentId="student-1"
              scope="plans"
              title="انتقال"
              description=""
              canImport={false}
              canCommit={false}
              canExport
              onImported={() => undefined}
            />
          </ModalProvider>
        </LocaleProvider>
      </QueryClientProvider>,
    );
    expect(screen.queryByRole("button", { name: /ورود اطلاعات/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /خروجی گرفتن/ })).toBeInTheDocument();
    expect(screen.getByText("دانلود خروجی Excel")).toBeInTheDocument();
    expect(screen.getByText("دانلود خروجی JSON")).toBeInTheDocument();
  });

  it("guides import and exposes manual JSON only on request", async () => {
    renderWorkspace();
    expect(screen.getByText("فایل را انتخاب کنید")).toBeInTheDocument();
    expect(screen.getByText("بررسی و رفع مشکل")).toBeInTheDocument();
    expect(screen.queryByLabelText("متن JSON")).not.toBeInTheDocument();

    await userEvent.click(screen.getByText("ورود دستی JSON"));
    expect(screen.getByLabelText("متن JSON")).toBeInTheDocument();
  });

  it("does not render commit actions for a preview-only role", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <ModalProvider>
            <DataTransferWorkspace
              studentId="student-1"
              scope="plans"
              title="انتقال"
              description=""
              canImport
              canCommit={false}
              canExport={false}
              onImported={() => undefined}
            />
          </ModalProvider>
        </LocaleProvider>
      </QueryClientProvider>,
    );

    expect(screen.queryByRole("button", { name: "ثبت به‌صورت پیش‌نویس" })).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "ثبت و انتشار برای دانش‌آموز" }),
    ).not.toBeInTheDocument();
  });

  it("keeps editable example downloads available before selecting a student", () => {
    const queryClient = new QueryClient();
    render(
      <QueryClientProvider client={queryClient}>
        <LocaleProvider>
          <ModalProvider>
            <DataTransferWorkspace
              studentId=""
              scope="plans"
              title="انتقال"
              description=""
              onImported={() => undefined}
            />
          </ModalProvider>
        </LocaleProvider>
      </QueryClientProvider>,
    );

    expect(screen.getByRole("button", { name: "انتخاب فایل" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "نمونه Excel" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "نمونه JSON" })).toBeEnabled();
  });

  it("keeps export in the same workspace with a readable date summary", async () => {
    renderWorkspace();
    await userEvent.click(screen.getByRole("button", { name: /خروجی گرفتن/ }));
    expect(screen.getByText("خروجی قابل بازیابی")).toBeInTheDocument();
    expect(screen.getByText("دانلود خروجی Excel")).toBeInTheDocument();
  });

  it("renders the complete import/export workflow in English", async () => {
    window.localStorage.setItem("moshaver-admin-location", "international");
    renderWorkspace();

    expect(screen.getByRole("button", { name: "Choose file" })).toBeInTheDocument();
    expect(screen.getByText("Review and resolve")).toBeInTheDocument();
    expect(screen.getByText("Choose how to save")).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Export" }));
    expect(screen.getByText("Prepare export")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Download Excel export" })).toBeInTheDocument();
    window.localStorage.removeItem("moshaver-admin-location");
  });
});
