export const COLLECTION_LAYOUTS = Object.freeze(["table", "cards"]);
export const SORT_DIRECTIONS = Object.freeze(["asc", "desc"]);
export const DASHBOARD_WIDGET_ZONES = Object.freeze([
  "primary",
  "secondary",
  "full",
]);
export const DASHBOARD_DENSITIES = Object.freeze(["comfortable", "compact"]);
export const DASHBOARD_MODES = Object.freeze(["board", "live"]);

function uniqueStrings(values) {
  return [
    ...new Set(
      Array.from(values || [], (value) => String(value || "").trim()).filter(
        Boolean,
      ),
    ),
  ];
}

export function normalizeText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[\u064A\u0649]/g, "ی")
    .replace(/\u0643/g, "ک")
    .toLocaleLowerCase("fa");
}

function normalizeSort(sort) {
  if (!sort) return undefined;
  const field = String(sort.field || "").trim();
  const direction = String(sort.direction || "asc");
  if (!field) throw new TypeError("Collection sort field is required.");
  if (!SORT_DIRECTIONS.includes(direction))
    throw new TypeError("Collection sort direction must be asc or desc.");
  return Object.freeze({ field, direction });
}

function normalizeFilter(filter) {
  const field = String(filter?.field || "").trim();
  const operator = String(filter?.operator || "").trim();
  if (!field || !operator)
    throw new TypeError("Collection filters require field and operator.");
  return Object.freeze({ field, operator, value: filter.value });
}

export function createCollectionView(input) {
  if (!input || typeof input !== "object")
    throw new TypeError("Collection view must be an object.");
  const id = String(input.id || "").trim();
  const layout = String(input.layout || "table");
  const columns = uniqueStrings(input.columns);
  const visibleColumns = uniqueStrings(input.visibleColumns || columns);
  if (!id) throw new TypeError("Collection view id is required.");
  if (!COLLECTION_LAYOUTS.includes(layout))
    throw new TypeError("Collection layout must be table or cards.");
  if (visibleColumns.some((column) => !columns.includes(column))) {
    throw new TypeError(
      "Visible columns must be present in the collection columns.",
    );
  }
  return Object.freeze({
    id,
    title: String(input.title || "").trim(),
    layout,
    columns: Object.freeze(columns),
    visibleColumns: Object.freeze(visibleColumns),
    sort: normalizeSort(input.sort),
    filters: Object.freeze(Array.from(input.filters || [], normalizeFilter)),
    density: input.density === "compact" ? "compact" : "comfortable",
    version: 1,
  });
}

export function collectionViewIsDirty(current, saved) {
  return (
    JSON.stringify(createCollectionView(current)) !==
    JSON.stringify(createCollectionView(saved))
  );
}

export function createViewPreferenceStore({ namespace, storage }) {
  const normalizedNamespace = String(namespace || "").trim();
  if (!normalizedNamespace)
    throw new TypeError("A preference namespace is required.");
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function"
  ) {
    throw new TypeError("A Storage-compatible adapter is required.");
  }
  const keyFor = (id) =>
    `${normalizedNamespace}:collection-view:${String(id || "").trim()}`;
  return Object.freeze({
    load(id) {
      const raw = storage.getItem(keyFor(id));
      if (!raw) return undefined;
      try {
        return createCollectionView(JSON.parse(raw));
      } catch {
        return undefined;
      }
    },
    save(view) {
      const normalized = createCollectionView(view);
      storage.setItem(keyFor(normalized.id), JSON.stringify(normalized));
      return normalized;
    },
    remove(id) {
      if (typeof storage.removeItem === "function")
        storage.removeItem(keyFor(id));
    },
  });
}

/**
 * Domain-neutral dashboard view model. A host supplies the widgets and decides
 * what each widget renders; this package only preserves layout intent and
 * personal visibility/order preferences.
 */
export function createDashboardView(input) {
  if (!input || typeof input !== "object")
    throw new TypeError("Dashboard view must be an object.");
  const id = String(input.id || "").trim();
  if (!id) throw new TypeError("Dashboard view id is required.");
  const seen = new Set();
  const widgets = Array.from(input.widgets || [], (widget, index) => {
    const widgetId = String(widget?.id || "").trim();
    const zone = String(widget?.zone || "primary");
    if (!widgetId) throw new TypeError("Dashboard widget id is required.");
    if (seen.has(widgetId))
      throw new TypeError("Dashboard widget ids must be unique.");
    if (!DASHBOARD_WIDGET_ZONES.includes(zone))
      throw new TypeError("Dashboard widget zone is invalid.");
    seen.add(widgetId);
    const width = Number.isFinite(widget?.width)
      ? Math.min(12, Math.max(1, Math.floor(widget.width)))
      : 12;
    const height = Number.isFinite(widget?.height)
      ? Math.min(4, Math.max(1, Math.floor(widget.height)))
      : 1;
    return Object.freeze({
      id: widgetId,
      zone,
      order: Number.isFinite(widget?.order)
        ? Math.max(0, Math.floor(widget.order))
        : index,
      visible: widget?.visible !== false,
      width,
      height,
    });
  });
  return Object.freeze({
    id,
    density: input.density === "compact" ? "compact" : "comfortable",
    mode: input.mode === "live" ? "live" : "board",
    widgets: Object.freeze(
      widgets.sort(
        (left, right) =>
          left.order - right.order || left.id.localeCompare(right.id),
      ),
    ),
    version: 1,
  });
}

