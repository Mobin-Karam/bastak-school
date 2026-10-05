import test from "node:test";
import assert from "node:assert/strict";
import {
  collectionViewIsDirty,
  createCollectionView,
  createViewPreferenceStore,
  mergeDashboardView,
  selectDashboardWidgets,
  searchCommands,
  createDashboardView,
  createDashboardPreferenceStore,
  dashboardViewIsDirty,
  dashboardViewState,
  applyDashboardViewState,
} from "../src/index.js";

test("normalizes reusable collection preferences without application data", () => {
  const view = createCollectionView({
    id: "records",
    layout: "table",
    columns: ["name", "state", "name"],
    visibleColumns: ["state", "name"],
    sort: { field: "name", direction: "asc" },
    filters: [{ field: "state", operator: "equals", value: "open" }],
  });
  assert.deepEqual(view.columns, ["name", "state"]);
  assert.equal(view.density, "comfortable");
  assert.equal(
    collectionViewIsDirty(view, { ...view, density: "compact" }),
    true,
  );
});

test("persists a versioned collection preference behind a host storage adapter", () => {
  const values = new Map();
  const store = createViewPreferenceStore({
    namespace: "another-project",
    storage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
      removeItem: (key) => values.delete(key),
    },
  });
  store.save({ id: "orders", columns: ["id"], visibleColumns: ["id"] });
  assert.equal(store.load("orders")?.id, "orders");
  store.remove("orders");
  assert.equal(store.load("orders"), undefined);
});

test("searches generic commands without relying on application routes or permissions", () => {
  const results = searchCommands("گزارش جدید", [
    { id: "report", title: "گزارش جدید", keywords: ["create report"] },
    { id: "student", title: "دانش‌آموز جدید" },
  ]);
  assert.deepEqual(
    results.map((item) => item.id),
    ["report"],
  );
});

test("normalizes portable dashboard layout preferences without business widgets", () => {
  const dashboard = createDashboardView({
    id: "operations",
    density: "compact",
    widgets: [
      { id: "queue", zone: "primary", order: 2 },
      { id: "health", zone: "secondary", order: 1 },
      { id: "summary", zone: "full", order: 0, visible: false },
    ],
  });
  assert.deepEqual(
    dashboard.widgets.map((widget) => widget.id),
    ["summary", "health", "queue"],
  );
  assert.equal(
    dashboardViewIsDirty(dashboard, { ...dashboard, density: "comfortable" }),
    true,
  );
  assert.deepEqual(
    dashboard.widgets.find((widget) => widget.id === "queue"),
    { id: "queue", zone: "primary", order: 2, visible: true, width: 12, height: 1 },
  );
});

test("persists dashboard preferences through an injected storage adapter", () => {
  const values = new Map();
  const store = createDashboardPreferenceStore({
    namespace: "another-project",
    storage: {
      getItem: (key) => values.get(key) || null,
      setItem: (key, value) => values.set(key, value),
    },
  });
  store.save({ id: "operations", widgets: [{ id: "queue" }] });
  assert.equal(store.load("operations")?.widgets[0]?.id, "queue");
});

test("merges saved dashboard choices into a host's current widget contract", () => {
  const defaultView = createDashboardView({
    id: "operations",
    widgets: [
      { id: "queue", zone: "primary" },
      { id: "health", zone: "secondary" },
    ],
  });
  const saved = createDashboardView({
    id: "operations",
    density: "compact",
    widgets: [{ id: "queue", zone: "primary", visible: false, order: 8, width: 6, height: 2 }],
  });

  const merged = mergeDashboardView(defaultView, saved);
  assert.equal(merged.density, "compact");
  assert.deepEqual(
    merged.widgets.find((widget) => widget.id === "queue"),
    { id: "queue", zone: "primary", order: 8, visible: false, width: 6, height: 2 },
  );
  assert.deepEqual(
    merged.widgets.map(({ id, visible }) => ({ id, visible })),
    [
      { id: "health", visible: true },
      { id: "queue", visible: false },
    ],
  );
});

test("shares dashboard layout intent without accepting unknown host widgets", () => {
  const defaultView = createDashboardView({
    id: "operations",
    widgets: [
      { id: "queue", zone: "primary" },
      { id: "health", zone: "secondary" },
    ],
  });
  const shared = applyDashboardViewState(defaultView, {
    density: "compact",
    hidden: ["health", "foreign-widget"],
  });

  assert.deepEqual(dashboardViewState(shared), {
    density: "compact",
    hidden: ["health"],
  });
  assert.equal(shared.widgets.find((widget) => widget.id === "queue")?.visible, true);
  assert.equal(shared.widgets.find((widget) => widget.id === "health")?.visible, false);
});

test("selects visible widgets by zone without knowing the host renderer", () => {
  const view = createDashboardView({
    id: "operations",
    widgets: [
      { id: "summary", zone: "full", order: 0 },
      { id: "queue", zone: "primary", order: 1 },
      { id: "health", zone: "secondary", order: 2, visible: false },
      { id: "actions", zone: "secondary", order: 3 },
    ],
  });
  assert.deepEqual(
    selectDashboardWidgets(view, "secondary").map((widget) => widget.id),
    ["actions"],
  );
});
