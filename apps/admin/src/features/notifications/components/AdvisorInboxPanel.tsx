import type { ComponentProps } from "react";
import { StudentPicker } from "../../../shared/ui/StudentPicker";
import { AdminList } from "../../../shared/ui/admin-list";
import { Badge } from "../../../shared/ui/ui";
import type {
  AdvisorInboxRow,
  RecoveryActionInput,
  TaskIssueActionInput,
} from "../model/notification.types";
import { AdvisorInboxItem } from "./AdvisorInboxItem";
import { useLocale } from "../../../shared/ui/locale";
import { notificationCopy } from "../model/notification-copy";

type StudentPickerProps = ComponentProps<typeof StudentPicker>;

export function AdvisorInboxPanel({
  mobilePanel,
  rows,
  students,
  studentId,
  loading,
  error,
  recoveryPendingId,
  issuePendingId,
  onStudentChange,
  onRetry,
  onRecovery,
  onIssue,
  canManageRecovery,
  canManageIssues,
}: {
  mobilePanel: "notifications" | "inbox";
  rows: AdvisorInboxRow[];
  students: StudentPickerProps["students"];
  studentId: string;
  loading: boolean;
  error: boolean;
  recoveryPendingId: string;
  issuePendingId: string;
  onStudentChange: (id: string) => void;
  onRetry: () => void;
  onRecovery: (input: RecoveryActionInput) => Promise<boolean>;
  onIssue: (input: TaskIssueActionInput) => Promise<boolean>;
  canManageRecovery: boolean;
  canManageIssues: boolean;
}) {
  const { language } = useLocale();
  const copy = notificationCopy[language];
  const actionableCount = rows.filter((row) =>
    row.kind === "recovery" ? canManageRecovery : row.kind === "issue" ? canManageIssues : false,
  ).length;

  return (
    <AdminList
      label={copy.inbox}
      description={copy.inboxDescription}
      items={rows}
      loading={loading}
      error={error}
      errorTitle={copy.inboxFailed}
      onRetry={onRetry}
      className={[
        mobilePanel === "notifications" ? "hidden lg:flex" : "flex",
        "min-h-0 flex-col dark:border-slate-800 dark:bg-slate-900",
      ].join(" ")}
      contentClassName="min-h-0 flex-1 overflow-hidden"
      stickyHeader
      emptyTitle={copy.noItems}
      actions={
        <div className="flex items-center gap-1.5">
          {actionableCount ? (
            <Badge tone="red">
              {actionableCount.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}{" "}
              {copy.operational}
            </Badge>
          ) : null}
          <Badge tone={rows.length ? "amber" : "green"}>
            {rows.length.toLocaleString(language === "fa" ? "fa-IR" : "en-US")}
          </Badge>
        </div>
      }
      toolbar={<StudentPicker students={students} value={studentId} onChange={onStudentChange} />}
    >
      <div className="grid h-full min-h-0 gap-2 overflow-y-auto overscroll-contain [scrollbar-gutter:stable]">
        {rows.map((row) => (
          <AdvisorInboxItem
            key={row.key}
            row={row}
            recoveryPendingId={recoveryPendingId}
            issuePendingId={issuePendingId}
            onRecovery={onRecovery}
            onIssue={onIssue}
            canManageRecovery={canManageRecovery}
            canManageIssues={canManageIssues}
          />
        ))}
      </div>
    </AdminList>
  );
}
