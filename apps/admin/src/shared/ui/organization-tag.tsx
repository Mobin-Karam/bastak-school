import { Building2 } from "lucide-react";

const organizationTypeLabel: Record<string, string> = {
  SCHOOL: "مدرسه",
  INSTITUTION: "مؤسسه",
  ORGANIZATION: "سازمان",
};

type OrganizationTagProps = {
  organization?: {
    id?: string | null;
    name?: string | null;
    type?: string | null;
    status?: string | null;
  } | null;
  className?: string;
  compact?: boolean;
};

/** A visible tenant boundary for platform-level lists and operational cards. */
export function OrganizationTag({
  organization,
  className = "",
  compact = false,
}: OrganizationTagProps) {
  if (!organization?.name) return null;

  const type = organization.type
    ? (organizationTypeLabel[organization.type] ?? organization.type)
    : "سازمان";
  const inactive = organization.status && organization.status !== "ACTIVE";
  return (
    <span
      title={`${type}: ${organization.name}`}
      className={[
        "inline-flex max-w-full items-center gap-1.5 rounded-full border px-2 py-1 text-[11px] font-bold",
        inactive
          ? "border-slate-200 bg-slate-100 text-slate-600 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          : "border-brand/20 bg-brand/10 text-brand",
        className,
      ].join(" ")}
    >
      <Building2 size={compact ? 12 : 13} aria-hidden="true" className="shrink-0" />
      <span className="truncate">{organization.name}</span>
      {!compact ? <span className="opacity-70">· {type}</span> : null}
    </span>
  );
}
