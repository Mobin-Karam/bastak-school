import { AdminList } from "../../../shared/ui/admin-list";
import type { LearningItem } from "../model/learning-model";
import { LearningFilters } from "./LearningFilters";
import { LearningRow } from "./LearningRow";
import type { LearningFilter } from "../model/learning.types";
import { useLocale } from "../../../shared/ui/locale";
import { learningCopy } from "../learning-locale";

export function LearningList({
  loading,
  items,
  search,
  filter,
  formatDate,
  onSearchChange,
  onFilterChange,
  onEdit,
  onReview,
  onHistory,
  onDelete,
}: {
  loading: boolean;
  items: LearningItem[];
  search: string;
  filter: LearningFilter;
  formatDate: (value?: string | Date) => string;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: LearningFilter) => void;
  onEdit?: (item: LearningItem) => void;
  onReview?: (item: LearningItem) => void;
  onHistory: (item: LearningItem) => void;
  onDelete?: (item: LearningItem) => void;
}) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  return (
    <AdminList
      label={copy.resources}
      description={copy.resourcesDescription}
      items={items}
      loading={loading}
      emptyTitle={copy.noResults}
      stickyHeader
      scrollable
      contentLabel={copy.resources}
      className="max-h-[calc(100dvh-22rem)]"
      toolbar={
        <LearningFilters
          search={search}
          filter={filter}
          resultCount={items.length}
          onSearchChange={onSearchChange}
          onFilterChange={onFilterChange}
        />
      }
    >
      <div className="grid gap-2 ps-1 pb-1">
        {items.map((item) => (
          <LearningRow
            key={item.id}
            item={item}
            formatDate={formatDate}
            onEdit={onEdit ? () => onEdit(item) : undefined}
            onReview={onReview ? () => onReview(item) : undefined}
            onHistory={() => onHistory(item)}
            onDelete={onDelete ? () => onDelete(item) : undefined}
          />
        ))}
      </div>
    </AdminList>
  );
}