export function dashboardViewIsDirty(current, saved) {
  return (
    JSON.stringify(createDashboardView(current)) !==
    JSON.stringify(createDashboardView(saved))
  );
}

/**
 * Creates a transport-neutral representation of a dashboard view. Hosts can
 * store it in a URL, native route state, or a shareable deep link without
 * exposing records, permissions, or renderer implementation details.
 */
export function dashboardViewState(view) {
  const normalized = createDashboardView(view);
  return Object.freeze({
    density: normalized.density,
    hidden: Object.freeze(
      normalized.widgets
        .filter((widget) => !widget.visible)
        .map((widget) => widget.id),
    ),
  });
}

/**
 * Applies a portable view state to the host's authoritative widget contract.
 * Unknown ids are ignored so a shared URL cannot make a host render a widget
 * it did not define.
 */
export function applyDashboardViewState(defaultView, state) {
  const base = createDashboardView(defaultView);
  const hidden = new Set(uniqueStrings(state?.hidden));
  const density =
    state?.density === "comfortable" || state?.density === "compact"
      ? state.density
      : base.density;
  return createDashboardView({
    ...base,
    density,
    widgets: base.widgets.map((widget) => ({
      ...widget,
      visible: !hidden.has(widget.id),
    })),
  });
}

/**
 * Carries forward a user's density/visibility choices while making the host's
 * current widget definition authoritative for widget existence and zones.
 * This lets hosts add a new widget without invalidating a user's board layout.
 */
export function mergeDashboardView(defaultView, savedView) {
  const base = createDashboardView(defaultView);
  if (!savedView) return base;
  const saved = createDashboardView(savedView);
  const byId = new Map(saved.widgets.map((widget) => [widget.id, widget]));
  return createDashboardView({
    ...base,
    density: saved.density,
    mode: saved.mode,
    widgets: base.widgets.map((widget) => ({
      ...widget,
      visible: byId.get(widget.id)?.visible ?? widget.visible,
      order: byId.get(widget.id)?.order ?? widget.order,
      width: byId.get(widget.id)?.width ?? widget.width,
      height: byId.get(widget.id)?.height ?? widget.height,
    })),
  });
}

/**
 * Returns visible widgets in a zone while leaving all rendering to the host.
 * This keeps dashboard selection logic portable across UI frameworks.
 */
export function selectDashboardWidgets(view, zone) {
  const normalized = createDashboardView(view);
  if (zone != null && !DASHBOARD_WIDGET_ZONES.includes(String(zone))) {
    throw new TypeError("Dashboard widget zone is invalid.");
  }
  return Object.freeze(
    normalized.widgets.filter(
      (widget) => widget.visible && (zone == null || widget.zone === zone),
    ),
  );
}

export function createDashboardPreferenceStore({ namespace, storage }) {
  const normalizedNamespace = String(namespace || "").trim();
  if (!normalizedNamespace)
    throw new TypeError("A preference namespace is required.");
  if (
    !storage ||
    typeof storage.getItem !== "function" ||
    typeof storage.setItem !== "function"
  ) {
    throw new TypeError("A Storage-compatible adapter is required.");
  }
  const keyFor = (id) =>
    `${normalizedNamespace}:dashboard-view:${String(id || "").trim()}`;
  return Object.freeze({
    load(id) {
      const raw = storage.getItem(keyFor(id));
      if (!raw) return undefined;
      try {
        return createDashboardView(JSON.parse(raw));
      } catch {
        return undefined;
      }
    },
    save(view) {
      const normalized = createDashboardView(view);
      storage.setItem(keyFor(normalized.id), JSON.stringify(normalized));
      return normalized;
    },
    remove(id) {
      if (typeof storage.removeItem === "function")
        storage.removeItem(keyFor(id));
    },
  });
}

export function searchCommands(query, commands) {
  const terms = normalizeText(query).split(/\s+/).filter(Boolean);
  return Array.from(commands || [])
    .filter((command) => command && command.id && command.title)
    .map((command) => ({
      ...command,
      searchable: normalizeText(
        [command.title, command.description, ...(command.keywords || [])].join(
          " ",
        ),
      ),
    }))
    .filter((command) =>
      terms.every((term) => command.searchable.includes(term)),
    )
    .sort((left, right) => {
      const leftStart = terms.filter((term) =>
        normalizeText(left.title).startsWith(term),
      ).length;
      const rightStart = terms.filter((term) =>
        normalizeText(right.title).startsWith(term),
      ).length;
      return (
        rightStart - leftStart ||
        normalizeText(left.title).localeCompare(
          normalizeText(right.title),
          "fa",
        )
      );
    })
    .map(({ searchable, ...command }) => Object.freeze(command));
}
