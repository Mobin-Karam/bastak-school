import { MoreHorizontal, X } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

import {
  adminDestination,
  localizedMainNavigationForCapabilities,
  localizedNavigationForCapabilities,
} from "./admin-navigation";

import type { AdminCurrentNavigation } from "../shell/layout-types";
import { useAuth } from "../../../features/auth";
import { useAdminShellCopy, useLocale } from "../../../shared/ui/locale";

import type { AdminPerformanceProfile } from "../shell/device-performance";

const MAX_RADIAL_ITEMS = 5;

function getRadialPosition(index: number, count: number, radius: number) {
  if (count <= 1) {
    return {
      x: 0,
      y: -radius,
    };
  }

  const spread = count === 2 ? 76 : count === 3 ? 100 : count === 4 ? 120 : 138;

  const startAngle = 270 - spread / 2;

  const angle = startAngle + (spread / (count - 1)) * index;

  const radians = (angle * Math.PI) / 180;

  return {
    x: Math.cos(radians) * radius,
    y: Math.sin(radians) * radius,
  };
}

const RADIAL_STYLES = [
  {
    background: "linear-gradient(145deg, rgb(124 58 237), rgb(76 29 149))",
    shadow:
      "0 12px 22px rgb(76 29 149 / 32%), inset 0 1px 1px rgb(255 255 255 / 35%), inset 0 -3px 6px rgb(0 0 0 / 20%)",
  },
  {
    background: "linear-gradient(145deg, rgb(16 185 129), rgb(4 120 87))",
    shadow:
      "0 12px 22px rgb(4 120 87 / 30%), inset 0 1px 1px rgb(255 255 255 / 35%), inset 0 -3px 6px rgb(0 0 0 / 20%)",
  },
  {
    background: "linear-gradient(145deg, rgb(245 158 11), rgb(180 83 9))",
    shadow:
      "0 12px 22px rgb(180 83 9 / 30%), inset 0 1px 1px rgb(255 255 255 / 35%), inset 0 -3px 6px rgb(0 0 0 / 20%)",
  },
  {
    background: "linear-gradient(145deg, rgb(236 72 153), rgb(157 23 77))",
    shadow:
      "0 12px 22px rgb(157 23 77 / 30%), inset 0 1px 1px rgb(255 255 255 / 35%), inset 0 -3px 6px rgb(0 0 0 / 20%)",
  },
  {
    background: "linear-gradient(145deg, rgb(14 165 233), rgb(3 105 161))",
    shadow:
      "0 12px 22px rgb(3 105 161 / 30%), inset 0 1px 1px rgb(255 255 255 / 35%), inset 0 -3px 6px rgb(0 0 0 / 20%)",
  },
];

