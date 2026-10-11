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

function seedPhoneNumber(identity: string) {
  let hash = 0;
  for (const character of identity) hash = (hash * 31 + character.charCodeAt(0)) >>> 0;
  return `091${String(hash % 100000000).padStart(8, "0")}`;
}

test.describe("Admin v2 role login smoke", () => {
  test.skip(
    !process.env.ADMIN_V2_E2E_BASE_URL,
    "Set ADMIN_V2_E2E_BASE_URL and seed the disposable security matrix to run browser smoke.",
  );

  for (const username of accounts) {
    test(`${username} reaches the protected shell`, async ({ page }) => {
      await page.goto("/login");
      await page.getByLabel("شماره همراه").fill(seedPhoneNumber(username));
      await page.getByRole("button", { name: "ادامه", exact: true }).click();
      await page.getByLabel("رمز عبور", { exact: true }).fill("Moshaver-e2e-2026!");
      await page.getByRole("button", { name: "ورود", exact: true }).click();

      await expect(page).toHaveURL(/\/admin(?:\/|$)/);
      await expect(page.locator("main")).toBeVisible();
    });
  }

  test("Student account reaches the shared school shell", async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("شماره همراه").fill(seedPhoneNumber("e2e.student.a"));
    await page.getByRole("button", { name: "ادامه", exact: true }).click();
    await page.getByLabel("رمز عبور", { exact: true }).fill("Moshaver-e2e-2026!");
    await page.getByRole("button", { name: "ورود", exact: true }).click();

    await expect(page).toHaveURL(/\/admin(?:\/|$)/);
    await expect(page.locator("main")).toBeVisible();
  });

  test("platform owner confirms archive and restore for the seeded student", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/login");
    await page.getByLabel("شماره همراه").fill(seedPhoneNumber("e2e.platform"));
    await page.getByRole("button", { name: "ادامه", exact: true }).click();
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
