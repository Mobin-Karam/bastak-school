# Mobile shared UI

`shared/ui/mobile` is a presentation layer for capability-aware Admin features. It is deliberately not a second application shell, theme, API client, authorization system, or generic component library.

## Inventory

| Area         | Components                                                                                                                                                                                         | Use when                                                                                                                            |
| ------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Layout       | `MobilePageContainer`, `SafeAreaContainer`, `MobileStack`, `MobileGrid`, `MobileSection`, `MobileCard`, `PageHeader`, `CollapsibleSection`                                                         | A route needs consistent phone spacing, sections and safe-area treatment.                                                           |
| Navigation   | `MobileHeader`, `MobileBottomNavigation`, `MobileTabs`, `SegmentedControl`, `NavigationSheet`, `BackButton`, `ContextMenu`, `StickyActionBar`                                                      | A feature needs local mobile navigation or a safe primary action. The Admin shell remains the owner of global navigation.           |
| Lists        | `MobileDataList`, `MobileListItem`, `MobileSelectionList`, `SearchBar`, `FilterChips`, `SortSheet`, `EmptyListState`                                                                               | A compact, task-oriented list is more appropriate than a desktop grid. Prefer `DataTable` when desktop table/card parity is needed. |
| Forms        | `MobileTextField`, `MobileSelect`, `MobileSearchableSelect`, `PersianDatePicker`, `PhoneNumberField`, `NationalCodeField`, `MobileCheckbox`, `MobileRadioGroup`, `FormStepper`, `MobileFileUpload` | Compose existing Field/Input/Select/Checkbox/DatePicker semantics into phone layouts.                                               |
| Sheets       | `MobileBottomSheet`, `ActionSheet`, `ConfirmationDialog`, `DetailSheet`, `FullScreenDialog`                                                                                                        | An existing dialog is not already the right adaptive overlay. `MobileBottomSheet` delegates to `ResponsiveDrawer`.                  |
| Feedback     | `MobileSkeleton`, `LoadingState`, `ErrorState`, `EmptyState`, `OfflineBanner`, `ToastNotification`, `UndoAction`                                                                                   | Show an explicit state; `ToastNotification` is the existing notification adapter.                                                   |
| Data display | `StatisticCard`, `ProgressIndicator`, `ProgressRing`, `StatusBadge`, `Timeline`, `CompactChartContainer`                                                                                           | Summaries and compact operational status. Charts must provide a text alternative.                                                   |

## Rules

- Import from `shared/ui/mobile`; do not import a private feature component into this folder.
- Preserve `/me/context` capability checks and existing React Query/API contracts in the feature. Presentation never authorizes an action.
- Reuse `Button`, `Input`, `Select`, `Checkbox`, `DatePicker`, `ResponsiveDrawer`, `Dialog`, and notifications; do not recreate them for a mobile screen.
- A page normally scrolls through `SharedPageViewport`. Reserve nested scrolling for documented specialist grids/sheets.
- Keep mobile actions at least 44 CSS pixels. Use `start/end` and `ps/pe`; test Persian RTL, English LTR, dark mode, reduced motion and the on-screen keyboard.
- `MobileBottomNavigation` is for a local/test surface only. The live Admin navigation remains `app/layout/navigation/mobile/AdminMobileNavigation.tsx` until an approved shell migration.

## Example

```tsx
<MobilePageContainer>
  <PageHeader title="طلبه‌ها" action={<Button>طلبه جدید</Button>} />
  <MobileSection title="فهرست">
    <SearchBar aria-label="جستجوی طلبه" />
    <MobileDataList label="طلبه‌ها">
      <MobileListItem title="محمد احمدی" description="پایه دوم" onClick={openDetail} />
    </MobileDataList>
  </MobileSection>
</MobilePageContainer>
```
