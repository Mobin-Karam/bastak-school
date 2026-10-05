export const COLLECTION_LAYOUTS: readonly ["table", "cards"];
export const SORT_DIRECTIONS: readonly ["asc", "desc"];
export const DASHBOARD_WIDGET_ZONES: readonly ["primary", "secondary", "full"];
export const DASHBOARD_DENSITIES: readonly ["comfortable", "compact"];
export const DASHBOARD_MODES: readonly ["board", "live"];

export type CollectionLayout = (typeof COLLECTION_LAYOUTS)[number];
export type CollectionDensity = "compact" | "comfortable";
export type CollectionSort = Readonly<{
  field: string;
  direction: (typeof SORT_DIRECTIONS)[number];
}>;
export type CollectionFilter = Readonly<{
  field: string;
  operator: string;
  value: unknown;
}>;
export type CollectionView = Readonly<{
  id: string;
  title: string;
  layout: CollectionLayout;
  columns: readonly string[];
  visibleColumns: readonly string[];
  sort?: CollectionSort;
  filters: readonly CollectionFilter[];
  density: CollectionDensity;
  version: 1;
}>;

export type StorageAdapter = Readonly<{
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem?(key: string): void;
}>;

export type CommandDefinition = Readonly<{
  id: string;
  title: string;
  description?: string;
  keywords?: readonly string[];
  [key: string]: unknown;
}>;

export function normalizeText(value: unknown): string;
export function createCollectionView(
  input: Partial<CollectionView> & Pick<CollectionView, "id">,
): CollectionView;
export function collectionViewIsDirty(
  current: CollectionView,
  saved: CollectionView,
): boolean;
export function createViewPreferenceStore(input: {
  namespace: string;
  storage: StorageAdapter;
}): Readonly<{
  load(id: string): CollectionView | undefined;
  save(view: CollectionView): CollectionView;
  remove(id: string): void;
}>;
export function searchCommands<T extends CommandDefinition>(
  query: string,
  commands: readonly T[],
): readonly T[];

export type DashboardWidgetZone = (typeof DASHBOARD_WIDGET_ZONES)[number];
export type DashboardWidget = Readonly<{
  id: string;
  zone: DashboardWidgetZone;
  order: number;
  visible: boolean;
  /** Grid columns occupied by this widget (1-12). */
  width: number;
  /** Grid rows occupied by this widget (1-4). */
  height: number;
}>;
export type DashboardView = Readonly<{
  id: string;
  density: (typeof DASHBOARD_DENSITIES)[number];
  mode: (typeof DASHBOARD_MODES)[number];
  widgets: readonly DashboardWidget[];
  version: 1;
}>;
export type DashboardWidgetInput = Readonly<{
  id: string;
  zone?: DashboardWidgetZone;
  order?: number;
  visible?: boolean;
  width?: number;
  height?: number;
}>;
export type DashboardViewInput = Readonly<{
  id: string;
  density?: (typeof DASHBOARD_DENSITIES)[number];
  mode?: (typeof DASHBOARD_MODES)[number];
  widgets?: readonly DashboardWidgetInput[];
}>;
export function createDashboardView(input: DashboardViewInput): DashboardView;
export function dashboardViewIsDirty(
  current: DashboardView,
  saved: DashboardView,
): boolean;
export type DashboardViewState = Readonly<{
  density?: (typeof DASHBOARD_DENSITIES)[number];
  hidden?: readonly string[];
}>;
export function dashboardViewState(view: DashboardView): DashboardViewState;
export function applyDashboardViewState(
  defaultView: DashboardView,
  state?: DashboardViewState,
): DashboardView;
export function mergeDashboardView(
  defaultView: DashboardView,
  savedView?: DashboardView,
): DashboardView;
export function selectDashboardWidgets(
  view: DashboardView,
  zone?: DashboardWidgetZone,
): readonly DashboardWidget[];
export function createDashboardPreferenceStore(input: {
  namespace: string;
  storage: StorageAdapter;
}): Readonly<{
  load(id: string): DashboardView | undefined;
  save(view: DashboardView): DashboardView;
  remove(id: string): void;
}>;
