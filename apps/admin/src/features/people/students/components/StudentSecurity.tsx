import {
  ArchiveRestore,
  Eye,
  EyeOff,
  KeyRound,
  LogOut,
  Power,
  ShieldCheck,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import type { Student } from "../../../shared/types/domain";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import { Button, Field, Input } from "../../../shared/ui/ui";
import { studentCopy } from "../model/student-locale";
import { getStudentStatus, getStudentStatusCopy } from "./student-ui";

export function StudentSecurity({
  student,
  password,
  setPassword,
  onPassword,
  onArchive,
  onLifecycle,
  busy,
}: {
  student: Student;
  password: string;
  setPassword: (value: string) => void;
  onPassword: () => void;
  onArchive: () => void;
  onLifecycle: (action: "activate" | "deactivate" | "restore" | "force-logout") => void;
  busy: { remove: boolean; password: boolean; lifecycle: boolean };
}) {
  const [showPassword, setShowPassword] = useState(false);
  const language = useOptionalAdminLanguage();
  const copy = studentCopy[language];
  const status = getStudentStatus(student);
  const statusCopy = getStudentStatusCopy(status, language);

  return (
    <section className="grid gap-4" aria-labelledby="student-security-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck size={18} className="text-brand" />
            <h3 id="student-security-heading" className="text-sm font-black text-ink">
              {copy.securityTitle}
            </h3>
          </div>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.securityDescription}
          </p>
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${statusCopy.className}`}>
          {statusCopy.label}
        </span>
      </div>

      {status !== "archived" ? (
        <div className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
          <div>
            <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
              {copy.password}
            </h4>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {copy.passwordDescription}
            </p>
          </div>
          <Field
            label={copy.newPassword}
            error={password && password.length < 8 ? copy.passwordMinimum : undefined}
          >
            <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
              <Input
                dir="ltr"
                autoComplete="new-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={copy.passwordPlaceholder}
              />
              <Button
                variant="soft"
                className="px-3"
                aria-label={showPassword ? copy.hidePassword : copy.showPassword}
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </Button>
            </div>
          </Field>
          <Button
            loading={busy.password}
            variant="soft"
            disabled={password.length < 8 || busy.password}
            onClick={onPassword}
          >
            <KeyRound size={16} />
            {copy.changePassword}
          </Button>
        </div>
      ) : null}

      <div className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {copy.accountAccess}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.accountAccessDescription}
          </p>
        </div>
        <div className="grid gap-2 sm:grid-cols-2">
          {status !== "archived" ? (
            <Button
              loading={busy.lifecycle}
              variant="soft"
              disabled={busy.lifecycle}
              onClick={() => onLifecycle("force-logout")}
            >
              <LogOut size={16} />
              {copy.forceLogout}
            </Button>
          ) : null}
          {status === "archived" ? (
            <Button
              loading={busy.lifecycle}
              disabled={busy.lifecycle}
              onClick={() => onLifecycle("restore")}
            >
              <ArchiveRestore size={16} />
              {copy.restoreAccount}
            </Button>
          ) : (
            <Button
              loading={busy.lifecycle}
              variant="soft"
              disabled={busy.lifecycle}
              onClick={() => onLifecycle(status === "inactive" ? "activate" : "deactivate")}
            >
              <Power size={16} />
              {status === "inactive" ? copy.activateAccount : copy.deactivateAccount}
            </Button>
          )}
        </div>
      </div>

      {status !== "archived" ? (
        <div className="grid gap-3 rounded-xl border border-rose-200 bg-rose-50/60 p-3 dark:border-rose-900 dark:bg-rose-950/20">
          <div>
            <h4 className="text-sm font-bold text-rose-800 dark:text-rose-200">
              {copy.sensitiveArea}
            </h4>
            <p className="mt-1 text-xs text-rose-700/80 dark:text-rose-300/80">
              {copy.sensitiveAreaDescription}
            </p>
          </div>
          <Button loading={busy.remove} variant="danger" disabled={busy.remove} onClick={onArchive}>
            <Trash2 size={16} />
            {copy.archiveAccount}
          </Button>
        </div>
      ) : null}
    </section>
  );
}
