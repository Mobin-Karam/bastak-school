import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";

import { Card } from "../../../../shared/ui/ui";
import { quickActionsForRole } from "../../model/role-experience";
import { useAuth } from "../../../auth";
import { useLocale } from "../../../../shared/ui/locale";
import { dashboardCopy } from "../../model/dashboard-copy";

export function DashboardQuickActions() {
  const { language, profile } = useLocale();
  const copy = dashboardCopy[language];
  const auth = useAuth();

  const actions = quickActionsForRole(auth.activeRole, auth.capabilities, language);

  const primaryActions = actions.slice(0, 6);
  const additionalActions = actions.slice(6);

  if (!actions.length) return null;

  return (
    <>
      {/* =====================================================
          MOBILE — ICONS ONLY
          ===================================================== */}
      <div
        className="
          grid grid-cols-4 gap-2
          sm:hidden
        "
        aria-label={copy.nextStep}
      >
        {actions.map((item) => (
          <DashboardMobileToolLink key={item.to} item={item} />
        ))}
      </div>

      {/* =====================================================
          TABLET / DESKTOP — FULL UI
          ===================================================== */}
      <Card className="hidden overflow-hidden p-0 sm:block">
        {/* Header */}
        <div
          className="
            flex items-start justify-between gap-3
            border-b border-[rgb(var(--border-subtle))]
            bg-[rgb(var(--surface-muted))]/55
            px-3 py-3
          "
        >
          <div className="min-w-0">
            <h2 className="text-sm font-bold text-ink">{copy.nextStep}</h2>

            <p className="mt-1 text-[11px] leading-5 text-slate-500 dark:text-slate-400">
              {copy.nextStepDescription}
            </p>
          </div>

          <span
            className="
              shrink-0 rounded-full
              bg-brand/10
              px-2 py-0.5
              text-[10px] font-bold
              text-brand
            "
          >
            {actions.length.toLocaleString(profile.locale)}
          </span>
        </div>

        {/* Primary actions */}
        <div className="grid gap-2 p-3 md:grid-cols-2 2xl:grid-cols-1">
          {primaryActions.map((item) => (
            <DashboardToolLink key={item.to} item={item} />
          ))}
        </div>

        {/* Additional actions */}
        {additionalActions.length ? (
          <details className="border-t border-[rgb(var(--border-subtle))] px-3 py-2">
            <summary
              className="
                flex min-h-9 cursor-pointer
                list-none items-center justify-between gap-2
                rounded-md px-2
                text-xs font-semibold text-brand
                marker:content-none

                hover:bg-brand/5

                focus-visible:outline-none
                focus-visible:ring-2
                focus-visible:ring-brand/40
              "
            >
              <span>{copy.moreTools}</span>

              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                {additionalActions.length.toLocaleString(profile.locale)}
              </span>
            </summary>

            <p className="px-2 pb-2 pt-2 text-[11px] text-slate-500 dark:text-slate-400">
              {copy.moreToolsDescription}
            </p>

            <div className="grid gap-2 md:grid-cols-2 2xl:grid-cols-1">
              {additionalActions.map((item) => (
                <DashboardToolLink key={item.to} item={item} />
              ))}
            </div>
          </details>
        ) : null}
      </Card>
    </>
  );
}

/* =========================================================
   MOBILE ICON
   ========================================================= */

function DashboardMobileToolLink({
  item,
}: {
  item: ReturnType<typeof quickActionsForRole>[number];
}) {
  const Icon = item.icon;

  if (!Icon) return null;

  return (
    <Link
      to={item.to}
      aria-label={item.label}
      title={item.label}
      className="
        group
        flex aspect-square
        min-w-0
        items-center justify-center

        rounded-xl
        border border-[rgb(var(--border-subtle))]
        bg-[rgb(var(--surface-card))]

        text-brand
        shadow-sm

        transition-all
        duration-150

        active:scale-95
        active:bg-brand/10

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-brand/40
      "
    >
      <Icon className="size-5" strokeWidth={2} aria-hidden="true" />
    </Link>
  );
}

/* =========================================================
   TABLET / DESKTOP LINK
   ========================================================= */

function DashboardToolLink({ item }: { item: ReturnType<typeof quickActionsForRole>[number] }) {
  const Icon = item.icon;

  return (
    <Link
      to={item.to}
      className="
        group relative
        flex min-h-16 items-center gap-3

        rounded-lg
        border border-[rgb(var(--border-subtle))]
        bg-[rgb(var(--surface-card))]
        px-3 py-2.5

        text-sm text-ink

        transition

        hover:border-brand/35
        hover:bg-brand/[0.025]
        hover:shadow-sm

        focus-visible:outline-none
        focus-visible:ring-2
        focus-visible:ring-brand/40
        focus-visible:ring-offset-2
        focus-visible:ring-offset-white

        dark:focus-visible:ring-offset-slate-900
      "
      aria-label={`${item.label}: ${item.description}`}
    >
      {Icon ? (
        <span
          className="
            grid size-9 shrink-0
            place-items-center rounded-lg
            bg-brand/10 text-brand

            transition-colors

            group-hover:bg-brand
            group-hover:text-white
          "
        >
          <Icon size={16} aria-hidden="true" />
        </span>
      ) : null}

      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-bold">{item.label}</span>

        <span
          className="
            mt-0.5 block
            line-clamp-2
            text-[11px] font-normal leading-5
            text-slate-500
            dark:text-slate-400
          "
        >
          {item.description}
        </span>
      </span>

      <ChevronLeft
        size={14}
        aria-hidden="true"
        className="
          shrink-0
          text-slate-400
          transition-transform

          rtl:group-hover:-translate-x-0.5

          ltr:rotate-180
          ltr:group-hover:translate-x-0.5

          group-hover:text-brand
        "
      />
    </Link>
  );
}
