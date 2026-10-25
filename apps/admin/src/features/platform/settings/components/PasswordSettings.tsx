import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { KeyRound, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../identity/auth";
import { notify } from "../../../../shared/ui/notifications";
import { Button, Card, Field, PasswordInput, Textarea } from "../../../../shared/ui/ui";
import { changePassword, getAccountProfile, requestPasswordChange } from "../api/settings.api";

export function PasswordSettings() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({
    queryKey: ["account", "profile"],
    queryFn: getAccountProfile,
  });
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [reason, setReason] = useState("");
  const englishPassword = (value: string) => value.replace(/[^\x21-\x7E]/g, "");
  const canDirectChange = profile.data?.passwordChangeAvailable !== false;
  const remainingChanges = Math.max(0, 3 - (profile.data?.passwordChangeCount ?? 0));
  const submit = useMutation<unknown, Error, void>({
    mutationFn: () => {
      if (newPassword !== confirmPassword) throw new Error("تکرار رمز جدید یکسان نیست.");
      if (canDirectChange) return changePassword({ currentPassword, newPassword });
      const organizationId = auth.context?.activeOrganization?.id;
      if (!organizationId) throw new Error("مدرسه فعال برای ثبت درخواست پیدا نشد.");
      return requestPasswordChange({
        organizationId,
        currentPassword,
        newPassword,
        reason,
      });
    },
    onSuccess: () => {
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["account", "profile"] });
      void queryClient.invalidateQueries({ queryKey: ["sessions"] });
      notify(
        canDirectChange
          ? "رمز عبور شما تغییر کرد و نشست‌های دیگر بسته شدند."
          : "درخواست تغییر رمز برای بررسی مدرسه ثبت شد.",
        "success",
      );
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "تغییر رمز انجام نشد.", "error"),
  });

  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <KeyRound size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-black">رمز عبور</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {canDirectChange
              ? `${remainingChanges} تغییر مستقیم رمز باقی مانده است. رمز جدید باید حداقل ۱۲ نویسه انگلیسی باشد؛ پس از سه تغییر، درخواست باید توسط مسئول یا مدیر مدرسه تأیید شود.`
              : "سقف سه تغییر مستقیم تکمیل شده است؛ رمز جدید فقط پس از تأیید مسئول یا مدیر مدرسه اعمال می‌شود."}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <Field label="رمز فعلی">
          <PasswordInput
            autoComplete="current-password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
          />
        </Field>
        <Field label="رمز جدید">
          <PasswordInput
            autoComplete="new-password"
            minLength={12}
            pattern="[\\x21-\\x7E]+"
            value={newPassword}
            onChange={(event) => setNewPassword(englishPassword(event.target.value))}
          />
        </Field>
        <Field label="تکرار رمز جدید">
          <PasswordInput
            autoComplete="new-password"
            minLength={12}
            pattern="[\\x21-\\x7E]+"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(englishPassword(event.target.value))}
          />
        </Field>
        {!canDirectChange ? (
          <Field label="دلیل درخواست">
            <Textarea
              maxLength={500}
              value={reason}
              onChange={(event) => setReason(event.target.value)}
            />
          </Field>
        ) : null}
        <Button
          loading={submit.isPending}
          disabled={
            currentPassword.length === 0 || newPassword.length < 12 || confirmPassword.length === 0
          }
          onClick={() => submit.mutate()}
        >
          <ShieldCheck size={16} /> {canDirectChange ? "تغییر رمز" : "ثبت درخواست بررسی"}
        </Button>
      </div>
    </Card>
  );
}
