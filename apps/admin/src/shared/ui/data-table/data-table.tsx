import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  functionalUpdate,
  type ColumnDef,
  type Row,
  type Updater,
} from "@tanstack/react-table";
import { Download, Eye } from "lucide-react";
import { Menu } from "@base-ui/react/menu";
import { Button, EmptyState, ErrorState } from "../ui";
import { ResponsiveDrawer } from "../responsive-drawer";
import { useOptionalAdminLanguage } from "../locale";
import { DataTableToolbar } from "./data-table-toolbar";
import { DataTablePagination } from "./data-table-pagination";
import { DataTableDesktop } from "./data-table-desktop";
import { DataTableMobileCards } from "./data-table-mobile-card";
import { DataTableRowActions } from "./data-table-row-actions";
import { tableCopy } from "./data-table-copy";
import { useOnlineStatus, useTablePreferences } from "./data-table-hooks";
import { defaultTableQuery, type DataTableProps, type DataTableQuery } from "./data-table-types";

function SelectionBox({
  checked,
  mixed = false,
  label,
  disabled,
  onChange,
}: {
  checked: boolean;
  mixed?: boolean;
  label: string;
  disabled?: boolean;
  onChange: () => void;
}) {
  return (
    <label className="inline-flex min-h-11 min-w-11 items-center justify-center">
      <input
        type="checkbox"
        checked={checked}
        ref={(element) => {
          if (element) element.indeterminate = mixed;
        }}
        aria-label={label}
        disabled={disabled}
        onChange={onChange}
        className="size-4 accent-brand"
      />
    </label>
  );
}

