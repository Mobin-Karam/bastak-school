// ─────────────────────────────────────────────────────────────
// EducationOverviewSkeleton.tsx
// ─────────────────────────────────────────────────────────────
import { useLocale } from "../../../shared/ui/locale";
import { educationCopy } from "../model/education-copy";

export function EducationOverviewSkeleton() {
  const { language } = useLocale();
  const copy = educationCopy(language);

  return (
    <div role="status" aria-live="polite" aria-label={copy.loadingAnalytics} className="grid gap-4">
      <div className="h-6 w-40 animate-pulse rounded-lg bg-slate-200/70 motion-reduce:animate-none" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-32 animate-pulse rounded-2xl border border-[rgb(var(--border-subtle))] bg-slate-200/50 motion-reduce:animate-none"
          />
        ))}
      </div>
    </div>
  );
}
