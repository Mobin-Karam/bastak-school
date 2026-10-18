import { Eye, EyeOff, KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Button, Card, Field, Input } from "../../../shared/ui/ui";
import { useLocale } from "../../../shared/ui/locale";
import type { PasswordDraft } from "../model/system.types";
import { systemCopy } from "../system-locale";
export function AccountSecurityPanel({
  passwords,
  setPasswords,
  busy,
  onSubmit,
}: {
  passwords: PasswordDraft;
  setPasswords: (next: PasswordDraft) => void;
  busy: boolean;
  onSubmit: () => void;
}) {
  const { language } = useLocale();
  const copy = systemCopy(language);
  const [visible, setVisible] = useState(false);
  const longEnough = passwords.newPassword.length >= 12;
  const matches = passwords.newPassword === passwords.confirmPassword;
  const valid = Boolean(passwords.currentPassword) && longEnough && matches;
  return (
    <Card className="h-full p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-lg bg-emerald-50 text-emerald-700">
          <ShieldCheck size={20} />
        </span>
        <div>
          <h3 className="font-bold">{copy.passwordTitle}</h3>
          <p className="text-xs text-slate-500">{copy.passwordDescription}</p>
        </div>
      </div>
      <div className="grid gap-3">
        <Field label={copy.currentPassword}>
          <Input
            autoComplete="current-password"
            type={visible ? "text" : "password"}
            value={passwords.currentPassword}
            onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
          />
        </Field>
        <Field label={copy.newPassword}>
          <Input
            autoComplete="new-password"
            type={visible ? "text" : "password"}
            value={passwords.newPassword}
            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
          />
        </Field>
        <Field label={copy.confirmNewPassword}>
          <Input
            autoComplete="new-password"
            type={visible ? "text" : "password"}
            value={passwords.confirmPassword}
            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
          />
        </Field>
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className={longEnough ? "text-emerald-700" : "text-slate-500"}>
            {copy.passwordRequirement}
          </span>
          <button
            type="button"
            className="inline-flex items-center gap-1 text-brand"
            onClick={() => setVisible((value) => !value)}
          >
            {visible ? <EyeOff size={14} /> : <Eye size={14} />}{" "}
            {visible ? copy.hidePasswords : copy.showPasswords}
          </button>
        </div>
        {passwords.confirmPassword && !matches ? (
          <p className="text-xs text-rose-600" role="alert">
            {copy.passwordMismatch}
          </p>
        ) : null}
        <Button loading={busy} disabled={!valid || busy} onClick={onSubmit}>
          <KeyRound size={16} />
          {copy.changePassword}
        </Button>
      </div>
    </Card>
  );
}
