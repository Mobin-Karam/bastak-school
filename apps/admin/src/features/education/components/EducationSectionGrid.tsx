// ─────────────────────────────────────────────────────────────
// EducationSectionCard.tsx
// ─────────────────────────────────────────────────────────────
import { Link } from "react-router-dom";
import { ArrowUpLeft, ArrowUpRight } from "lucide-react";
import { EducationSection } from "../model/eduction.types";
import { useLocale } from "../../../shared/ui/locale";

const CARD_CLASS = [
  "group relative flex items-center gap-2.5 rounded-xl px-3 py-2.5",
  "border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))]",
  "transition-colors duration-150 ease-out",
  "hover:border-brand/40 hover:bg-brand/[0.03]",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
  "focus-visible:ring-offset-1 focus-visible:ring-offset-[rgb(var(--surface-page))]",
].join(" ");

export function EducationSectionCard({ section }: { section: EducationSection }) {
  const { path, title, description, icon: Icon } = section;
  const { language } = useLocale();
  const isLtr = language === "en";
  const Arrow = isLtr ? ArrowUpRight : ArrowUpLeft;

  return (
    <li className="min-w-0">
      <Link to={`/admin/${path}`} className={CARD_CLASS}>
        <span
          aria-hidden="true"
          className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand transition-colors group-hover:bg-brand/15"
        >
          <Icon size={15} />
        </span>

        {/* min-w-0 is required — without it, flex children ignore truncate */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate text-sm font-bold text-ink">{title}</h3>
          <p className="truncate text-[11px] leading-4 text-slate-500">{description}</p>
        </div>

        {/* Appears only on hover/focus — zero noise at rest */}
        <Arrow
          size={14}
          aria-hidden="true"
          className={`shrink-0 text-slate-300 opacity-0 transition-[transform,opacity,color] duration-150 group-hover:translate-x-0 group-hover:text-brand group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none ${isLtr ? "translate-x-1" : "-translate-x-1"}`}
        />
      </Link>
    </li>
  );
}
