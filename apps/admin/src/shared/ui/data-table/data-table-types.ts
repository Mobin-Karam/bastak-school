import type { ReactNode } from "react";
import type { ColumnFiltersState, PaginationState, SortingState } from "@tanstack/react-table";

export type DataTableQuery = {
  search: string;
  filters: ColumnFiltersState;
  sorting: SortingState;
  pagination: PaginationState;
};
export type DataTableColumn<TData> = {
  id: string;
  label: string;
  value: (row: TData) => string | number;
  cell?: (row: TData) => ReactNode;
  sortable?: boolean;
  hideable?: boolean;
  /** Keep the primary field visible in mobile cards. */
  primary?: boolean;
  filter?: { type: "text" } | { type: "select"; options: Array<{ value: string; label: string }> };
};
export type DataTableAction<TData> = {
  id: string;
  label: string;
  icon?: ReactNode;
  tone?: "default" | "danger";
  visible?: (row: TData) => boolean;
  disabled?: (row: TData) => boolean;
  onClick: (row: TData) => void;
};
export type DataTableProps<TData> = {
  data: TData[];
  columns: DataTableColumn<TData>[];
  getRowId: (row: TData) => string;
  label: string;
  language?: "fa" | "en";
  loading?: boolean;
  error?: boolean;
  errorMessage?: string;
  refreshing?: boolean;
  busy?: boolean;
  onRefresh?: () => void;
  emptyTitle?: string;
  emptyAction?: ReactNode;
  toolbar?: ReactNode;
  actions?: DataTableAction<TData>[];
  selectable?: boolean;
  bulkActions?: (rows: TData[], clearSelection: () => void) => ReactNode;
  renderDetail?: (row: TData) => ReactNode;
  onRowClick?: (row: TData) => void;
  /** Supply state and callback together for URL or server-driven queries. */
  query?: DataTableQuery;
  onQueryChange?: (query: DataTableQuery) => void;
  /** Data is already filtered, sorted and paginated by the feature's API. */
  server?: { rowCount: number };
  /** Use an organization/user-scoped key to persist presentation preferences only. */
  preferenceKey?: string;
  /** Exports all filtered client rows, using visible columns. Server exports are feature-owned. */
  exportFilename?: string;
};
export const defaultTableQuery: DataTableQuery = {
  search: "",
  filters: [],
  sorting: [],
  pagination: { pageIndex: 0, pageSize: 10 },
};
