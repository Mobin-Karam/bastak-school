import { expect, test } from "@playwright/test";

const accounts = [
  "e2e.guardian.a",
  "e2e.advisor.a",
  "e2e.teacher.a",
  "e2e.mentor.a",
  "e2e.content.a",
  "e2e.orgadmin.a",
  "e2e.platform",
  "e2e.multi",
] as const;

test.describe("Admin v2 role login smoke", () => {
  test.skip(
    !process.env.ADMIN_V2_E2E_BASE_URL,
    "Set ADMIN_V2_E2E_BASE_URL and seed the disposable security matrix to run browser smoke.",
  );

  for (const username of accounts) {
    test(`${username} reaches the protected shell`, async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("نام کاربری").fill(username);
      await page.getByLabel("رمز عبور", { exact: true }).fill("Moshaver-e2e-2026!");
      await page.getByRole("button", { name: "ورود", exact: true }).click();

      await expect(page).toHaveURL(/\/admin(?:\/|$)/);
      await expect(page.locator("main")).toBeVisible();
    });
  }

  test("Student-only account is rejected by the Admin shell", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("نام کاربری").fill("e2e.student.a");
    await page.getByLabel("رمز عبور", { exact: true }).fill("Moshaver-e2e-2026!");
    await page.getByRole("button", { name: "ورود", exact: true }).click();

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByText("این حساب مدیر نیست.")).toBeVisible();
  });

  test("platform owner confirms archive and restore for the seeded student", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await page.getByLabel("نام کاربری").fill("e2e.platform");
    await page.getByLabel("رمز عبور", { exact: true }).fill("Moshaver-e2e-2026!");
    await page.getByRole("button", { name: "ورود", exact: true }).click();
    await expect(page).toHaveURL(/\/admin(?:\/|$)/);
    await page.goto("/admin/students");
    await page.getByRole("button", { name: "Student A" }).click();
    await page.getByRole("button", { name: "امنیت" }).click();
    await page.getByRole("button", { name: "بایگانی حساب" }).click();
    await page.getByLabel("عبارت تأیید بایگانی").fill("بایگانی");
    await page.getByRole("button", { name: "بایگانی", exact: true }).click();
    await page.getByRole("button", { name: "بازیابی حساب" }).click();
    await page.getByLabel("عبارت تأیید بازیابی").fill("بازیابی");
    await page.getByRole("button", { name: "بازیابی", exact: true }).click();
    await expect(page.getByRole("button", { name: "بایگانی حساب" })).toBeVisible();
  });
});
