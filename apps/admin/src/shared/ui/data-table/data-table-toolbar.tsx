import { AdaptiveSelect } from "@/shared/ui/adaptive-select";
import type { Table } from "@tanstack/react-table";
import { Filter, RefreshCw, Search, SlidersHorizontal, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { ResponsiveDrawer } from "../responsive-drawer";
import { Button, Input } from "../ui";
import { DataTableFilters } from "./data-table-filters";
import type { DataTableColumn } from "./data-table-types";
import type { DataTableCopy } from "./data-table-copy";

export function DataTableToolbar<TData>({
  table,
  columns,
  copy,
  toolbar,
  onRefresh,
  refreshing,
  mode,
  density,
  onModeChange,
  onDensityChange,
}: {
  table: Table<TData>;
  columns: DataTableColumn<TData>[];
  copy: DataTableCopy;
  toolbar?: ReactNode;
  onRefresh?: () => void;
  refreshing?: boolean;
  mode: "auto" | "table" | "cards";
  density: "comfortable" | "compact";
  onModeChange: (mode: "auto" | "table" | "cards") => void;
  onDensityChange: (density: "comfortable" | "compact") => void;
}) {
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const search = String(table.getState().globalFilter ?? "");
  const [draft, setDraft] = useState(search);
  const pendingSearches = useRef(new Set<string>());
  const updateSearch = useRef((value: string) => table.setGlobalFilter(value));
  updateSearch.current = (value) => table.setGlobalFilter(value);
  useEffect(() => {
    // A delayed acknowledgement of our search must not overwrite newer typing.
    if (!pendingSearches.current.delete(search)) setDraft(search);
  }, [search]);
  useEffect(() => {
    if (draft === search) return;
    const timer = setTimeout(() => {
      pendingSearches.current.add(draft);
      updateSearch.current(draft);
    }, 250);
    return () => clearTimeout(timer);
  }, [draft, search]);
  const filters = table.getState().columnFilters;
  return (
    <>
      <div role="toolbar" aria-label={copy.search} className="flex min-w-0 items-center gap-2 p-3">
        <label className="relative min-w-0 flex-1">
          <Search
            size={16}
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <Input
            aria-label={copy.search}
            placeholder={copy.search}
            className="h-11 ps-9"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
          />
        </label>
        {columns.some((column) => column.filter) ? (
          <Button className="shrink-0" variant="soft" onClick={() => setFiltersOpen(true)}>
            <Filter size={16} aria-hidden="true" />
            {copy.filters}
            {filters.length ? ` (${filters.length})` : ""}
          </Button>
        ) : null}
        <Button
          className="shrink-0"
          variant="soft"
          onClick={() => setSettingsOpen(true)}
          aria-label={copy.columns}
        >
          <SlidersHorizontal size={16} aria-hidden="true" />
          <span className="hidden sm:inline">{copy.columns}</span>
        </Button>
        {onRefresh ? (
          <Button
            className="shrink-0"
            variant="ghost"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label={copy.refresh}
          >
            <RefreshCw
              size={18}
              aria-hidden="true"
              className={refreshing ? "motion-safe:animate-spin" : ""}
            />
          </Button>
        ) : null}
        {toolbar ? <div className="flex shrink-0 items-center gap-2">{toolbar}</div> : null}
      </div>
      {filters.length || search ? (
        <div className="flex flex-wrap items-center gap-2 border-t border-[rgb(var(--border-subtle))] px-3 py-2">
          {search ? (
            <Button
              variant="soft"
              aria-label={`${search} ${copy.removeFilter}`}
              onClick={() => {
                setDraft("");
                table.setGlobalFilter("");
              }}
            >
              {search}
              <X size={14} aria-hidden="true" />
              <span className="sr-only">{copy.removeFilter}</span>
            </Button>
          ) : null}
          {filters.map((filter) => {
            const column = columns.find((item) => item.id === filter.id);
            const value =
              column?.filter?.type === "select"
                ? column.filter.options.find((option) => option.value === filter.value)?.label
                : String(filter.value);
            return (
              <Button
                key={filter.id}
                variant="soft"
                aria-label={`${column?.label}: ${value} ${copy.removeFilter}`}
                onClick={() => table.getColumn(filter.id)?.setFilterValue(undefined)}
              >
                {column?.label}: {value}
                <X size={14} aria-hidden="true" />
                <span className="sr-only">{copy.removeFilter}</span>
              </Button>
            );
          })}
          <Button
            variant="ghost"
            onClick={() => {
              setDraft("");
              table.resetColumnFilters();
              table.setGlobalFilter("");
            }}
          >
            {copy.reset}
          </Button>
        </div>
      ) : null}
      <ResponsiveDrawer
        open={filtersOpen}
        onOpenChange={setFiltersOpen}
        title={copy.filters}
        description={copy.search}
      >
        <DataTableFilters
          table={table}
          columns={columns}
          copy={copy}
          onClose={() => setFiltersOpen(false)}
        />
      </ResponsiveDrawer>
      <ResponsiveDrawer
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        title={copy.columns}
        description={`${copy.sort} · ${copy.auto} · ${copy.density}`}
      >
        <div className="grid gap-5" dir="auto">
          <label className="grid gap-2 text-sm font-semibold">
            {copy.sort}
            <AdaptiveSelect
              aria-label={copy.sort}
              className="min-h-11 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
              value={table.getState().sorting[0]?.id ?? ""}
              onChange={(event) =>
                table.setSorting(
                  event.target.value ? [{ id: event.target.value, desc: false }] : [],
                )
              }
            >
              <option value="">{copy.sort}</option>
              {columns
                .filter((column) => column.sortable !== false)
                .map((column) => (
                  <option key={column.id} value={column.id}>
                    {column.label}
                  </option>
                ))}
            </AdaptiveSelect>
          </label>
          {table.getState().sorting.length ? (
            <Button
              variant="soft"
              onClick={() =>
                table.setSorting((current) =>
                  current.map((sort, index) => (index ? sort : { ...sort, desc: !sort.desc })),
                )
              }
            >
              {table.getState().sorting[0].desc ? copy.descending : copy.ascending}
            </Button>
          ) : null}
          <label className="grid gap-2 text-sm font-semibold">
            {copy.auto}
            <AdaptiveSelect
              aria-label={copy.auto}
              className="min-h-11 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
              value={mode}
              onChange={(event) => onModeChange(event.target.value as typeof mode)}
            >
              <option value="auto">{copy.auto}</option>
              <option value="table">{copy.table}</option>
              <option value="cards">{copy.cards}</option>
            </AdaptiveSelect>
          </label>
          <label className="grid gap-2 text-sm font-semibold">
            {copy.density}
            <AdaptiveSelect
              aria-label={copy.density}
              className="min-h-11 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-3"
              value={density}
              onChange={(event) => onDensityChange(event.target.value as typeof density)}
            >
              <option value="comfortable">{copy.comfortable}</option>
              <option value="compact">{copy.compact}</option>
            </AdaptiveSelect>
          </label>
          <fieldset className="grid gap-2">
            <legend className="text-sm font-semibold">{copy.visibility}</legend>
            {columns
              .filter((column) => column.hideable !== false && !column.primary)
              .map((column) => (
                <label key={column.id} className="flex min-h-11 items-center gap-3 rounded-lg px-1">
                  <input
                    type="checkbox"
                    checked={table.getColumn(column.id)?.getIsVisible() ?? true}
                    onChange={(event) =>
                      table.getColumn(column.id)?.toggleVisibility(event.target.checked)
                    }
                    className="size-4 accent-brand"
                  />
                  {column.label}
                </label>
              ))}
          </fieldset>
        </div>
      </ResponsiveDrawer>
    </>
  );
}
