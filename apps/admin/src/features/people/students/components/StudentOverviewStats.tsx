import { Archive, CheckCircle2, CircleOff, FileWarning, UsersRound } from "lucide-react";

import type { StudentStatusFilter } from "./student-ui";
import { useOptionalAdminLanguage } from "../../../../shared/ui/locale";
import { studentCopy } from "../model/student-locale";

const items = [
  {
    key: "all",
    copyKey: "all",
    icon: UsersRound,
  },
  {
    key: "active",
    copyKey: "active",
    icon: CheckCircle2,
  },
  {
    key: "inactive",
    copyKey: "inactive",
    icon: CircleOff,
  },
  {
    key: "archived",
    copyKey: "archived",
    icon: Archive,
  },
] as const;

export function StudentOverviewStats({
  counts,
  status,
  onStatusChange,
  incomplete,
  incompleteOnly,
  onIncompleteToggle,
}: {
  counts: Record<StudentStatusFilter, number>;
  status: StudentStatusFilter;
  onStatusChange: (status: StudentStatusFilter) => void;
  incomplete: number;
  incompleteOnly: boolean;
  onIncompleteToggle: () => void;
}) {
  const language = useOptionalAdminLanguage() ?? "fa";
  const copy = studentCopy[language];

  const locale = language === "en" ? "en-US" : "fa-IR";

  return (
    <section
      className="
        -mx-3
        sm:mx-0
      "
      aria-label={copy.quickStudentFilters}
    >
      <div
        className="
          flex
          items-stretch
          gap-2

          overflow-x-auto
          overscroll-x-contain

          px-3
          pb-1

          snap-x
          snap-mandatory

          touch-pan-x

          [scrollbar-width:none]
          [&::-webkit-scrollbar]:hidden

          sm:flex-wrap
          sm:overflow-visible
          sm:px-0
          sm:pb-0
          sm:snap-none
        "
      >
        {items.map(({ key, copyKey, icon: Icon }) => {
          const active = status === key && !incompleteOnly;

          const label = copy[copyKey];

          return (
            <button
              key={key}
              type="button"
              aria-pressed={active}
              aria-label={`${label} ${counts[key].toLocaleString(locale)}`}
              onClick={() => onStatusChange(key)}
              className={`
                  group

                  relative

                  inline-flex
                  min-h-11
                  shrink-0
                  snap-start

                  items-center
                  justify-center

                  gap-2

                  rounded-2xl

                  border

                  px-3.5
                  py-2

                  text-xs
                  font-bold

                  outline-none

                  transition-[transform,background-color,border-color,color,box-shadow]
                  duration-200

                  active:scale-[0.96]

                  focus-visible:ring-2
                  focus-visible:ring-brand
                  focus-visible:ring-offset-2

                  motion-reduce:transition-none

                  ${
                    active
                      ? `
                        border-brand/60

                        bg-brand
                        text-white

                        shadow-[
                          0_6px_16px_rgb(var(--color-brand)_/_22%),
                          inset_0_1px_0_rgb(255_255_255_/_20%)
                        ]
                      `
                      : `
                        border-slate-200

                        bg-white
                        text-slate-600

                        shadow-[
                          0_2px_6px_rgb(15_23_42_/_5%)
                        ]

                        hover:border-brand/25
                        hover:text-brand

                        dark:border-slate-800
                        dark:bg-slate-900
                        dark:text-slate-300
                      `
                  }
                `}
            >
              <Icon size={16} strokeWidth={active ? 2.4 : 2} aria-hidden="true" />

              <span className="whitespace-nowrap">{label}</span>

              <span
                className={`
                    grid
                    min-w-6
                    place-items-center

                    rounded-full

                    px-1.5
                    py-0.5

                    text-[10px]
                    font-black

                    ${
                      active
                        ? `
                          bg-white/18
                          text-white
                        `
                        : `
                          bg-slate-100
                          text-slate-500

                          dark:bg-slate-800
                          dark:text-slate-400
                        `
                    }
                  `}
              >
                {counts[key].toLocaleString(locale)}
              </span>
            </button>
          );
        })}

        <button
          type="button"
          aria-pressed={incompleteOnly}
          onClick={onIncompleteToggle}
          className={`
            group

            inline-flex
            min-h-11
            shrink-0
            snap-start

            items-center
            justify-center

            gap-2

            rounded-2xl
            border

            px-3.5
            py-2

            text-xs
            font-bold

            outline-none

            transition-[transform,background-color,border-color,color,box-shadow]
            duration-200

            active:scale-[0.96]

            focus-visible:ring-2
            focus-visible:ring-amber-500
            focus-visible:ring-offset-2

            motion-reduce:transition-none

            ${
              incompleteOnly
                ? `
                  border-amber-400/70

                  bg-amber-500
                  text-white

                  shadow-[
                    0_6px_16px_rgb(245_158_11_/_22%),
                    inset_0_1px_0_rgb(255_255_255_/_25%)
                  ]
                `
                : `
                  border-slate-200

                  bg-white
                  text-slate-600

                  shadow-[
                    0_2px_6px_rgb(15_23_42_/_5%)
                  ]

                  hover:border-amber-300
                  hover:text-amber-700

                  dark:border-slate-800
                  dark:bg-slate-900
                  dark:text-slate-300
                `
            }
          `}
        >
          <FileWarning size={16} strokeWidth={incompleteOnly ? 2.4 : 2} aria-hidden="true" />

          <span className="whitespace-nowrap">{copy.incompleteProfile}</span>

          <span
            className={`
              grid
              min-w-6
              place-items-center

              rounded-full

              px-1.5
              py-0.5

              text-[10px]
              font-black

              ${
                incompleteOnly
                  ? `
                    bg-white/20
                    text-white
                  `
                  : `
                    bg-amber-50
                    text-amber-700

                    dark:bg-amber-950/50
                    dark:text-amber-300
                  `
              }
            `}
          >
            {incomplete.toLocaleString(locale)}
          </span>
        </button>
      </div>
    </section>
  );
}
