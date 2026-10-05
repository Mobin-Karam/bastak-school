import { useState } from "react";
import { Card, Button } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import { LiveControls } from "../components/LiveControls";
import { LiveHeader } from "../components/LiveHeader";
import { LiveSummaryGrid } from "../components/LiveSummaryGrid";
import { StudentDetailPanel } from "../components/StudentDetailPanel";
import { StudentQueue } from "../components/StudentQueue";
import { TimelinePanel } from "../components/TimelinePanel";
import { useLiveClock } from "../hooks/useLiveClock";
import { useLiveData } from "../hooks/useLiveData";
import { useLiveStudents } from "../hooks/useLiveStudents";
import type { LiveFilter, LivePanel } from "../model/live.types";
import { liveCopy } from "../model/live-copy";

export function LivePage() {
  const { formatDateTime, language } = useLocale();
  const copy = liveCopy[language];

  const [search, setSearch] = useState("");

  const [filter, setFilter] = useState<LiveFilter>("all");

  const [selectedId, setSelectedId] = useState("");

  const [panel, setPanel] = useState<LivePanel>("students");

  const clock = useLiveClock();

  const live = useLiveData();

  const students = useLiveStudents({
    students: live.data?.students || [],
    search,
    filter,
  });

  const summary = live.data?.summary || {};

  const selected = students.find((student) => student.id === selectedId) || students[0];

  return (
    <div className="flex h-[calc(100dvh-132px)] min-h-0 flex-col gap-3 overflow-hidden lg:h-[calc(100dvh-96px)]">
      <LiveHeader
        generatedAt={live.data?.generatedAt}
        fetching={live.isFetching}
        formatDateTime={formatDateTime}
        onRefresh={() => {
          void live.refetch();
        }}
      />

      {live.isError ? (
        <Card className="border-rose-200 bg-rose-50 text-rose-800">
          <strong>{copy.loadFailed}</strong>

          <p className="mt-1 text-sm">{copy.loadFailedHint}</p>

          <Button
            className="mt-3"
            variant="danger"
            onClick={() => {
              void live.refetch();
            }}
          >
            {copy.retry}
          </Button>
        </Card>
      ) : null}

      <LiveSummaryGrid summary={summary} filter={filter} onFilterChange={setFilter} />

      <LiveControls
        search={search}
        filter={filter}
        panel={panel}
        visibleCount={students.length}
        totalCount={summary.total || 0}
        onSearchChange={setSearch}
        onFilterChange={setFilter}
        onPanelChange={setPanel}
      />

      <section className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[minmax(360px,.9fr)_minmax(320px,.75fr)_minmax(300px,.65fr)]">
        <StudentQueue
          panel={panel}
          loading={live.isLoading}
          students={students}
          selectedId={selected?.id}
          now={clock}
          onSelect={setSelectedId}
        />

        <StudentDetailPanel
          panel={panel}
          student={selected}
          now={clock}
          formatDateTime={formatDateTime}
        />

        <TimelinePanel
          panel={panel}
          loading={live.isLoading}
          events={live.data?.timeline || []}
          formatDateTime={formatDateTime}
        />
      </section>
    </div>
  );
}
