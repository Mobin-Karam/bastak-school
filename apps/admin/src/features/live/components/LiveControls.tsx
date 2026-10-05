import { fa } from "../../../shared/lib/utils";
import { Card, Select } from "../../../shared/ui/ui";
import { CollectionToolbar } from "../../../shared/ui/collection-toolbar";
import { SegmentedControl } from "../../../shared/ui/segmented-control";
import { useLocale } from "../../../shared/ui/locale";
import { liveCopy } from "../model/live-copy";
import type { LiveFilter, LivePanel } from "../model/live.types";

export function LiveControls({
  search,
  filter,
  panel,
  visibleCount,
  totalCount,
  onSearchChange,
  onFilterChange,
  onPanelChange,
}: {
  search: string;
  filter: LiveFilter;
  panel: LivePanel;
  visibleCount: number;
  totalCount: number;
  onSearchChange: (value: string) => void;
  onFilterChange: (value: LiveFilter) => void;
  onPanelChange: (value: LivePanel) => void;
}) {
  const { language } = useLocale();
  const copy = liveCopy[language];
  return (
    <Card className="shrink-0 p-2">
      <CollectionToolbar
        search={search}
        onSearchChange={onSearchChange}
        searchLabel={copy.searchStudents}
        placeholder={copy.searchPlaceholder}
        onClear={search ? () => onSearchChange("") : undefined}
        resultLabel={`${copy.result} ${language === "fa" ? fa(visibleCount) : visibleCount.toLocaleString("en-US")} ${language === "fa" ? "از" : "of"} ${language === "fa" ? fa(totalCount) : totalCount.toLocaleString("en-US")}`}
        filters={
          <Select
            className="h-8 min-w-36 border-0 bg-transparent px-2 text-xs shadow-none"
            aria-label={copy.statusFilter}
            value={filter}
            onChange={(event) => onFilterChange(event.target.value as LiveFilter)}
          >
            <option value="all">{copy.allStatuses}</option>
            <option value="online">{copy.online}</option>
            <option value="studying">{copy.studying}</option>
            <option value="paused">{copy.paused}</option>
            <option value="taking_exam">{copy.takingExam}</option>
            <option value="attention">{copy.attention}</option>
            <option value="offline">{copy.offline}</option>
          </Select>
        }
        actions={
          <SegmentedControl
            className="lg:hidden"
            ariaLabel={copy.livePanel}
            value={panel}
            onValueChange={onPanelChange}
            options={[
              { value: "students", label: copy.list },
              { value: "details", label: copy.details },
              { value: "timeline", label: copy.events },
            ]}
          />
        }
      />
    </Card>
  );
}
