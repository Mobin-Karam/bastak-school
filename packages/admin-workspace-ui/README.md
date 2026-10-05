# @moshaver/admin-workspace-ui

Framework- and domain-neutral operational-workspace logic extracted from the Moshaver Admin UI. It deliberately contains no routes, API clients, roles, permissions, translations, React components, or education entities.

## What it provides

- normalized table/card collection view preferences;
- ordered/visible column preferences;
- a versioned storage adapter for local or host-provided persistence;
- filter/sort-aware dirty/reset semantics for a view bar;
- generic command indexing and search ranking.
- portable dashboard-widget layout and density preferences; hosts inject their
  own data, permissions, translations, and React/Vue/native renderers.
- a transport-neutral dashboard-view state for shareable URLs or native route
  state; it contains only density and hidden host widget ids.

## What stays in the host application

The host owns authorization, data fetching, routing, translations, icons, and rendering. Never treat view visibility or a command result as authorization.

```js
const {
  createCollectionView,
  createViewPreferenceStore,
  createDashboardView,
  createDashboardPreferenceStore,
  dashboardViewState,
  applyDashboardViewState,
  searchCommands,
} = require("@moshaver/admin-workspace-ui");

const view = createCollectionView({
  id: "students",
  layout: "table",
  columns: ["name", "status", "lastSeen"],
  visibleColumns: ["name", "status"],
  sort: { field: "name", direction: "asc" },
});

const store = createViewPreferenceStore({
  namespace: "my-product",
  storage: window.localStorage,
});
store.save(view);

const dashboard = createDashboardView({
  id: "operations",
  widgets: [
    { id: "summary", zone: "full" },
    { id: "work-queue", zone: "primary" },
    { id: "health", zone: "secondary" },
  ],
});

const dashboardStore = createDashboardPreferenceStore({
  namespace: "my-product",
  storage: window.localStorage,
});
dashboardStore.save({
  ...dashboard,
  widgets: dashboard.widgets.map((widget) =>
    widget.id === "health" ? { ...widget, visible: false } : widget,
  ),
});

// A host may encode this state in its own URL or native route adapter.
const sharedState = dashboardViewState(dashboard);
const sharedDashboard = applyDashboardViewState(dashboard, sharedState);

const results = searchCommands("new report", commandDefinitions);
```

Use the package through its root entry point only.
