import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { AccountSecurityPanel } from "./components/AccountSecurityPanel";
import { DatabaseBackupPanel } from "./components/DatabaseBackupPanel";
import { AppVersionManager } from "./components/AppVersionManager";
import type { PasswordDraft } from "./model/system.types";
import { LocaleProvider } from "../../shared/ui/locale";

function renderWithLocale(node: React.ReactElement) {
  return render(<LocaleProvider>{node}</LocaleProvider>);
}

function PasswordHarness({ onSubmit }: { onSubmit: () => void }) {
  const [passwords, setPasswords] = useState<PasswordDraft>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  return (
    <AccountSecurityPanel
      passwords={passwords}
      setPasswords={setPasswords}
      busy={false}
      onSubmit={onSubmit}
    />
  );
}

beforeEach(() => localStorage.setItem("moshaver-admin-location", "iran"));
afterEach(cleanup);

describe("system and security controls", () => {
  it("requires the current password, 12 characters, and matching confirmation", async () => {
    const user = userEvent.setup();
    const submit = vi.fn();
    renderWithLocale(<PasswordHarness onSubmit={submit} />);
    const button = screen.getByRole("button", { name: /تغییر امن رمز/ });
    expect(button).toBeDisabled();
    const inputs = screen.getAllByLabelText(/رمز/);
    await user.type(inputs[0], "current-password");
    await user.type(inputs[1], "long-password-123");
    await user.type(inputs[2], "different-password");
    expect(button).toBeDisabled();
    await user.clear(inputs[2]);
    await user.type(inputs[2], "long-password-123");
    expect(button).toBeEnabled();
  });

  it("rejects non-SQLite restore files before enabling a destructive action", () => {
    const setFile = vi.fn();
    renderWithLocale(
      <DatabaseBackupPanel
        file={null}
        busy={false}
        downloading={false}
        setFile={setFile}
        onDownload={vi.fn()}
        onRestore={vi.fn()}
      />,
    );
    fireEvent.change(screen.getByLabelText("فایل بازیابی SQLite"), {
      target: { files: [new File(["not sqlite"], "backup.txt", { type: "text/plain" })] },
    });
    expect(screen.getByRole("alert")).toHaveTextContent("فقط فایل SQLite");
    expect(screen.getByRole("button", { name: /اعتبارسنجی و بازیابی/ })).toBeDisabled();
  });

  it("makes rollback and post-restore checks explicit before a restore", () => {
    renderWithLocale(
      <DatabaseBackupPanel
        file={null}
        busy={false}
        downloading={false}
        setFile={vi.fn()}
        onDownload={vi.fn()}
        onRestore={vi.fn()}
      />,
    );

    expect(screen.getByText(/snapshot بازگشت ایجاد می‌کند/)).toBeInTheDocument();
    expect(screen.getByText(/به‌طور خودکار برگردانده می‌شود/)).toBeInTheDocument();
    expect(screen.getByText(/تاریخچه عملیات و سلامت پایگاه داده/)).toBeInTheDocument();
  });

  it("edits the active app version through an accessible form", async () => {
    const user = userEvent.setup();
    const save = vi.fn();
    renderWithLocale(
      <AppVersionManager
        versions={[{ app: "admin", version: "2.0.0", notes: "stable", updatedAt: "2026-01-01" }]}
        loading={false}
        error={false}
        busy={false}
        canManage
        onRetry={vi.fn()}
        onSave={save}
      />,
    );
    await user.click(screen.getByRole("button", { name: /admin/ }));
    const version = screen.getByLabelText("نسخه admin");
    await user.clear(version);
    await user.type(version, "2.1.0");
    await user.click(screen.getByRole("button", { name: /ذخیره/ }));
    expect(save).toHaveBeenCalledWith("admin", { version: "2.1.0", notes: "stable" });
  });

  it("uses English labels when the international locale is active", () => {
    localStorage.setItem("moshaver-admin-location", "international");
    renderWithLocale(<PasswordHarness onSubmit={vi.fn()} />);
    expect(
      screen.getByRole("heading", { name: "Password and authentication" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Change password securely" })).toBeDisabled();
  });
});
