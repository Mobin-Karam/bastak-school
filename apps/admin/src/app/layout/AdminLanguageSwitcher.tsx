import { Languages } from "lucide-react";
import { useLocale } from "../../shared/ui/locale";

export function AdminLanguageSwitcher() {
  const { language, setLanguage } = useLocale();
  const nextLanguage = language === "fa" ? "en" : "fa";
  const label = nextLanguage === "en" ? "English" : "فارسی";
  const ariaLabel = nextLanguage === "en" ? "تغییر زبان به انگلیسی" : "Switch language to Persian";

  return (
    <button
      type="button"
      className="flex h-10 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 text-xs font-bold text-slate-600 outline-none transition hover:bg-slate-50 focus-visible:ring-2 focus-visible:ring-brand dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800 sm:px-2.5"
      onClick={() => setLanguage(nextLanguage)}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <Languages size={16} aria-hidden="true" />
      <span dir={nextLanguage === "fa" ? "rtl" : "ltr"}>{label}</span>
    </button>
  );
}
