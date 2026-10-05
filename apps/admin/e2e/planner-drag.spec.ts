import { expect, test } from "@playwright/test";

test.describe("Planner drag persistence", () => {
  test.skip(
    !process.env.PLANNER_E2E,
    "Set PLANNER_E2E=1 with the disposable API/database fixture.",
  );

  test("moves a task across the Week timeline to an empty day and persists it", async ({
    page,
  }) => {
    await page.goto("/login");
    await page.getByLabel("نام کاربری").fill("e2e.advisor.a");
    await page.getByLabel("رمز عبور", { exact: true }).fill("Moshaver-e2e-2026!");
    await page.getByRole("button", { name: "ورود", exact: true }).click();
    await expect(page).toHaveURL(/\/admin(?:\/|$)/);

    const fixture = await page.evaluate(async () => {
      const csrf = sessionStorage.getItem("moshaver_admin_csrf") || "";
      const headers = { "Content-Type": "application/json", "X-CSRF-Token": csrf };
      const students = await fetch("/api/v2/students", { credentials: "include" }).then(
        (response) => response.json(),
      );
      const studentId = students.data[0].id as string;
      const sourceDate = "2030-09-30";
      const destinationDate = "2030-10-02";
      const source = await fetch("/api/v2/plans", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({
          studentId,
          date: sourceDate,
          tasks: [{ type: "STUDY", title: "E2E drag task", startTime: "09:00", endTime: "10:30" }],
        }),
      }).then((response) => response.json());
      if (!source.ok)
        throw new Error(
          `Unable to create source plan: ${source.error?.message || "unknown error"}`,
        );
      const destination = await fetch("/api/v2/plans", {
        method: "POST",
        headers,
        credentials: "include",
        body: JSON.stringify({ studentId, date: destinationDate, tasks: [] }),
      }).then((response) => response.json());
      if (!destination.ok)
        throw new Error(
          `Unable to create destination plan: ${destination.error?.message || "unknown error"}`,
        );
      return { studentId, sourceDate, destinationDate, taskId: source.data.tasks[0].id as string };
    });

    await page.goto(
      `/admin/planner?studentId=${fixture.studentId}&date=${fixture.sourceDate}&view=week`,
    );
    await expect(page.getByText("E2E drag task", { exact: true })).toBeVisible();
    // Playwright's OS-level drag transport is unreliable for custom MIME
    // DataTransfer values. Dispatching real browser DragEvents still crosses
    // the rendered React timeline and its production event handlers.
    await page.evaluate(({ taskId, destinationDate }) => {
      const source = document.querySelector<HTMLElement>(`[data-planner-task-id="${taskId}"]`);
      const target = document.querySelector<HTMLElement>(
        `[data-planner-drop-date="${destinationDate}"][data-planner-drop-time="14:00"]`,
      );
      if (!source || !target) throw new Error("Planner drag fixture is not rendered.");
      const transfer = new DataTransfer();
      source.dispatchEvent(
        new DragEvent("dragstart", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
      target.dispatchEvent(
        new DragEvent("dragenter", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
      target.dispatchEvent(
        new DragEvent("dragover", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
      target.dispatchEvent(
        new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
      source.dispatchEvent(
        new DragEvent("dragend", { bubbles: true, cancelable: true, dataTransfer: transfer }),
      );
    }, fixture);

    await expect
      .poll(async () =>
        page.evaluate(async ({ studentId, destinationDate, taskId }) => {
          const response = await fetch(
            `/api/v2/plans?studentId=${studentId}&date=${destinationDate}`,
            { credentials: "include" },
          );
          const payload = await response.json();
          const task = payload.data?.[0]?.tasks?.find((item: { id: string }) => item.id === taskId);
          return task && `${task.startTime}-${task.endTime}-${task.duration}`;
        }, fixture),
      )
      .toBe("14:00-15:30-90");

    await page.reload();
    await expect(page.locator(`[data-planner-task-id="${fixture.taskId}"]`)).toBeVisible();
  });
});
