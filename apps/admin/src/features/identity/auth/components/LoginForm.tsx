import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { Button, Field, Input } from "../../../../shared/ui/ui";
import { useAuth } from "../hooks/useAuth";
import { createLoginSchema, type LoginFormValues } from "../model/login.schema";
import { useAuthLocale } from "../model/auth-locale";
import { checkLoginPhone } from "../api/auth.api";

export function LoginForm() {
  const auth = useAuth();
  const [step, setStep] = useState<"phone" | "password">("phone");
  const [checkingPhone, setCheckingPhone] = useState(false);
  const [error, setError] = useState("");
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

  async function continueWithPhone() {
    setError("");
    if (!(await trigger("phoneNumber"))) return;
    setCheckingPhone(true);
    try {
      const result = await checkLoginPhone(getValues("phoneNumber").trim());
      if (result.exists) setStep("password");
      else setError(copy.phoneNotFound);
    } catch (e) {
      setError(e instanceof Error ? e.message : copy.loginFailed);
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

          try {
            await auth.login(data.phoneNumber, data.password);
          } catch (e) {
            setError(e instanceof Error ? e.message : copy.loginFailed);
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
