// ─────────────────────────────────────────────────────────────
// EducationSections.tsx
// ─────────────────────────────────────────────────────────────
import { BookOpen } from "lucide-react";
import { EducationSection } from "../model/eduction.types";
import { EducationSectionCard } from "./EducationSectionGrid";
import { useLocale } from "../../../shared/ui/locale";
import { educationCopy } from "../model/education-copy";

interface Props {
  sections: EducationSection[];
}

export function EducationSections({ sections }: Props) {
  return (
    <section
      aria-labelledby="education-sections-title"
      aria-describedby="education-sections-desc"
      className="grid gap-2"
    >
      {sections.length === 0 ? (
        <EmptyState />
      ) : (
        // role="list" restores semantics in Safari, which strips them when list-style is removed.
        <ul role="list" className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {sections.map((section) => (
            <EducationSectionCard key={section.path} section={section} />
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState() {
  const { language } = useLocale();
  const copy = educationCopy(language);
  return (
    <div className="grid place-items-center gap-3 rounded-2xl border border-dashed border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] px-6 py-12 text-center">
      <span
        aria-hidden="true"
        className="grid size-12 place-items-center rounded-full bg-brand/10 text-brand"
      >
        <BookOpen size={22} />
      </span>
      <p className="text-sm font-bold text-ink">{copy.noSections}</p>
      <p className="max-w-sm text-sm text-slate-500">{copy.noPermissionDescription}</p>
    </div>
  );
}
