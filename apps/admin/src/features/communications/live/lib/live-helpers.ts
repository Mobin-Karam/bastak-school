import { normalizePersianText } from "../../../shared/lib/utils";
import type { LiveEvent, LiveFilter, LiveState, LiveStudent } from "../model/live.types";
import type { AdminLanguage } from "../../../shared/ui/locale";
import { liveActivityCopy, liveStateCopy } from "../model/live-copy";

export function needsAttention(student: LiveStudent) {
  return (
    Number(student.attentionScore || 0) > 0 ||
    student.dueReviews >= 3 ||
    (student.lastExamPercent != null && student.lastExamPercent < 50)
  );
}

export function attentionSignalCount(student: LiveStudent, type: string) {
  return student.attentionSignals?.find((signal) => signal.type === type)?.count || 0;
}

export function filterLiveStudents(list: LiveStudent[], search: string, filter: LiveFilter) {
  const needle = normalizePersianText(search).trim().toLocaleLowerCase("fa");

  return list.filter((student) => {
    const searchable = normalizePersianText(
      [student.name, student.grade, student.major, student.currentView].filter(Boolean).join(" "),
    ).toLocaleLowerCase("fa");

    const state =
      filter === "all" ||
      (filter === "attention" && needsAttention(student)) ||
      (filter === "online" && !!student.presence?.online) ||
      student.state === filter;

    return (!needle || searchable.includes(needle)) && state;
  });
}

export function sortLiveStudents(students: LiveStudent[]) {
  return [...students].sort(
    (a, b) =>
      Number(needsAttention(b)) - Number(needsAttention(a)) ||
      Number(!!b.presence?.online) - Number(!!a.presence?.online) ||
      a.name.localeCompare(b.name, "fa"),
  );
}

export function stateLabel(state: LiveState, language: AdminLanguage = "fa") {
  return liveStateCopy[language][state] || state;
}

export function stateTone(state: LiveState): "neutral" | "green" | "amber" | "blue" {
  return state === "studying" || state === "online"
    ? "green"
    : state === "paused"
      ? "amber"
      : state === "taking_exam"
        ? "blue"
        : "neutral";
}

export function elapsed(now: number, start: string) {
  const seconds = Math.max(0, Math.floor((now - new Date(start).getTime()) / 1000));

  return [Math.floor(seconds / 3600), Math.floor((seconds % 3600) / 60), seconds % 60]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export function activityLabel(type: string, language: AdminLanguage = "fa") {
  return liveActivityCopy[language][type] || type.replaceAll(".", " ");
}

export function activityMeta(event: LiveEvent, language: AdminLanguage = "fa") {
  const data = event.metadata || {};

  return String(
    data.title ||
      data.subject ||
      data.viewLabel ||
      data.view ||
      data.message ||
      liveActivityCopy[language].empty,
  );
}
