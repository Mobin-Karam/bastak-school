import { Badge, Select } from "../../../shared/ui/ui";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import type { LearningFilter } from "../model/learning.types";
import { useLocale } from "../../../shared/ui/locale";
import { learningCopy } from "../learning-locale";

export function LearningFilters({
  search,
  filter,
  resultCount,
  onSearchChange,
  onFilterChange,
}: {
  search: string;
  filter: LearningFilter;
  resultCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: LearningFilter) => void;
}) {
  const { language } = useLocale();
  const copy = learningCopy(language);
  return (
    <div className="mb-3">
      <CollectionToolbar
        search={search}
        onSearchChange={onSearchChange}
        placeholder={copy.search}
        onClear={search ? () => onSearchChange("") : undefined}
        filters={
          <Select
            className="h-8 min-w-32 border-0 bg-transparent px-2 text-xs shadow-none"
            aria-label={copy.resources}
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as LearningFilter)}
          >
            <option value="all">{copy.all}</option>
            <option value="due">{copy.due}</option>
            <option value="pending">{copy.pending}</option>
            <option value="done">{copy.done}</option>
            <option value="archived">{copy.archived}</option>
          </Select>
        }
        resultLabel={
          <Badge tone={resultCount ? "blue" : "neutral"}>
            {resultCount.toLocaleString(language === "fa" ? "fa-IR" : "en-US")} {copy.results}
          </Badge>
        }
      />
    </div>
  );
}
