import { ChevronDown, UserRoundCheck } from "lucide-react";
import { useAuthLocale } from "../model/auth-locale";

export const demoAccounts = [
  { role: "platformAdmin", username: "admin", password: "anonymous" },
  { role: "organizationAdmin", username: "demo.orgadmin.a", password: "Moshaver-demo-2026!", organizationFa: "آکادمی راه روشن", organizationEn: "Roshan Path Academy" },
  { role: "organizationAdmin", username: "demo.orgadmin.b", password: "Moshaver-demo-2026!", organizationFa: "دبیرستان دانش فردا", organizationEn: "Tomorrow Knowledge School" },
  { role: "organizationAdmin", username: "demo.orgadmin.c", password: "Moshaver-demo-2026!", organizationFa: "مرکز مشاوره مسیر رشد", organizationEn: "Growth Path Counseling Center" },
  { role: "advisor", username: "demo.advisor.a", password: "Moshaver-demo-2026!", organizationFa: "آکادمی راه روشن", organizationEn: "Roshan Path Academy" },
  { role: "advisor", username: "demo.advisor.b", password: "Moshaver-demo-2026!", organizationFa: "دبیرستان دانش فردا", organizationEn: "Tomorrow Knowledge School" },
  { role: "advisor", username: "demo.advisor.c", password: "Moshaver-demo-2026!", organizationFa: "مرکز مشاوره مسیر رشد", organizationEn: "Growth Path Counseling Center" },
] as const;

export function DemoAccountPicker({
  onSelect,
}: {
  onSelect: (username: string, password: string) => void;
}) {
  const { copy, language } = useAuthLocale();
  return (
    <details className="group rounded-xl border border-dashed border-brand/30 bg-brand/5 p-3">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-2 text-sm font-bold text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20">
        <span className="flex items-center gap-2">
          <UserRoundCheck size={17} className="text-brand" />
          {copy.demoTitle}
        </span>
        <ChevronDown size={16} className="transition group-open:rotate-180" />
      </summary>
      <p className="mt-2 text-xs text-slate-500">
        {copy.demoInstruction} <code dir="ltr">npm run seed</code> {copy.demoInstructionSuffix}
      </p>
      <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-200">{copy.demoPasswordNotice}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {demoAccounts.map((account) => {
          const role = copy.demoRoles[account.role];
          return (
            <button
              key={account.username}
              type="button"
              className="rounded-xl border border-slate-200 bg-white p-2.5 text-start transition hover:border-brand/40 hover:bg-brand/5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand/20 dark:border-slate-800 dark:bg-slate-950"
              onClick={() => onSelect(account.username, account.password)}
            >
              <strong className="block text-sm">{role.label}</strong>
              <span className="mt-0.5 block text-[11px] text-slate-500">{role.description}</span>
              {"organizationFa" in account ? <span className="mt-1 block text-[11px] font-semibold text-slate-600 dark:text-slate-300">{language === "fa" ? account.organizationFa : account.organizationEn}</span> : null}
              <code dir="ltr" className="mt-1 block text-[10px] text-brand">
                {account.username}
              </code>
              <code dir="ltr" className="mt-1 block select-all text-[10px] text-slate-600 dark:text-slate-300">{copy.password}: {account.password}</code>
            </button>
          );
        })}
      </div>
    </details>
  );
}
