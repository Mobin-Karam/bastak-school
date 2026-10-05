import { AlertTriangle, ExternalLink, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { fa } from "../../../shared/lib/utils";
import { Badge } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import {
  attentionSignalCount,
  elapsed,
  needsAttention,
  stateLabel,
  stateTone,
} from "../lib/live-helpers";
import type { LiveStudent } from "../model/live.types";
import { MiniMetric } from "./MiniMetric";
import { liveCopy } from "../model/live-copy";

export function StudentDetail({
  student,
  now,
  formatDateTime,
}: {
  student: LiveStudent;
  now: number;
  formatDateTime: (value?: string | Date) => string;
}) {
  const { language } = useLocale();
  const copy = liveCopy[language];
  const number = (value: number) => (language === "fa" ? fa(value) : value.toLocaleString("en-US"));
  return (
    <div className="min-h-0 flex-1 overflow-y-auto p-3">
      <div className="flex items-center gap-3">
        <span className="grid size-11 place-items-center rounded-full bg-indigo-50 font-black text-brand">
          {student.name.slice(0, 1)}
        </span>

        <div className="min-w-0 flex-1">
          <strong className="block truncate">{student.name}</strong>

          <small className="text-slate-500">
            {[student.grade, student.major].filter(Boolean).join(" • ") || copy.noAcademic}
          </small>
        </div>

        <Badge tone={stateTone(student.state)}>{stateLabel(student.state)}</Badge>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 p-3">
        <small className="text-slate-500">{copy.currentActivity}</small>

        <strong className="mt-1 block truncate text-sm">
          {student.activeSession?.title ||
            student.currentView ||
            (student.presence?.online ? copy.inApp : copy.noCurrentActivity)}
        </strong>

        <span className="mt-1 block text-xs text-slate-500">
          {student.activeSession?.subject ||
            student.presence?.deviceLabel ||
            (student.lastActivityAt
              ? `${copy.lastPresence} ${formatDateTime(student.lastActivityAt)}`
              : copy.noPresence)}
        </span>

        {student.activeSession?.startedAt ? (
          <strong className="mt-2 block font-mono text-lg text-brand" dir="ltr">
            {elapsed(now, student.activeSession.startedAt)}
          </strong>
        ) : null}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniMetric label={copy.remainingTasks} value={number(student.remainingTasks)} />

        <MiniMetric
          label={copy.openRequest}
          value={number(attentionSignalCount(student, "OPEN_RECOVERY"))}
          warn={attentionSignalCount(student, "OPEN_RECOVERY") > 0}
        />

        <MiniMetric
          label={copy.openIssue}
          value={number(attentionSignalCount(student, "TASK_ISSUE"))}
          warn={attentionSignalCount(student, "TASK_ISSUE") > 0}
        />
      </div>

      {needsAttention(student) ? (
        <div className="mt-3 flex gap-2 rounded-lg bg-amber-50 p-2 text-xs font-semibold text-amber-800">
          <AlertTriangle size={15} />
          {copy.priorityFollowUp}
        </div>
      ) : null}

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Link
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md border text-sm font-semibold hover:bg-slate-50"
          to={`/admin/students?studentId=${encodeURIComponent(student.id)}`}
        >
          <ExternalLink size={15} />
          {copy.profile}
        </Link>

        <Link
          className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-brand text-sm font-semibold text-white"
          to={`/admin/communication/chat?studentId=${encodeURIComponent(student.id)}`}
        >
          <MessageCircle size={15} />
          {copy.message}
        </Link>
      </div>
    </div>
  );
}
