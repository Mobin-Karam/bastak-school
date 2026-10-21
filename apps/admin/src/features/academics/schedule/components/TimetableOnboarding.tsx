import type { TimetableWorkspace } from "@moshaver/api-contract";
import { Button, Card } from "../../../../shared/ui/ui";
export function timetableSetup(workspace: TimetableWorkspace) {
  const year = workspace.years.find((y) => y.active) ?? workspace.years[0];
  const term =
    workspace.terms.find(
      (t) =>
        t.yearId === year?.id &&
        workspace.versions.some((v) => v.termId === t.id && v.state === "DRAFT"),
    ) ?? workspace.terms.find((t) => t.yearId === year?.id);
  const bell =
    workspace.bells.find((b) =>
      workspace.sessions.some(
        (s) => s.bellId === b.id && workspace.periods.some((p) => p.sessionId === s.id),
      ),
    ) ?? workspace.bells[0];
  const session =
    workspace.sessions.find(
      (s) => s.bellId === bell?.id && workspace.periods.some((p) => p.sessionId === s.id),
    ) ?? workspace.sessions.find((s) => s.bellId === bell?.id);
  const period = workspace.periods.find((p) => p.sessionId === session?.id);
  const draft = workspace.versions.find((v) => v.termId === term?.id && v.state === "DRAFT");
  const steps = [
    {
      kind: "year",
      title: "سال تحصیلی",
      description: "نام سال، تاریخ شروع و پایان و منطقه زمانی مدرسه را مشخص کنید.",
      done: !!year,
    },
    {
      kind: "term",
      title: "نیم‌سال",
      description: "بازه زمانی برنامه را داخل سال تحصیلی تعیین کنید.",
      done: !!term,
      parentId: year?.id,
    },
    {
      kind: "bell",
      title: "برنامه زنگ مدرسه",
      description: "یک برنامه زنگ برای ساعت‌های مدرسه بسازید.",
      done: !!bell,
    },
    {
      kind: "session",
      title: "نوبت آموزشی",
      description: "نوبت صبح یا عصر و ساعت شروع و پایان آن را مشخص کنید.",
      done: !!session,
      parentId: bell?.id,
    },
    {
      kind: "period",
      title: "زنگ‌های درسی",
      description:
        "حداقل یک زنگ با ساعت شروع و پایان در نوبت انتخاب‌شده بسازید. زنگ‌های بیشتری را بعداً می‌توانید اضافه کنید.",
      done: !!period,
      parentId: session?.id,
    },
    {
      kind: "draft",
      title: "پیش‌نویس برنامه",
      description:
        "نسخه‌ای برای ورود درس‌ها بسازید. تا قبل از انتشار، دانش‌آموزان آن را نمی‌بینند.",
      done: !!draft,
    },
  ];
  return { steps, next: steps.findIndex((s) => !s.done), draft };
}
export function TimetableOnboarding({
  workspace,
  canConfigure,
  canCreate,
  canImport,
  onConfigure,
  onCreate,
  onImport,
  onManual,
}: {
  workspace: TimetableWorkspace;
  canConfigure: boolean;
  canCreate: boolean;
  canImport: boolean;
  onConfigure: (kind: string, parentId?: string) => void;
  onCreate: () => void;
  onImport: (id: string) => void;
  onManual: (id: string) => void;
}) {
  const { steps, next, draft } = timetableSetup(workspace);
  return (
    <Card className="grid gap-4 p-4 sm:p-6">
      <div>
        <h2 className="text-lg font-bold">راه‌اندازی برنامه درسی، قدم‌به‌قدم</h2>
        <p className="mt-2 text-sm text-slate-500">
          از مرحله مشخص‌شده شروع کنید. هر مرحله ذخیره می‌شود و پس از بازگشت، می‌توانید از همان‌جا
          ادامه دهید.
        </p>
      </div>
      <p role="status" className="text-sm font-semibold">
        {steps.filter((s) => s.done).length} از {steps.length} مرحله آماده است
      </p>
      <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3" aria-label="مراحل راه‌اندازی برنامه">
        {steps.map((step, index) => (
          <li
            key={step.kind}
            aria-current={index === next ? "step" : undefined}
            className={`rounded-xl border p-3 ${index === next ? "border-brand bg-brand/5" : "border-[rgb(var(--border-subtle))]"}`}
          >
            <span className="text-xs text-slate-500">
              مرحله {index + 1} ·{" "}
              {step.done ? "آماده" : index === next ? "قدم بعدی" : "بعد از مرحله قبل"}
            </span>
            <h3 className="mt-1 font-bold">{step.title}</h3>
            {index === next ? (
              <>
                <p className="my-3 text-sm">{step.description}</p>
                {(step.kind === "draft" ? canCreate : canConfigure) ? (
                  <Button
                    onClick={() =>
                      step.kind === "draft" ? onCreate() : onConfigure(step.kind, step.parentId)
                    }
                  >
                    شروع مرحله: {step.title}
                  </Button>
                ) : (
                  <p className="text-sm">مدیر دارای دسترسی باید این مرحله را تکمیل کند.</p>
                )}
              </>
            ) : null}
            {step.done && canConfigure && ["period", "session"].includes(step.kind) ? (
              <Button
                variant="soft"
                className="mt-2"
                onClick={() => onConfigure(step.kind, step.parentId)}
              >
                {step.kind === "period" ? "افزودن زنگ دیگر" : "افزودن نوبت دیگر"}
              </Button>
            ) : null}
          </li>
        ))}
      </ol>
      {next === -1 && draft ? (
        <div className="grid gap-3 rounded-xl border p-4">
          <h3 className="font-bold">آماده ورود درس‌ها هستید</h3>
          <p className="text-sm">
            کلاس‌ها، کتاب‌ها و حساب استادان را به درس‌ها متصل کنید؛ سپس تداخل‌ها را بررسی و برنامه
            را منتشر کنید.
          </p>
          <div className="flex flex-wrap gap-2">
            {canImport ? (
              <Button onClick={() => onImport(draft.id)}>ورود فایل اکسل به پیش‌نویس</Button>
            ) : null}
            {canCreate ? (
              <Button variant="soft" onClick={() => onManual(draft.id)}>
                افزودن دستی درس‌ها
              </Button>
            ) : null}
          </div>
        </div>
      ) : null}
    </Card>
  );
}
