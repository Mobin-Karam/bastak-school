import { useMemo } from "react";
import { filterLiveStudents, sortLiveStudents } from "../lib/live-helpers";
import type { LiveFilter, LiveStudent } from "../model/live.types.ts";

export function useLiveStudents({
  students,
  search,
  filter,
}: {
  students: LiveStudent[];
  search: string;
  filter: LiveFilter;
}) {
  return useMemo(
    () => sortLiveStudents(filterLiveStudents(students, search, filter)),
    [students, search, filter],
  );
}
