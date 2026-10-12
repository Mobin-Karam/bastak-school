# Shared Admin data table

`DataTable<TData>` is the shared headless table workspace. TanStack Table v8 owns search, filtering, sorting, selection and pagination. Desktop tables and mobile cards render the same row model; feature pages supply data, columns, permissions and mutations. The presentation uses the existing shadcn/Base UI and Radix primitives, Admin design tokens and Persian/English copy.

## Feature integration

Import from `shared/ui/data-table`. Supply stable `getRowId`, memoized columns, and a label. Column `value` supplies searchable/sortable/exportable text; optional `cell` formats presentation. Mark the identifying column `primary` to keep it visible. Text and select column filters combine with the debounced global search.

Optional integrations:

- `actions`: custom dropdown items with per-record visibility, disabled states, icons and danger styling. Enforce capabilities in the feature and authorization in the API.
- `selectable` and `bulkActions`: one selection model across cards and table, retained across pages. Bulk callbacks receive currently loaded selected records; they never imply selection of unseen server records.
- `renderDetail`: a focus-managed desktop drawer and mobile bottom sheet. Row clicks and the detail menu item open the same detail view.
- `loading`, `error`, `errorMessage`, `onRefresh`, `refreshing`, `busy`: skeleton, retry, empty/search-empty, background refresh and pending action states. The workspace also reports offline status.
- `preferenceKey`: persist visibility, responsive/table/card mode and density. Scope this key to the user and organization; remount the table on scope changes.
- `exportFilename`: CSV and Excel exports of **all filtered client rows**, with visible columns. Excel is loaded on demand through `spreadsheet-transfer.ts`; CSV quotes fields and neutralizes formulas. Server export buttons belong to the feature toolbar and call its scoped export API.
- `toolbar`: feature-owned actions such as capability-gated import workflows. Imports must retain their feature DTO, API preview/commit authorization and audit semantics.

Sorting works from desktop headers (Shift-click adds secondary sort columns) and the shared toolbar, including on mobile. Both presentations use locale-aware comparisons and number formatting. Controls have 44px touch targets, focus styles and semantic labels. Header scrolling is bounded and sticky. Pagination provides 10/25/50/100 rows and filtered totals. Visibility and density apply across both views; class changes remount the model.

## URL and server state

For URL persistence inside a router, pass the result of `useDataTableUrlQuery("feature-key")` to the table. The adapter preserves unrelated parameters and validates incoming JSON. The books page also stores the selected class in `class`; changing class clears its `books` query state.

For server data, supply **both** `query` and `onQueryChange`, plus `server={{ rowCount }}`. All three query operations (sorting, filtering and pagination) become manual together. The table renders the supplied page without applying a second client filter or slicing it again. The feature owns its API adapter and can use TanStack Query with the authority context and the complete query in its cache key. Pass Query's `signal` to the feature request adapter to cancel obsolete requests. `rowCount` must be the server's filtered total. Never mix a server page with client sorting/filtering.

The current books API returns a class's full book list inside the class response. Books therefore uses client query operations over that authorized list, with TanStack Query refresh/invalidation after create, edit and removal. No server pagination or sort endpoint is claimed or introduced. Book exports cover only the selected class, and bulk removal makes one existing class-book update request after confirmation. It preserves catalog records and unselected class links.

## Scope of the pasted checklist

This implements the checklist's prioritized foundation: reusable state, responsive presentations, search, combined filters, sorting, pagination, actions, feedback, permissions and controlled server integration. The schema is extensible through feature-owned columns, actions, toolbar content and controlled queries.

Workflow-specific features (archive/status changes, duplication, inline/bulk editing, optimistic rollback/undo, soft deletion, import, audit changes, cursor pagination) should be added when an actual feature contract supports them. Specialized presentation features (grouping, virtualization, column resizing/reordering/pinning, saved filter presets, PDF/print/fullscreen, date/numeric/multi-select filters and swipe actions) are not enabled by this foundation. Do not expose controls for unsupported operations.

## Validation

`data-table.test.tsx` covers shared table/card state, filters, URL/server adapters, selection, preferences, keyboard menus, exports, loading/error/empty states, Persian formatting, automated accessibility and bounded rendering for 10,000 records. `BookShelfPage.test.tsx` covers class switching, read-only capabilities, create/attach, contract-safe editing and confirmed bulk removal. `BookEditor.test.tsx` covers delayed teachers, HTTP-compatible IDs, submission locking, retry and Zod validation.
