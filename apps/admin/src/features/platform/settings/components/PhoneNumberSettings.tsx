import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useAuth } from "../../../identity/auth";
import { notify } from "../../../../shared/ui/notifications";
import { Button, Card, Field, Input, Textarea } from "../../../../shared/ui/ui";
import {
  changeOwnPhoneNumber,
  getAccountProfile,
  requestPhoneNumberChange,
} from "../api/settings.api.ts";

export function PhoneNumberSettings() {
  const auth = useAuth();
  const queryClient = useQueryClient();
  const profile = useQuery({ queryKey: ["account", "profile"], queryFn: getAccountProfile });
  const [phoneNumber, setPhoneNumber] = useState("");
  const [reason, setReason] = useState("");
  const canSelfManage = auth.canAny([
    "attendance.self.read",
    "guardian.students.read",
    "platform.phone.self.manage",
  ]);
  const submit = useMutation<unknown, Error, void>({
    mutationFn: () => {
      if (profile.data?.phoneNumberChangeAvailable) return changeOwnPhoneNumber(phoneNumber);
      const organizationId = auth.context?.activeOrganization?.id;
      if (!organizationId) throw new Error("مدرسه فعال برای ثبت درخواست پیدا نشد.");
      return requestPhoneNumberChange({ organizationId, phoneNumber, reason });
    },
    onSuccess: () => {
      setPhoneNumber("");
      setReason("");
      void queryClient.invalidateQueries({ queryKey: ["account", "profile"] });
      notify(
        profile.data?.phoneNumberChangeAvailable
          ? "شماره همراه شما تغییر کرد."
          : "درخواست تغییر شماره برای بررسی مدرسه ثبت شد.",
        "success",
      );
    },
    onError: (error) =>
      notify(error instanceof Error ? error.message : "تغییر شماره انجام نشد.", "error"),
  });
  if (!canSelfManage) return null;
  const unlimited = profile.data?.phoneNumberChangeUnlimited === true;
  const firstChange = profile.data?.phoneNumberChangeAvailable !== false;
  return (
    <Card className="p-4">
      <div className="flex items-start gap-3">
        <span className="grid size-10 place-items-center rounded-xl bg-brand/10 text-brand">
          <Phone size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-black">شماره همراه</h2>
          <p className="mt-1 text-xs leading-5 text-slate-500">
            {unlimited
              ? "مدیر پلتفرم می‌تواند شماره ورود خود را هر زمان تغییر دهد. نشست‌های دیگر پس از تغییر بسته می‌شوند."
              : firstChange
                ? "یک‌بار می‌توانید شماره ورود خود را بدون بررسی تغییر دهید."
                : "تغییر بعدی پس از بررسی مدیر مدرسه اعمال می‌شود."}
          </p>
        </div>
      </div>
      <div className="mt-4 grid gap-3">
        <Field label="شماره فعلی">
          <Input readOnly value={profile.data?.phoneNumber ?? "—"} />
        </Field>
        <Field label="شماره همراه جدید">
          <Input
            dir="ltr"
            inputMode="tel"
            placeholder="0912xxxxxxx"
            value={phoneNumber}
            onChange={(event) => setPhoneNumber(event.target.value)}
          />
        </Field>
        {!firstChange && !unlimited ? (
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
          disabled={!/^09\d{9}$/.test(phoneNumber)}
          onClick={() => submit.mutate()}
        >
          <ShieldCheck size={16} /> {unlimited || firstChange ? "تغییر شماره" : "ثبت درخواست بررسی"}
        </Button>
      </div>
    </Card>
  );
}