/** One headless model drives the desktop table and mobile cards. Features own data and mutations. */
export function DataTable<TData>({
  data,
  columns,
  getRowId,
  label,
  language: suppliedLanguage,
  loading,
  error,
  errorMessage,
  refreshing,
  busy,
  onRefresh,
  emptyTitle,
  emptyAction,
  toolbar,
  actions = [],
  selectable,
  bulkActions,
  renderDetail,
  onRowClick,
  query: controlledQuery,
  onQueryChange,
  server,
  preferenceKey,
  exportFilename,
}: DataTableProps<TData>) {
  const activeLanguage = useOptionalAdminLanguage();
  const language = suppliedLanguage ?? activeLanguage;
  const copy = tableCopy[language];
  const locale = language === "fa" ? "fa-IR" : "en-US";
  const [localQuery, setLocalQuery] = useState(defaultTableQuery);
  const query = controlledQuery ?? localQuery;
  const queryRef = useRef(query);
  queryRef.current = query;
  const [selection, setSelection] = useState({});
  const [preferences, setPreferences] = useTablePreferences(preferenceKey);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState(false);
  const online = useOnlineStatus();
  const actionsDisabled = busy || !online;
  const detail = data.find((row) => getRowId(row) === detailId);
  const rowClick =
    onRowClick ?? (renderDetail ? (row: TData) => setDetailId(getRowId(row)) : undefined);
  const rowActions = useMemo(
    () => [
      ...(renderDetail
        ? [
            {
              id: "details",
              label: copy.view,
              icon: <Eye size={16} aria-hidden="true" />,
              onClick: (row: TData) => setDetailId(getRowId(row)),
            },
          ]
        : []),
      ...actions,
    ],
    [actions, copy.view, getRowId, renderDetail],
  );
  const collator = useMemo(
    () => new Intl.Collator(locale, { numeric: true, sensitivity: "base" }),
    [locale],
  );
  const definitions = useMemo<ColumnDef<TData>[]>(
    () => [
      ...(selectable
        ? [
            {
              id: "_selection",
              enableSorting: false,
              enableHiding: false,
              enableGlobalFilter: false,
              header: ({ table }) => (
                <SelectionBox
                  checked={table.getIsAllPageRowsSelected()}
                  mixed={table.getIsSomePageRowsSelected()}
                  label={copy.selectAll}
                  disabled={actionsDisabled}
                  onChange={() => table.toggleAllPageRowsSelected()}
                />
              ),
              cell: ({ row }) => (
                <SelectionBox
                  checked={row.getIsSelected()}
                  label={`${copy.select} ${row.id}`}
                  disabled={actionsDisabled}
                  onChange={() => row.toggleSelected()}
                />
              ),
            } satisfies ColumnDef<TData>,
          ]
        : []),
      ...columns.map((column): ColumnDef<TData> => ({
        id: column.id,
        header: column.label,
        accessorFn: column.value,
        cell: ({ row }) => column.cell?.(row.original) ?? column.value(row.original),
        enableSorting: column.sortable !== false,
        enableHiding: column.hideable !== false && !column.primary,
        sortingFn: (a, b, id) => {
          const first = a.getValue<string | number>(id),
            second = b.getValue<string | number>(id);
          return typeof first === "number" && typeof second === "number"
            ? first - second
            : collator.compare(String(first), String(second));
        },
        filterFn: (row, id, value: unknown) =>
          column.filter?.type === "select"
            ? String(row.getValue(id)) === String(value)
            : String(row.getValue(id))
                .toLocaleLowerCase(locale)
                .includes(String(value).toLocaleLowerCase(locale)),
      })),
      ...(rowActions.length
        ? [
            {
              id: "_actions",
              header: copy.actions,
              enableSorting: false,
              enableHiding: false,
              enableGlobalFilter: false,
              cell: ({ row }) => (
                <DataTableRowActions
                  row={row.original}
                  actions={rowActions}
                  label={`${copy.actions} ${row.id}`}
                  busy={actionsDisabled}
                />
              ),
            } satisfies ColumnDef<TData>,
          ]
        : []),
    ],
    [actionsDisabled, columns, collator, copy, locale, rowActions, selectable],
  );
  const update = <K extends keyof DataTableQuery>(key: K, updater: Updater<DataTableQuery[K]>) => {
    const current = queryRef.current;
    const value = functionalUpdate(updater, current[key]);
    const next = {
      ...current,
      [key]: value,
      pagination:
        key === "pagination"
          ? (value as DataTableQuery["pagination"])
          : { ...current.pagination, pageIndex: 0 },
    };
    if (JSON.stringify(next) === JSON.stringify(current)) return;
    queryRef.current = next;
    if (controlledQuery && onQueryChange) onQueryChange(next);
    else setLocalQuery(next);
  };
  const table = useReactTable({
    data,
    columns: definitions,
    getRowId,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: Boolean(server),
    manualSorting: Boolean(server),
    manualFiltering: Boolean(server),
    rowCount: server?.rowCount,
    // Query updates reset filter/sort pages explicitly. URL parsing recreates arrays,
    // so TanStack auto-reset would otherwise undo a page navigation.
    autoResetPageIndex: false,
    enableRowSelection: selectable,
    onRowSelectionChange: setSelection,
    state: {
      globalFilter: query.search,
      columnFilters: query.filters,
      sorting: query.sorting,
      pagination: query.pagination,
      rowSelection: selection,
      columnVisibility: Object.fromEntries(
        columns
          .filter((column) => column.hideable !== false && !column.primary)
          .map((column) => [column.id, preferences.visibility[column.id] ?? true]),
      ),
    },
    onGlobalFilterChange: (value) => update("search", value),
    onColumnFiltersChange: (value) => update("filters", value),
    onSortingChange: (value) => update("sorting", value),
    onPaginationChange: (value) => update("pagination", value),
    onColumnVisibilityChange: (value) =>
      setPreferences((current) => ({
        ...current,
        visibility: functionalUpdate(value, current.visibility),
      })),
    globalFilterFn: (row: Row<TData>, id: string, value: unknown) =>
      String(row.getValue(id))
        .toLocaleLowerCase(locale)
        .includes(String(value).toLocaleLowerCase(locale)),
  });
  const pageCount = table.getPageCount();
  useEffect(() => {
    if (!loading && !refreshing && !error && query.pagination.pageIndex >= Math.max(1, pageCount)) {
      table.setPageIndex(Math.max(0, pageCount - 1));
    }
  }, [error, loading, pageCount, query.pagination.pageIndex, refreshing, table]);
  const selectedRows = table.getSelectedRowModel().rows.map((row) => row.original);
  const total = server?.rowCount ?? table.getFilteredRowModel().rows.length;
  const filtered = Boolean(query.search || query.filters.length);
  const disabled = busy || loading || !online;
  async function download(format: "csv" | "xlsx") {
    if (!exportFilename || server) return;
    setExporting(true);
    setExportError(false);
    try {
      const { exportTable } = await import("./data-table-export");
      await exportTable(
        format,
        table.getPrePaginationRowModel().rows.map((row) => row.original),
        columns.filter((column) => table.getColumn(column.id)?.getIsVisible()),
        exportFilename,
        language === "fa",
      );
    } catch {
      setExportError(true);
    } finally {
      setExporting(false);
    }
  }
  const exportButton: ReactNode =
    exportFilename && !server ? (
      <Menu.Root>
        <Menu.Trigger
          render={<Button variant="soft" disabled={exporting || loading || error || !total} />}
        >
          <Download size={16} aria-hidden="true" />
          {language === "fa" ? "خروجی نتایج" : "Export results"}
        </Menu.Trigger>
        <Menu.Portal>
          <Menu.Positioner sideOffset={4} align="end" className="z-[110]">
            <Menu.Popup className="rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-1 text-ink shadow-lg outline-none">
              {(["csv", "xlsx"] as const).map((format) => (
                <Menu.Item
                  key={format}
                  onClick={() => void download(format)}
                  className="flex min-h-11 cursor-pointer items-center rounded-md px-4 text-sm outline-none data-[highlighted]:bg-[rgb(var(--surface-muted))]"
                >
                  {format.toUpperCase()}
                </Menu.Item>
              ))}
            </Menu.Popup>
          </Menu.Positioner>
        </Menu.Portal>
      </Menu.Root>
    ) : null;
  return (
    <section
      aria-label={label}
      aria-busy={loading || refreshing || busy || exporting || undefined}
      dir={language === "fa" ? "rtl" : "ltr"}
      className={`data-table-workspace min-w-0 overflow-hidden rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] text-ink shadow-[var(--shadow-surface)] ${selectedRows.length ? "pb-28 md:pb-0" : ""}`}
    >
      <DataTableToolbar
        table={table}
        columns={columns}
        copy={copy}
        onRefresh={onRefresh}
        refreshing={refreshing || busy}
        toolbar={
          <>
            {exportButton}
            {toolbar}
          </>
        }
        mode={preferences.mode}
        density={preferences.density}
        onModeChange={(mode) => setPreferences((current) => ({ ...current, mode }))}
        onDensityChange={(density) => setPreferences((current) => ({ ...current, density }))}
      />
      {!online ? (
        <p role="status" className="px-3 py-2 text-sm text-amber-700 dark:text-amber-300">
          {copy.offline}
        </p>
      ) : null}
      {exportError ? (
        <p role="alert" className="px-3 py-2 text-sm text-rosewood">
          {language === "fa" ? "خروجی دریافت نشد. دوباره تلاش کنید." : "Export failed. Try again."}
        </p>
      ) : null}
      {loading ? (
        <div
          role="status"
          aria-label={copy.loading}
          className="grid gap-3 border-t border-[rgb(var(--border-subtle))] p-4"
        >
          <span className="sr-only">{copy.loading}</span>
          {[0, 1, 2, 3, 4].map((index) => (
            <div
              key={index}
              className="h-11 rounded-md bg-[rgb(var(--surface-muted))] motion-safe:animate-pulse"
            />
          ))}
        </div>
      ) : error ? (
        <div className="p-5">
          <ErrorState
            title={copy.error}
            description={errorMessage}
            action={
              onRefresh ? (
                <Button variant="soft" onClick={onRefresh}>
                  {copy.retry}
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <>
          {selectable && total > 0 ? (
            <div
              className={`z-20 flex flex-wrap items-center gap-2 border-t border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3 py-2 ${selectedRows.length ? "fixed inset-x-0 bottom-0 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg md:static md:shadow-none" : ""}`}
            >
              <SelectionBox
                checked={table.getIsAllPageRowsSelected()}
                mixed={table.getIsSomePageRowsSelected()}
                label={`${copy.selectAll} (${copy.cards})`}
                disabled={disabled}
                onChange={() => table.toggleAllPageRowsSelected()}
              />
              <span role="status" className="text-sm">
                {selectedRows.length.toLocaleString(locale)} {copy.selected}
              </span>
              {selectedRows.length ? (
                <>
                  {bulkActions?.(selectedRows, () => setSelection({}))}
                  <Button variant="ghost" onClick={() => setSelection({})}>
                    {copy.clear}
                  </Button>
                </>
              ) : null}
            </div>
          ) : null}
          {!table.getRowModel().rows.length ? (
            <div className="p-5">
              <EmptyState
                title={filtered ? copy.noResults : (emptyTitle ?? copy.empty)}
                action={
                  filtered ? (
                    <Button
                      variant="soft"
                      onClick={() => {
                        table.resetColumnFilters();
                        table.setGlobalFilter("");
                      }}
                    >
                      {copy.reset}
                    </Button>
                  ) : (
                    emptyAction
                  )
                }
              />
            </div>
          ) : (
            <>
              <div
                className={
                  preferences.mode === "cards"
                    ? "data-table-workspace__rows hidden"
                    : preferences.mode === "auto"
                      ? "data-table-workspace__rows hidden md:block"
                      : "data-table-workspace__rows block"
                }
              >
                <DataTableDesktop
                  table={table}
                  label={label}
                  copy={copy}
                  density={preferences.density}
                  onRowClick={rowClick}
                />
              </div>
              <div
                className={
                  preferences.mode === "table"
                    ? "data-table-workspace__rows hidden"
                    : preferences.mode === "auto"
                      ? "data-table-workspace__rows md:hidden"
                      : "data-table-workspace__rows block"
                }
              >
                <DataTableMobileCards
                  density={preferences.density}
                  table={table}
                  columns={columns}
                  actions={rowActions}
                  label={label}
                  copy={copy}
                  selectable={selectable}
                  busy={disabled}
                  onRowClick={rowClick}
                />
              </div>
            </>
          )}
          <DataTablePagination
            table={table}
            total={total}
            copy={copy}
            locale={locale}
            disabled={loading || refreshing}
          />
        </>
      )}
      <ResponsiveDrawer
        open={detailId !== null && Boolean(detail)}
        onOpenChange={(open) => {
          if (!open) setDetailId(null);
        }}
        title={copy.details}
        description={label}
      >
        {detail && renderDetail?.(detail)}
      </ResponsiveDrawer>
    </section>
  );
}
