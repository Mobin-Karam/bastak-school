import "@testing-library/jest-dom/vitest";
import { configure } from "@testing-library/react";

// Keep async DOM assertions reliable while jsdom resolves larger dialog trees.
configure({ asyncUtilTimeout: 3_000 });

class TestResizeObserver {
  observe() {}
  unobserve() {}
  disconnect() {}
}

globalThis.ResizeObserver = TestResizeObserver as typeof ResizeObserver;
globalThis.requestAnimationFrame = (callback) =>
  window.setTimeout(() => callback(performance.now()), 0);
globalThis.cancelAnimationFrame = (id) => window.clearTimeout(id);
