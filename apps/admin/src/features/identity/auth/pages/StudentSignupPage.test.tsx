import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { LocaleProvider } from "../../../../shared/ui/locale";
import { getStudentSignupOptions, studentSignup } from "../api/signup.api";
import { StudentSignupPage } from "./StudentSignupPage";

vi.mock("../api/signup.api.ts", () => ({ getStudentSignupOptions: vi.fn(), studentSignup: vi.fn() }));
vi.mock("../../../../shared/theme/theme", async (original) => ({
  ...(await original<typeof import("../../../../shared/theme/theme")>()),
  ThemeSwitcher: () => null,
}));
afterEach(cleanup);
beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getStudentSignupOptions).mockResolvedValue({
    enabled: true,
    organizations: [{ id: "school-1", name: "مدرسه تست", type: "SCHOOL", remaining: 5 }],
  });
});
function setup() {
  render(
    <MemoryRouter>
      <LocaleProvider>
        <StudentSignupPage />
      </LocaleProvider>
    </MemoryRouter>,
  );
  return userEvent.setup();
}
describe("StudentSignupPage", () => {
  it("preserves details across steps and creates the account only after review", async () => {
    vi.mocked(studentSignup).mockRejectedValue(new Error("ثبت‌نام انجام نشد."));
    const user = setup();
    await screen.findByRole("option", { name: "مدرسه تست" });
    expect(screen.queryByLabelText("رمز عبور")).not.toBeInTheDocument();
    await user.type(screen.getByLabelText("نام", { exact: true }), "علی");
    await user.type(screen.getByLabelText("نام خانوادگی"), "احمدی");
    await user.click(screen.getByRole("button", { name: "ادامه" }));
    await user.type(screen.getByLabelText("شماره همراه"), "123");
    await user.type(screen.getByLabelText("رمز عبور"), "student-test-password");
    await user.click(screen.getByRole("button", { name: "ادامه" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("شماره همراه معتبر");
    await user.clear(screen.getByLabelText("شماره همراه"));
    await user.type(screen.getByLabelText("شماره همراه"), "09123456789");
    await user.click(screen.getByRole("button", { name: "مرحله قبل" }));
    expect(screen.getByLabelText("نام", { exact: true })).toHaveValue("علی");
    await user.click(screen.getByRole("button", { name: "ادامه" }));
    expect(screen.getByLabelText("رمز عبور")).toHaveValue("student-test-password");
    await user.click(screen.getByRole("button", { name: "ادامه" }));
    expect(screen.getByText("علی احمدی")).toBeInTheDocument();
    expect(screen.queryByLabelText("رمز عبور")).not.toBeInTheDocument();
    expect(studentSignup).not.toHaveBeenCalled();
    await user.click(screen.getByRole("button", { name: "ساخت حساب" }));
    expect(studentSignup).toHaveBeenCalledWith({
      organizationId: "school-1",
      firstName: "علی",
      lastName: "احمدی",
      phoneNumber: "09123456789",
      password: "student-test-password",
    });
    expect(await screen.findByRole("alert")).toHaveTextContent("ثبت‌نام انجام نشد.");
  });
  it.each([false, true])(
    "disables registration without available schools (enabled=%s)",
    async (enabled) => {
      vi.mocked(getStudentSignupOptions).mockResolvedValue({ enabled, organizations: [] });
      setup();
      await screen.findByRole("alert");
      expect(screen.getByRole("button", { name: "ادامه" })).toBeDisabled();
      expect(studentSignup).not.toHaveBeenCalled();
    },
  );
  it("allows retrying a failed school lookup", async () => {
    vi.mocked(getStudentSignupOptions).mockRejectedValueOnce(new Error("offline"));
    const user = setup();
    await screen.findByRole("alert");
    await user.click(screen.getByRole("button", { name: "بررسی دوباره مدارس" }));
    await screen.findByRole("option", { name: "مدرسه تست" });
    expect(screen.getByRole("button", { name: "ادامه" })).toBeEnabled();
  });
});
