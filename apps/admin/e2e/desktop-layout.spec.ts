import { expect, test } from "@playwright/test";
import { readFileSync, readdirSync } from "node:fs";
import { adminContentOffsetClass } from "../src/app/layout/lib/layout-geometry";

test.use({
  reducedMotion: "reduce",
  launchOptions: {
    executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH,
  },
});

// Run after npm run build. Exercise the shipped viewport and panel CSS,
// without a production account or API fixture.
const assets = new URL("../dist/assets/", import.meta.url);
const css = readdirSync(assets)
  .filter((name) => name.endsWith(".css"))
  .map((name) => readFileSync(new URL(name, assets), "utf8"))
  .join("\n");

for (const direction of ["rtl", "ltr"]) {
  for (const size of [
    { width: 1280, height: 720 },
    { width: 1440, height: 900 },
    { width: 1920, height: 1080 },
  ]) {
    test(`desktop panels remain reachable at ${size.width}×${size.height} ${direction}`, async ({
      page,
    }) => {
      await page.setViewportSize(size);
      const rows = Array.from({ length: 60 }, (_, i) => `<p class="p-3">Book ${i + 1}</p>`).join(
        "",
      );
      const viewport = viewportFixture(
        expandedRails(direction as "rtl" | "ltr"),
        `<div class="grid gap-4">
        <section class="workspace-actions"><button>Add book</button></section>
        <section class="p-4">Class selector</section>
        <section class="data-table-workspace rounded-xl border overflow-hidden" data-scroll-rows="true">
          <div class="data-table-workspace__content" tabindex="0" aria-label="Books results">
            <div class="p-3">Search and filters</div>
            <div class="data-table-workspace__rows hidden md:block"><div role="region" tabindex="0" aria-label="Books">${rows}</div></div>
          </div>
          <div class="p-3" data-pagination><button>Next page</button></div>
        </section></div>`,
      );
      await page.setContent(
        `<style>${css}body{font-family:Arial,sans-serif}</style><div dir="${direction}" data-shell="desktop" class="admin-role-shell flex h-dvh flex-col overflow-hidden"><header class="h-20 shrink-0">Global header</header>${viewport}</div>`,
      );
      const metrics = await page.locator(".admin-page-scroll").evaluate((element) => ({
        height: element.clientHeight,
        scrollHeight: element.scrollHeight,
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(metrics.width).toBeLessThanOrEqual(size.width - 29 * 16);
      expect(metrics.scrollHeight).toBeLessThanOrEqual(metrics.height + 1);
      expect(metrics.scrollWidth).toBeLessThanOrEqual(metrics.width + 1);
      const pagination = await page.locator("[data-pagination]").boundingBox();
      expect(pagination!.y + pagination!.height).toBeLessThanOrEqual(size.height);
      const resultsViewport = page.getByLabel("Books results");
      await resultsViewport.focus();
      await page.keyboard.press("End");
      await expect
        .poll(() => resultsViewport.evaluate((element) => element.scrollTop))
        .toBeGreaterThan(0);
      await page.screenshot({ path: test.info().outputPath(`desktop-${direction}.png`) });
    });
  }
}

test("class panels stack on mobile and fit beside expanded rails on desktop", async ({ page }) => {
  for (const width of [390, 1280]) {
    await page.setViewportSize({ width, height: 720 });
    const viewport = viewportFixture(
      width >= 1200 ? expandedRails("ltr") : "",
      `<section class="classes-workspace grid gap-3">
      <article class="p-3 border">Class directory</article>
      <article class="p-3 border">Class details</article>
    </section>`,
    );
    await page.setContent(
      `<style>${css}body{font-family:Arial,sans-serif}</style><div data-shell="${width >= 1200 ? "desktop" : "mobile"}" class="admin-role-shell flex h-dvh flex-col overflow-hidden"><header class="h-20 shrink-0">Global header</header>${viewport}</div>`,
    );
    const panels = page.locator(".classes-workspace > article");
    const [first, second] = await panels.evaluateAll((elements) =>
      elements.map((element) => {
        const { x, y, width, height } = element.getBoundingClientRect();
        return { x, y, width, height };
      }),
    );
    if (width >= 1200) {
      expect(second.y).toBe(first.y);
      expect(second.x + second.width).toBeLessThanOrEqual(width);
    } else {
      expect(second.y).toBeGreaterThan(first.y);
      expect(second.x + second.width).toBeLessThanOrEqual(width);
    }
  }
});

function viewportFixture(offset: string, content: string) {
  return `<div class="${offset} flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
    <div class="admin-page-scroll min-h-0 flex-1 overflow-y-auto">
      <main class="admin-page-main w-full min-w-0 px-3 py-4 pb-[calc(5rem+env(safe-area-inset-bottom))]">
        <div class="admin-page-shell mx-auto w-full max-w-[1600px]">${content}</div>
      </main>
    </div>
  </div>`;
}

for (const workspace of ["home", "planner"]) {
  test(`${workspace} controls and panels remain reachable in a short desktop window`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 720 });
    const longContent = Array.from({ length: 50 }, () => `<p class="p-3">Details</p>`).join("");
    const content =
      workspace === "home"
        ? `<section class="home-workspace grid gap-3">
          <section class="workspace-actions">Today</section>
          ${Array.from({ length: 4 }, (_, i) => `<article class="border p-3" data-panel><h2>Panel ${i}</h2>${longContent}</article>`).join("")}
        </section>`
        : `<div class="planner-workspace grid gap-3">
          <section class="p-3"><button>Add plan</button></section>
          <section class="p-3">Calendar and date controls</section>
          <section class="p-3">Summary</section>
          <section data-panel class="planner-workspace__canvas h-[calc(100vh-235px)] min-h-[480px] overflow-hidden">
            <div class="h-full overflow-auto" tabindex="0">${longContent}</div>
          </section>
        </div>`;
    await page.setContent(
      `<style>${css}body{font-family:Arial,sans-serif}</style><div dir="rtl" data-shell="desktop" class="admin-role-shell flex h-dvh flex-col overflow-hidden"><header class="h-20 shrink-0">Global header</header>${viewportFixture(expandedRails("rtl"), content)}</div>`,
    );
    const overflow = await page
      .locator(".admin-page-scroll")
      .evaluate((element) => element.scrollHeight - element.clientHeight);

    if (workspace === "home") {
      // Home dashboards intentionally grow with operational content. The shared
      // page scroller is the desktop fallback for a short viewport, so assert
      // that a long dashboard can reach its final panel instead of requiring
      // every panel to fit at once.
      expect(overflow).toBeGreaterThan(0);
      const scroller = page.locator(".admin-page-scroll");
      await scroller.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));
      await expect.poll(() => scroller.evaluate((element) => element.scrollTop)).toBeGreaterThan(0);
      const lastPanel = page.locator("[data-panel]").last();
      await expect(lastPanel).toBeInViewport();
      return;
    }

    expect(overflow).toBeLessThanOrEqual(1);
    const panels = await page.locator("[data-panel]").evaluateAll((elements) =>
      elements.map((element) => {
        const rect = element.getBoundingClientRect();
        return { top: rect.top, bottom: rect.bottom, height: rect.height };
      }),
    );
    for (const panel of panels) {
      expect(panel.top).toBeGreaterThanOrEqual(80);
      expect(panel.bottom).toBeLessThanOrEqual(720);
      expect(panel.height).toBeGreaterThan(80);
    }
  });
}

function expandedRails(direction: "rtl" | "ltr") {
  return adminContentOffsetClass({
    showContextRail: true,
    mainCollapsed: false,
    contextCollapsed: false,
    direction,
  });
}
