import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Field, Input } from "../../../../shared/ui/ui";
import { ApiError } from "../../../../shared/api/api";
import { useAuth } from "../hooks/useAuth";
import { createLoginSchema, type LoginFormValues } from "../model/login.schema";
import { useAuthLocale } from "../model/auth-locale";
import { checkLoginPhone } from "../api/auth.api";

export function LoginForm() {
  const auth = useAuth();
  const [step, setStep] = useState<"phone" | "password">("phone");
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [error, setError] = useState("");
  const [portalUrl, setPortalUrl] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { copy, direction } = useAuthLocale();

  const { register, handleSubmit, formState, setValue, trigger, getValues, setFocus } =
    useForm<LoginFormValues>({
      resolver: zodResolver(createLoginSchema(copy)),
      defaultValues: {
        phoneNumber: "",
        password: "",
      },
    });

  const checking = auth.status === "checking" || auth.status === "logging-out";

  useEffect(() => {
    if (step === "password") setFocus("password");
    else setFocus("phoneNumber");
  }, [step, setFocus]);

  const busy = checking || checkingPhone || formState.isSubmitting;

  function showLoginError(error: unknown) {
    setPortalUrl(null);
    if (error instanceof ApiError && error.code === "PORTAL_DOMAIN_MISMATCH") {
      const url =
        error.details &&
        typeof error.details === "object" &&
        "portalUrl" in error.details &&
        typeof error.details.portalUrl === "string"
          ? error.details.portalUrl
          : null;
      if (url && /^https:\/\/(?:app|stud)\.sultano\.ir$/.test(url)) setPortalUrl(url);
    }
    setError(error instanceof Error ? error.message : copy.loginFailed);
  }

  async function continueWithPhone() {
    setError("");
    setPortalUrl(null);
    if (!(await trigger("phoneNumber"))) return;
    setCheckingPhone(true);
    try {
      const result = await checkLoginPhone(getValues("phoneNumber").trim());
      if (result.exists) setStep("password");
      else setError(copy.phoneNotFound);
    } catch (e) {
      showLoginError(e);
    } finally {
      setCheckingPhone(false);
    }
  }

  return (
    <form
      className="grid gap-3"
      onSubmit={(event) => {
        if (busy) {
          event.preventDefault();
          return;
        }
        if (step === "phone") {
          event.preventDefault();
          void continueWithPhone();
          return;
        }
        void handleSubmit(async (data) => {
          setError("");
          setPortalUrl(null);

          try {
            await auth.login(data.phoneNumber, data.password);
          } catch (e) {
            showLoginError(e);
          }
        })(event);
      }}
    >
      {step === "phone" ? (
        <Field label={copy.phoneNumber} error={formState.errors.phoneNumber?.message}>
          <Input
            className="h-12"
            dir="ltr"
            autoComplete="tel"
            inputMode="tel"
            placeholder="09123456789"
            disabled={busy}
            {...register("phoneNumber")}
          />
        </Field>
      ) : (
        <div className="flex items-center justify-between gap-3 text-sm">
          <span dir="ltr">{getValues("phoneNumber")}</span>
          <button
            type="button"
            disabled={busy}
            className="min-h-10 rounded-lg px-2 text-xs font-bold text-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            onClick={() => {
              setStep("phone");
              setValue("password", "");
              setShowPassword(false);
              setError("");
              setPortalUrl(null);
            }}
          >
            {copy.changePhone}
          </button>
        </div>
      )}

      {step === "password" ? (
        <Field label={copy.password} error={formState.errors.password?.message}>
          <div className="relative">
            <Input
              className={direction === "rtl" ? "h-12 pl-11" : "h-12 pr-11"}
              dir="ltr"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              disabled={busy}
              {...register("password")}
            />

            <button
              type="button"
              className={[
                "absolute inset-y-0 grid w-11 place-items-center text-slate-500",
                direction === "rtl" ? "left-0" : "right-0",
              ].join(" ")}
              disabled={busy}
              aria-label={showPassword ? copy.hidePassword : copy.showPassword}
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
        </Field>
      ) : null}

      {/* {import.meta.env.DEV ? (
        <DemoAccountPicker
          onSelect={(phoneNumber, password) => {
            setValue("phoneNumber", phoneNumber, { shouldValidate: true });
            setValue("password", password, { shouldValidate: true });
            setError("");
            setStep("password");
          }}
        />
      ) : null} */}

      {auth.message || error ? (
        <p
          role="alert"
          className={[
            "rounded-xl border p-3.5 text-sm",
            checking && !error ? "bg-sky-50 text-sky-800" : "bg-rose-50 text-rosewood",
          ].join(" ")}
        >
          {error || auth.message}
          {portalUrl ? (
            <a
              href={portalUrl}
              className="mt-2 block w-fit font-black text-brand underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              {portalUrl}
            </a>
          ) : null}
        </p>
      ) : null}

      <Button className="h-12 w-full text-[15px]" disabled={busy}>
        {checking
          ? copy.restoringSession
          : checkingPhone
            ? copy.checkingPhone
            : formState.isSubmitting
              ? copy.signingIn
              : step === "phone"
                ? copy.continueLogin
                : copy.signIn}
      </Button>
    </form>
  );
}
