import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AdvisorInboxPanel } from "./AdvisorInboxPanel";
import { LocaleProvider } from "../../../shared/ui/locale";

const defaults = {
  mobilePanel: "inbox" as const,
  rows: [],
  students: [],
  studentId: "",
  loading: false,
  error: false,
  recoveryPendingId: "",
  issuePendingId: "",
  onStudentChange: vi.fn(),
  onRetry: vi.fn(),
  onRecovery: vi.fn().mockResolvedValue(true),
  onIssue: vi.fn().mockResolvedValue(true),
  canManageRecovery: true,
  canManageIssues: true,
};

describe("AdvisorInboxPanel", () => {
  it("uses the shared list empty state", () => {
    render(
      <LocaleProvider>
        <AdvisorInboxPanel {...defaults} />
      </LocaleProvider>,
    );

    expect(screen.getByRole("heading", { name: "صندوق پیگیری" })).toBeInTheDocument();
    expect(screen.getByText("مورد فعالی برای این دانش‌آموز وجود ندارد.")).toBeInTheDocument();
  });

  it("uses the shared list retry state", () => {
    render(
      <LocaleProvider>
        <AdvisorInboxPanel {...defaults} error />
      </LocaleProvider>,
    );

    expect(screen.getByRole("alert")).toHaveTextContent("صندوق پیگیری دریافت نشد.");
    expect(screen.getByRole("button", { name: /تلاش دوباره/ })).toBeInTheDocument();
  });
});
