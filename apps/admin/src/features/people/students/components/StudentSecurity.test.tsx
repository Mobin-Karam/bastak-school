import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { Student } from "../../../../shared/types/domain";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { StudentSecurity } from "./StudentSecurity";

const student: Student = {
  id: "student-1",
  name: "دانش‌آموز نمونه",
  username: "student1",
  accountStatus: "active",
};

function renderSecurity(canArchive: boolean) {
  function SecurityHarness() {
    const [password, setPassword] = useState("");
    return (
      <StudentSecurity
        student={student}
        password={password}
        setPassword={setPassword}
        onPassword={vi.fn()}
        onArchive={vi.fn()}
        onLifecycle={vi.fn()}
        canArchive={canArchive}
        busy={{ remove: false, password: false, lifecycle: false }}
      />
    );
  }
  return render(
    <LocaleProvider>
      <SecurityHarness />
    </LocaleProvider>,
  );
}

describe("student security actions", () => {
  afterEach(cleanup);

  it("requires the API's 12-character minimum for password resets", () => {
    renderSecurity(true);
    expect(screen.getByRole("button", { name: "تغییر رمز" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("رمز جدید"), {
      target: { value: "12345678901" },
    });
    expect(screen.getByText("رمز عبور باید حداقل ۱۲ نویسه باشد.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "تغییر رمز" })).toBeDisabled();
    fireEvent.change(screen.getByLabelText("رمز جدید"), {
      target: { value: "123456789012" },
    });
    expect(screen.getByRole("button", { name: "تغییر رمز" })).toBeEnabled();
  });

  it("hides archive action when the viewer lacks archive capability", () => {
    renderSecurity(false);
    expect(screen.queryByRole("button", { name: "بایگانی حساب" })).not.toBeInTheDocument();
  });
});