export function AdminMobileBottomNav({
  current,
  selectedStudentId,
  performance,
}: {
  current: AdminCurrentNavigation;
  selectedStudentId: string;
  performance: AdminPerformanceProfile;
}) {
  const auth = useAuth();

  const { language } = useLocale();

  const copy = useAdminShellCopy();

  const location = useLocation();

  const visibleMainNavigation = localizedMainNavigationForCapabilities(
    auth.capabilities,
    auth.activeRole,
    language,
  );

  const navigationGroups = localizedNavigationForCapabilities(
    auth.capabilities,
    auth.activeRole,
    language,
  );

  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  const [expandedVisible, setExpandedVisible] = useState(false);

  useEffect(() => {
    setExpandedSection(null);
  }, [location.pathname]);

  useEffect(() => {
    if (!expandedSection) {
      setExpandedVisible(false);
      return;
    }

    setExpandedVisible(false);

    const frame = requestAnimationFrame(() => {
      setExpandedVisible(true);
    });

    return () => cancelAnimationFrame(frame);
  }, [expandedSection]);

  const centerItem =
    visibleMainNavigation.find((item) => item.section === "مدیریت") ??
    visibleMainNavigation.find((item) => item.section === "خانه") ??
    visibleMainNavigation[0];

  const studentNavigationMode = auth.activeRole === "STUDENT";

  const dockItems = studentNavigationMode
    ? visibleMainNavigation
    : centerItem
    ? [
        ...visibleMainNavigation.filter((item) => item.section !== centerItem.section).slice(0, 2),

        centerItem,

        ...visibleMainNavigation.filter((item) => item.section !== centerItem.section).slice(2, 3),
      ]
    : [];

  const moreActive = location.pathname === "/admin/more";

  const moreExpanded = expandedSection === "__more";

  const expandedGroup = moreExpanded
    ? {
        section: copy.allRoutes,
        items: navigationGroups.flatMap((group) => group.items),
      }
    : navigationGroups.find((group) => group.sectionKey === expandedSection);

  const hasRelatedPages = (section: string) =>
    section === "__more" ||
    (navigationGroups.find((group) => group.sectionKey === section)?.items.length ?? 0) > 1;

  const handleDockClick = (event: React.MouseEvent, section: string) => {
    if (!hasRelatedPages(section)) {
      return;
    }

    event.preventDefault();

    setExpandedSection((currentSection) => (currentSection === section ? null : section));
  };

  const radialItems =
    !moreExpanded && expandedGroup ? expandedGroup.items.slice(0, MAX_RADIAL_ITEMS) : [];

  const radialRadius = performance === "enhanced" ? 122 : 112;

  return (
    <>
      {/* ==========================================
          EXPANDED MENU
      ========================================== */}

      {expandedGroup ? (
        <>
          {/* blurred background */}
          <button
            type="button"
            className={`
              fixed
              inset-0
              z-30

              cursor-default

              bg-slate-950/25

              lg:hidden

              ${performance === "enhanced" ? "backdrop-blur-[5px]" : "bg-slate-950/35"}
            `}
            aria-label={language === "fa" ? "بستن منوی مرتبط" : "Close related pages"}
            onClick={() => setExpandedSection(null)}
          />

          {moreExpanded ? (
            /* ======================================
                MORE = VERTICAL 3D LIST
            ====================================== */

            <aside
              id="admin-mobile-more-menu"
              dir={language === "fa" ? "rtl" : "ltr"}
              aria-label={expandedGroup.section}
              className={`
                fixed
                bottom-[6.7rem]
                right-3
                z-[35]

                flex
                max-h-[min(65dvh,34rem)]
                w-[min(22rem,calc(100vw-1.5rem))]

                flex-col

                overflow-hidden

                rounded-[1.8rem]

                border
                border-white/10

                bg-[rgb(var(--surface-card))]

                p-2

                shadow-[
                  0_30px_70px_rgb(2_6_23_/_32%),
                  inset_0_1px_0_rgb(255_255_255_/_12%),
                  inset_0_-2px_0_rgb(15_23_42_/_5%)
                ]

                transition-[transform,opacity]
                duration-300
                ease-[cubic-bezier(.22,1,.36,1)]

                motion-reduce:transition-none

                lg:hidden
              `}
              style={{
                opacity: expandedVisible ? 1 : 0,

                transform: expandedVisible
                  ? "translate3d(0,0,0) scale(1)"
                  : "translate3d(0,18px,0) scale(.96)",
              }}
            >
              {/* header */}
              <div
                className="
                  flex
                  shrink-0
                  items-center
                  justify-between
                  gap-3

                  px-2
                  pb-2
                  pt-1
                "
              >
                <div className="min-w-0">
                  <strong
                    className="
                      block
                      truncate

                      text-sm
                      font-black

                      text-ink
                    "
                  >
                    {expandedGroup.section}
                  </strong>

                  <span
                    className="
                      mt-0.5
                      block

                      text-[10px]

                      text-slate-500
                    "
                  >
                    {language === "fa" ? "همه بخش‌های سامانه" : "All application sections"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setExpandedSection(null)}
                  aria-label={language === "fa" ? "بستن منو" : "Close menu"}
                  className="
                    relative

                    grid
                    size-10
                    shrink-0
                    place-items-center

                    rounded-full

                    bg-[rgb(var(--surface-muted))]

                    text-slate-500

                    shadow-[
                      0_5px_12px_rgb(15_23_42_/_10%),
                      inset_0_1px_0_rgb(255_255_255_/_18%),
                      inset_0_-2px_4px_rgb(15_23_42_/_6%)
                    ]

                    transition-transform

                    active:scale-90

                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-brand
                  "
                >
                  <X size={19} strokeWidth={2.2} />
                </button>
              </div>

              {/* rows */}
              <div
                className="
                  flex
                  min-h-0
                  flex-1
                  flex-col

                  gap-2

                  overflow-y-auto

                  px-0.5
                  pb-0.5

                  overscroll-contain
                "
              >
                {expandedGroup.items.map(({ path, title, description, icon: Icon }, index) => (
                  <NavLink
                    key={path}
                    to={adminDestination(path, expandedGroup.section, selectedStudentId)}
                    onClick={() => setExpandedSection(null)}
                    aria-label={title}
                    className="
                        group/more

                        relative

                        flex
                        min-h-[4.4rem]
                        w-full

                        items-center
                        gap-3

                        overflow-hidden

                        rounded-[1.15rem]

                        border
                        border-[rgb(var(--border-subtle))]

                        bg-[rgb(var(--surface-card))]

                        px-3
                        py-2.5

                        outline-none

                        shadow-[
                          0_7px_16px_rgb(15_23_42_/_9%),
                          inset_0_1px_0_rgb(255_255_255_/_16%),
                          inset_0_-3px_5px_rgb(15_23_42_/_5%)
                        ]

                        transition-[transform,box-shadow,border-color]
                        duration-200

                        hover:-translate-y-0.5
                        hover:border-brand/25

                        hover:shadow-[
                          0_12px_24px_rgb(15_23_42_/_14%),
                          inset_0_1px_0_rgb(255_255_255_/_20%)
                        ]

                        active:translate-y-[1px]
                        active:scale-[0.985]

                        focus-visible:ring-2
                        focus-visible:ring-brand

                        motion-reduce:transition-none
                      "
                    style={{
                      transitionDelay: expandedVisible ? `${Math.min(index, 6) * 22}ms` : "0ms",
                    }}
                  >
                    {/* text on right for RTL */}
                    <div
                      className={`
                          min-w-0
                          flex-1

                          ${language === "fa" ? "text-right" : "text-left"}
                        `}
                    >
                      <strong
                        className="
                            block
                            truncate

                            text-[12px]
                            font-black

                            text-ink

                            transition-colors

                            group-hover/more:text-brand
                          "
                      >
                        {title}
                      </strong>

                      {description ? (
                        <span
                          className="
                              mt-1
                              block

                              line-clamp-1

                              text-[10px]
                              leading-4

                              text-slate-500
                            "
                        >
                          {description}
                        </span>
                      ) : null}
                    </div>

                    {/* icon */}
                    <span
                      className="
                          relative

                          grid
                          size-11
                          shrink-0
                          place-items-center

                          overflow-hidden

                          rounded-[0.95rem]

                          bg-gradient-to-br
                          from-brand
                          to-emerald-600

                          text-white

                          shadow-[
                            0_8px_16px_rgb(var(--color-brand)_/_24%),
                            inset_0_1px_0_rgb(255_255_255_/_34%),
                            inset_0_-3px_5px_rgb(0_0_0_/_14%)
                          ]

                          transition-transform
                          duration-200

                          group-hover/more:scale-105

                          motion-reduce:transition-none
                        "
                    >
                      <span
                        aria-hidden="true"
                        className="
                            pointer-events-none

                            absolute
                            inset-x-2.5
                            top-[3px]

                            h-px

                            rounded-full

                            bg-white/45
                          "
                      />

                      <Icon
                        size={20}
                        strokeWidth={2.1}
                        aria-hidden="true"
                        className="
                            relative
                            z-10

                            drop-shadow-[
                              0_2px_3px_rgb(0_0_0_/_22%)
                            ]
                          "
                      />
                    </span>
                  </NavLink>
                ))}
              </div>
            </aside>
          ) : (
            /* ======================================
                NORMAL GROUP = RADIAL MENU
            ====================================== */

            <div
              id="admin-mobile-radial-menu"
              className="
                fixed
                left-1/2
                z-[35]

                h-0
                w-0

                lg:hidden
              "
              style={{
                bottom: "calc(max(env(safe-area-inset-bottom), 0.25rem) + 7.5rem)",
              }}
              aria-label={expandedGroup.section}
            >
              {radialItems.map(({ path, title, description, icon: Icon }, index) => {
                const { x, y } = getRadialPosition(index, radialItems.length, radialRadius);

                const style = RADIAL_STYLES[index % RADIAL_STYLES.length];

                return (
                  <NavLink
                    key={path}
                    to={adminDestination(path, expandedGroup.section, selectedStudentId)}
                    onClick={() => setExpandedSection(null)}
                    aria-label={title}
                    title={description}
                    className="
                        group/radial

                        absolute
                        -left-10
                        -top-7

                        z-10

                        flex
                        w-20

                        flex-col
                        items-center
                        gap-1.5

                        text-center

                        outline-none

                        transition-[transform,opacity]
                        duration-300
                        ease-[cubic-bezier(.22,1,.36,1)]

                        focus-visible:ring-2
                        focus-visible:ring-white
                        focus-visible:ring-offset-2
                        focus-visible:ring-offset-transparent

                        motion-reduce:transition-none
                      "
                    style={{
                      opacity: expandedVisible ? 1 : 0,

                      transform: expandedVisible
                        ? `translate3d(${x}px, ${y}px, 0) scale(1)`
                        : "translate3d(0,16px,0) scale(.55)",

                      transitionDelay: expandedVisible ? `${index * 35}ms` : "0ms",
                    }}
                  >
                    {/* 3D circle */}
                    <span
                      className="
                          relative

                          grid
                          size-14
                          shrink-0
                          place-items-center

                          overflow-hidden

                          rounded-full

                          text-white

                          transition-transform
                          duration-200

                          group-hover/radial:scale-110

                          group-active/radial:scale-90

                          motion-reduce:transition-none
                        "
                      style={{
                        background: style.background,

                        boxShadow:
                          performance === "enhanced"
                            ? style.shadow
                            : "0 8px 16px rgb(15 23 42 / 22%)",
                      }}
                    >
                      {/* upper shine */}
                      <span
                        aria-hidden="true"
                        className="
                            pointer-events-none

                            absolute
                            inset-x-3
                            top-[4px]

                            h-[2px]

                            rounded-full

                            bg-white/40
                          "
                      />

                      <Icon
                        size={22}
                        strokeWidth={2.1}
                        aria-hidden="true"
                        className="
                            relative
                            z-10

                            drop-shadow-[
                              0_2px_3px_rgb(0_0_0_/_24%)
                            ]
                          "
                      />
                    </span>

                    {/* TITLE BELOW */}
                    <span
                      className="
                          max-w-[5rem]

                          overflow-hidden
                          text-ellipsis

                          text-[10px]
                          font-black
                          leading-4

                          text-white

                          drop-shadow-[
                            0_2px_5px_rgb(0_0_0_/_45%)
                          ]
                        "
                    >
                      {title}
                    </span>
                  </NavLink>
                );
              })}

              {/* center close button */}
              <button
                type="button"
                onClick={() => setExpandedSection(null)}
                aria-label={language === "fa" ? "بستن منو" : "Close menu"}
                className="
                  absolute
                  -left-8
                  -top-8

                  z-20

                  grid
                  size-16

                  place-items-center

                  overflow-hidden

                  rounded-full

                  border
                  border-white/20

                  bg-gradient-to-br
                  from-brand
                  to-emerald-600

                  text-white

                  shadow-[
                    0_14px_30px_rgb(var(--color-brand)_/_34%),
                    inset_0_2px_1px_rgb(255_255_255_/_30%),
                    inset_0_-4px_7px_rgb(0_0_0_/_20%)
                  ]

                  transition-transform

                  hover:scale-105
                  active:scale-90

                  focus-visible:outline-none
                  focus-visible:ring-2
                  focus-visible:ring-brand
                  focus-visible:ring-offset-4
                "
              >
                <span
                  aria-hidden="true"
                  className="
                    pointer-events-none

                    absolute
                    inset-x-4
                    top-[5px]

                    h-[2px]

                    rounded-full

                    bg-white/45
                  "
                />

                <X
                  size={27}
                  strokeWidth={2.3}
                  aria-hidden="true"
                  className="
                    relative
                    z-10
                  "
                />
              </button>
            </div>
          )}
        </>
      ) : null}

      {/* ==========================================
          MAIN MOBILE NAV
      ========================================== */}

      <nav
        className={`
          admin-expensive-surface

          fixed
          inset-x-3
          bottom-2

          z-40

          grid
          grid-cols-5

          items-center

          rounded-[1.9rem]

          border
          border-white/[0.07]

          bg-[rgb(var(--surface-card)_/_97%)]

          px-1.5
          py-1.5

          lg:hidden

          ${
            performance === "enhanced"
              ? `
                shadow-[
                  0_16px_36px_rgb(15_23_42_/_17%),
                  inset_0_1px_0_rgb(255_255_255_/_10%),
                  inset_0_-2px_0_rgb(15_23_42_/_5%)
                ]

                backdrop-blur-md
              `
              : `
                shadow-[
                  0_7px_18px_rgb(15_23_42_/_12%)
                ]
              `
          }
        `}
        style={{
          paddingBottom: "max(env(safe-area-inset-bottom), 0.375rem)",
        }}
        aria-label={copy.primaryNavigation}
      >
        {dockItems.map(({ path, title, section, icon: Icon }) => {
          const active = current.section === section && !moreActive;

          const expanded = expandedSection === section;

          const highlighted = active || expanded;

          const destinationPath = active ? current.path : path;

          return (
            <NavLink
              key={section}
              to={adminDestination(destinationPath, section, selectedStudentId)}
              end={destinationPath === ""}
              aria-current={active ? "location" : undefined}
              aria-expanded={hasRelatedPages(section) ? expanded : undefined}
              aria-controls={expanded ? "admin-mobile-radial-menu" : undefined}
              aria-label={title}
              title={title}
              onClick={(event) => handleDockClick(event, section)}
              className="
                  group/dock

                  relative

                  flex
                  min-h-14
                  min-w-0

                  items-center
                  justify-center

                  rounded-2xl

                  outline-none

                  focus-visible:ring-2
                  focus-visible:ring-brand
                "
            >
              <span
                className={`
                    relative

                    grid
                    place-items-center

                    overflow-hidden

                    rounded-full

                    transition-[transform,background-color,color,box-shadow]
                    duration-300
                    ease-[cubic-bezier(.22,1,.36,1)]

                    motion-reduce:transition-none

                    ${
                      highlighted
                        ? `
                          size-14

                          -translate-y-4
                          scale-105

                          bg-gradient-to-br
                          from-brand
                          to-emerald-600

                          text-white

                          shadow-[
                            0_12px_26px_rgb(var(--color-brand)_/_32%),
                            inset_0_2px_1px_rgb(255_255_255_/_28%),
                            inset_0_-4px_7px_rgb(0_0_0_/_16%)
                          ]
                        `
                        : `
                          size-11

                          bg-[rgb(var(--surface-muted))]

                          text-slate-500

                          shadow-[
                            0_4px_9px_rgb(15_23_42_/_7%),
                            inset_0_1px_0_rgb(255_255_255_/_15%),
                            inset_0_-2px_4px_rgb(15_23_42_/_6%)
                          ]

                          group-hover/dock:-translate-y-1
                          group-hover/dock:text-brand

                          group-active/dock:scale-90
                        `
                    }
                  `}
              >
                {highlighted ? (
                  <span
                    aria-hidden="true"
                    className="
                        pointer-events-none

                        absolute
                        inset-x-3
                        top-[4px]

                        h-[2px]

                        rounded-full

                        bg-white/40
                      "
                  />
                ) : null}

                <Icon
                  size={highlighted ? 23 : 20}
                  strokeWidth={highlighted ? 2.4 : 1.9}
                  aria-hidden="true"
                  className="
                      relative
                      z-10

                      drop-shadow-[
                        0_2px_3px_rgb(0_0_0_/_16%)
                      ]

                      transition-transform
                      duration-200

                      group-hover/dock:scale-105
                    "
                />
              </span>
            </NavLink>
          );
        })}

        {/* Students have exactly five destinations; other roles retain the expanded More menu. */}
        {!studentNavigationMode ? <NavLink
          to="/admin/more"
          aria-current={moreActive ? "page" : undefined}
          aria-expanded={moreExpanded}
          aria-controls={moreExpanded ? "admin-mobile-more-menu" : undefined}
          aria-label={copy.allRoutes}
          title={copy.allRoutes}
          onClick={(event) => handleDockClick(event, "__more")}
          className="
            group/dock

            relative

            flex
            min-h-14
            min-w-0

            items-center
            justify-center

            rounded-2xl

            outline-none

            focus-visible:ring-2
            focus-visible:ring-brand
          "
        >
          <span
            className={`
              relative

              grid
              place-items-center

              overflow-hidden

              rounded-full

              transition-[transform,background-color,color,box-shadow]
              duration-300
              ease-[cubic-bezier(.22,1,.36,1)]

              motion-reduce:transition-none

              ${
                moreActive || moreExpanded
                  ? `
                    size-14

                    -translate-y-4
                    scale-105

                    bg-gradient-to-br
                    from-brand
                    to-emerald-600

                    text-white

                    shadow-[
                      0_12px_26px_rgb(var(--color-brand)_/_32%),
                      inset_0_2px_1px_rgb(255_255_255_/_28%),
                      inset_0_-4px_7px_rgb(0_0_0_/_16%)
                    ]
                  `
                  : `
                    size-11

                    bg-[rgb(var(--surface-muted))]

                    text-slate-500

                    shadow-[
                      0_4px_9px_rgb(15_23_42_/_7%),
                      inset_0_1px_0_rgb(255_255_255_/_15%),
                      inset_0_-2px_4px_rgb(15_23_42_/_6%)
                    ]

                    group-hover/dock:-translate-y-1
                    group-hover/dock:text-brand

                    group-active/dock:scale-90
                  `
              }
            `}
          >
            {moreActive || moreExpanded ? (
              <span
                aria-hidden="true"
                className="
                  pointer-events-none

                  absolute
                  inset-x-3
                  top-[4px]

                  h-[2px]

                  rounded-full

                  bg-white/40
                "
              />
            ) : null}

            <MoreHorizontal
              size={moreActive || moreExpanded ? 24 : 21}
              strokeWidth={moreActive || moreExpanded ? 2.4 : 2}
              aria-hidden="true"
              className="
                relative
                z-10
              "
            />
          </span>
        </NavLink> : null}
      </nav>
    </>
  );
}
