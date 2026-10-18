import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../shared/ui/locale";
import { PermissionDecisionModal } from "./PermissionRequestsPage";

const request = {
  id: "permission-1",
  studentName: "سارا احمدی",
  organizationName: "دبیرستان نمونه",
  kind: "خروج از خوابگاه",
  title: "خروج عصرگاهی",
  details: "برای مراجعه به پزشک درخواست ثبت شده است.",
  requestedFor: "2026-10-03T17:00:00.000Z",
  status: "PENDING" as const,
  supervisorNote: "",
  createdAt: "2026-10-03T10:00:00.000Z",
};

describe("PermissionDecisionModal", () => {
  it("explains the outcome, identifies the affected student, and sends an optional approval note", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn(async () => undefined);
    render(
      <PermissionDecisionModal
        request={request}
        decision="APPROVED"
        busy={false}
        onCancel={vi.fn()}
        onSubmit={onSubmit}
      />,
    );

    expect(screen.getByText(/درخواستِ سارا احمدی/)).toBeInTheDocument();
    expect(screen.getByText(/وضعیت درخواست را تغییر می‌دهد/)).toBeInTheDocument();
    const note = screen.getByLabelText(/پیام برای دانش‌آموز/);
    await user.type(note, "تا ساعت ۲۰ بازگردید.");
    await user.click(screen.getByRole("button", { name: "ثبت تأیید" }));
    expect(onSubmit).toHaveBeenCalledWith("تا ساعت ۲۰ بازگردید.");
  });

  it("explains the corrective next step for a refusal", () => {
    render(
      <PermissionDecisionModal
        request={request}
        decision="REJECTED"
        busy={false}
        onCancel={vi.fn()}
        onSubmit={vi.fn(async () => undefined)}
      />,
    );

    expect(screen.getByText(/دلیل رد یا اقدام بعدی/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "ثبت رد" })).toBeInTheDocument();
  });

  it("renders approval feedback and controls in English", () => {
    localStorage.setItem("moshaver-admin-location", "international");
    const { container, unmount } = render(
      <LocaleProvider>
        <PermissionDecisionModal
          request={request}
          decision="APPROVED"
          busy={false}
          onCancel={vi.fn()}
          onSubmit={vi.fn(async () => undefined)}
        />
      </LocaleProvider>,
    );

    expect(screen.getByText("Approving")).toBeInTheDocument();
    expect(screen.getByText("سارا احمدی's request for دبیرستان نمونه")).toBeInTheDocument();
    expect(within(container).getByRole("textbox", { name: /Message to student/ })).toHaveAttribute(
      "placeholder",
      "For example: Please return by 8 PM.",
    );
    expect(screen.getByText(/Saving approval changes the request status/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save approval" })).toBeInTheDocument();

    unmount();
    render(
      <LocaleProvider>
        <PermissionDecisionModal
          request={request}
          decision="REJECTED"
          busy
          onCancel={vi.fn()}
          onSubmit={vi.fn(async () => undefined)}
        />
      </LocaleProvider>,
    );
    expect(screen.getByText("Rejecting")).toBeInTheDocument();
    expect(screen.getByText(/Explain the rejection or next step/)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Saving…" })).toHaveAttribute("aria-busy", "true");
    localStorage.removeItem("moshaver-admin-location");
  });
});
