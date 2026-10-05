import { AlertTriangle, Check, ChevronDown, Search, UserRound, UsersRound, X } from "lucide-react";
import { useMemo, useState } from "react";
import type { Student } from "../types/domain";
import { cn, educationLabel, normalizePersianText } from "../lib/utils";
import { ViewportPopover } from "./popover";
import { useOptionalAdminLanguage } from "./locale";

const RECENT_KEY = "admin-recent-student-ids";
type Filter = "all" | "attention" | "active" | "inactive";

export function StudentPicker({
  students,
  value,
  onChange,
}: {
  students: Student[];
  value: string;
  onChange: (id: string) => void;
}) {
  const language = useOptionalAdminLanguage();
  const numberLocale = language === "en" ? "en-US" : "fa-IR";
  const copy = studentPickerCopy[language];
  const [open, setOpen] = useState(false),
    [query, setQuery] = useState(""),
    [filter, setFilter] = useState<Filter>("all"),
    [grade, setGrade] = useState(""),
    [educationType, setEducationType] = useState(""),
    [track, setTrack] = useState(""),
    [learnerProfile, setLearnerProfile] = useState<"" | "school" | "independent">(""),
    [expanded, setExpanded] = useState(false);
  const selected = students.find((student) => student.id === value) || null;
  const recentIds = readRecentIds();
  const recent = recentIds.flatMap((id) => students.find((student) => student.id === id) || []);
  const grades = useMemo(
    () => [
      ...new Set(
        students.map((student) => student.grade || String(student.gradeId || "")).filter(Boolean),
      ),
    ],
    [students],
  );
  const educationTypes = useMemo(
    () => [...new Set(students.map((student) => student.educationTypeId || "").filter(Boolean))],
    [students],
  );
  const tracks = useMemo(
    () => [
      ...new Set(students.map((student) => student.trackId || student.major || "").filter(Boolean)),
    ],
    [students],
  );
  const filtered = useMemo(() => {
    const term = normalizePersianText(query);
    return students.filter((student) => {
      const searchable = normalizePersianText(
        [
          student.name,
          student.username,
          student.user?.username,
          student.grade,
          student.major,
          student.targetField,
          student.target_major,
        ]
          .filter(Boolean)
          .join(" "),
      );
      const risk =
        Number(student.due_learning_count || 0) > 0 ||
        (student.average_percent != null && Number(student.average_percent) < 50);
      const status = student.accountStatus ?? student.account_status;
      const active =
        status !== "inactive" &&
        status !== "archived" &&
        student.active !== false &&
        student.active !== 0;
      return (
        (!term || searchable.includes(term)) &&
        (filter === "all" ||
          (filter === "attention" && risk) ||
          (filter === "active" && active) ||
          (filter === "inactive" && !active)) &&
        (!grade || (student.grade || String(student.gradeId || "")) === grade) &&
        (!educationType || student.educationTypeId === educationType) &&
        (!track || (student.trackId || student.major || "") === track) &&
        (!learnerProfile || student.learnerProfile === learnerProfile)
      );
    });
  }, [educationType, filter, grade, learnerProfile, query, students, track]);
  const visible = expanded ? filtered : filtered.slice(0, 40);

  function choose(id: string) {
    writeRecentId(id);
    onChange(id);
    setOpen(false);
    setQuery("");
    setExpanded(false);
  }

  return (
    <ViewportPopover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setQuery("");
          setExpanded(false);
        }
      }}
      width={380}
      className="overflow-hidden"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          className="flex h-10 w-full min-w-0 items-center gap-2 rounded-md border border-slate-200 bg-white px-2.5 text-start outline-none transition hover:border-slate-300 focus:border-brand focus:ring-2 focus:ring-brand/20 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-600"
          aria-label={selected ? copy.selected(selected.name) : copy.select}
        >
          <StudentAvatar student={selected} />
          <span className="min-w-0 flex-1">
            <strong className="block truncate text-sm">
              {selected?.name || (students.length ? copy.select : copy.noStudents)}
            </strong>
            {selected ? (
              <small className="block truncate text-[10px] text-slate-400">
                {[selected.grade, selected.major].filter(Boolean).join(" · ") ||
                  selected.user?.username ||
                  selected.username ||
                  copy.educationProfile}
              </small>
            ) : null}
          </span>
          {selected && hasAttention(selected) ? (
            <span className="size-2 shrink-0 rounded-full bg-rose-500" title={copy.attention} />
          ) : null}
          <ChevronDown size={15} className="shrink-0 text-slate-400" />
        </button>
      )}
    >
      <div className="border-b p-3">
        <div className="mb-2 flex items-center justify-between gap-2">
          <div>
            <strong className="text-sm">{copy.select}</strong>
            <p className="text-[11px] text-slate-500">
              {copy.available(students.length, numberLocale)}
            </p>
          </div>
          {value ? (
            <button
              type="button"
              className="rounded p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              aria-label={copy.close}
              onClick={() => setOpen(false)}
            >
              <X size={17} />
            </button>
          ) : null}
        </div>
        <label className="flex h-10 items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-800">
          <Search size={16} className="text-slate-400" />
          <input
            autoFocus
            className="min-w-0 flex-1 bg-transparent text-sm outline-none"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setExpanded(false);
            }}
            onKeyDown={(event) => {
              if (event.key !== "ArrowDown") return;
              event.preventDefault();
              document.querySelector<HTMLElement>('[role="listbox"] [role="option"]')?.focus();
            }}
            placeholder={copy.search}
          />
        </label>
        <div className="mt-2 flex gap-1 overflow-x-auto" role="group" aria-label={copy.filters}>
          {(
            [
              ["all", copy.all],
              ["attention", copy.attention],
              ["active", copy.active],
              ["inactive", copy.inactive],
            ] as Array<[Filter, string]>
          ).map(([key, label]) => (
            <button
              type="button"
              key={key}
              aria-pressed={filter === key}
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${filter === key ? "bg-brand text-white" : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"}`}
              onClick={() => {
                setFilter(key);
                setExpanded(false);
              }}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-2 gap-1 sm:grid-cols-4">
          <select
            aria-label={copy.gradeFilter}
            value={grade}
            onChange={(event) => setGrade(event.target.value)}
            className="h-8 rounded border bg-white px-1 text-xs dark:bg-slate-900"
          >
            <option value="">{copy.allGrades}</option>
            {grades.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>
          <select
            aria-label={copy.educationFilter}
            value={educationType}
            onChange={(event) => setEducationType(event.target.value)}
            className="h-8 rounded border bg-white px-1 text-xs dark:bg-slate-900"
          >
            <option value="">{copy.allTypes}</option>
            {educationTypes.map((item) => (
              <option key={item} value={item}>
                {educationLabel(item)}
              </option>
            ))}
          </select>
          <select
            aria-label={copy.trackFilter}
            value={track}
            onChange={(event) => setTrack(event.target.value)}
            className="h-8 rounded border bg-white px-1 text-xs dark:bg-slate-900"
          >
            <option value="">{copy.allTracks}</option>
            {tracks.map((item) => (
              <option key={item} value={item}>
                {educationLabel(item)}
              </option>
            ))}
          </select>
          <select
            aria-label={copy.learnerType}
            value={learnerProfile}
            onChange={(event) =>
              setLearnerProfile(event.target.value as "" | "school" | "independent")
            }
            className="h-8 rounded border bg-white px-1 text-xs dark:bg-slate-900"
          >
            <option value="">{copy.allLearners}</option>
            <option value="school">{copy.school}</option>
            <option value="independent">{copy.independent}</option>
          </select>
        </div>
      </div>
      {!query && filter === "all" && recent.length ? (
        <section className="border-b border-slate-200 bg-slate-50/70 p-2 dark:border-slate-700 dark:bg-slate-800/60">
          <p className="mb-1 px-1 text-[10px] font-bold text-slate-400">{copy.recent}</p>
          <div className="flex gap-1 overflow-x-auto">
            {recent.slice(0, 5).map((student) => (
              <button
                type="button"
                key={student.id}
                className="flex shrink-0 items-center gap-1.5 rounded-md bg-white px-2 py-1.5 text-xs ring-1 ring-slate-200 hover:ring-brand/40 dark:bg-slate-900 dark:ring-slate-700"
                onClick={() => choose(student.id)}
              >
                <StudentAvatar student={student} small />{" "}
                <span className="max-w-24 truncate">{student.name}</span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
      <div
        className="max-h-80 overflow-y-auto overscroll-contain p-2"
        role="listbox"
        aria-label={copy.list}
      >
        {visible.length ? (
          visible.map((student) => (
            <StudentOption
              key={student.id}
              student={student}
              selected={student.id === value}
              onClick={() => choose(student.id)}
            />
          ))
        ) : (
          <div className="grid min-h-28 place-items-center px-4 text-center text-sm text-slate-500">
            <span>
              <UsersRound className="mx-auto mb-2" size={24} />
              {copy.empty}
            </span>
          </div>
        )}
        {!expanded && filtered.length > visible.length ? (
          <button
            type="button"
            className="mt-1 w-full rounded-md bg-slate-50 py-2 text-xs font-bold text-brand hover:bg-brand/10 dark:bg-slate-800"
            onClick={() => setExpanded(true)}
          >
            {copy.show(filtered.length, numberLocale)}
          </button>
        ) : null}
      </div>
    </ViewportPopover>
  );
}

function StudentOption({
  student,
  selected,
  onClick,
}: {
  student: Student;
  selected: boolean;
  onClick: () => void;
}) {
  const language = useOptionalAdminLanguage();
  const numberLocale = language === "en" ? "en-US" : "fa-IR";
  const copy = studentPickerCopy[language];
  const attention = hasAttention(student),
    status = student.accountStatus ?? student.account_status,
    inactive =
      status === "inactive" ||
      status === "archived" ||
      student.active === false ||
      student.active === 0;
  return (
    <button
      type="button"
      role="option"
      aria-selected={selected}
      className={cn(
        "mb-1 flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start transition last:mb-0",
        selected ? "bg-brand/10 text-brand" : "hover:bg-slate-50 dark:hover:bg-slate-800",
      )}
      onClick={onClick}
      onKeyDown={(event) => {
        if (!["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) return;
        const options = Array.from(
          event.currentTarget
            .closest('[role="listbox"]')
            ?.querySelectorAll<HTMLElement>('[role="option"]') || [],
        );
        const current = options.indexOf(event.currentTarget);
        const next =
          event.key === "Home"
            ? 0
            : event.key === "End"
              ? options.length - 1
              : event.key === "ArrowDown"
                ? Math.min(current + 1, options.length - 1)
                : Math.max(current - 1, 0);
        if (options[next]) {
          event.preventDefault();
          options[next].focus();
        }
      }}
    >
      <StudentAvatar student={student} />
      <span className="min-w-0 flex-1">
        <strong className="block truncate text-sm">{student.name}</strong>
        <small className="block truncate text-[10px] text-slate-400">
          {[
            student.user?.username || student.username,
            student.learnerProfile === "independent" ? copy.independentLearner : student.grade,
            student.learnerProfile === "independent" ? student.learningLevel : student.major,
          ]
            .filter(Boolean)
            .join(" · ") || copy.noDetails}
        </small>
      </span>
      {attention ? (
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-rose-50 px-2 py-1 text-[10px] font-bold text-rose-700">
          <AlertTriangle size={11} />{" "}
          {Number(student.due_learning_count || 0)
            ? copy.review(Number(student.due_learning_count), numberLocale)
            : copy.risk}
        </span>
      ) : inactive ? (
        <span className="rounded-full bg-slate-100 px-2 py-1 text-[10px] text-slate-500">
          {copy.inactive}
        </span>
      ) : null}
      {selected ? <Check size={16} className="shrink-0" /> : null}
    </button>
  );
}
const studentPickerCopy = {
  fa: {
    selected: (name: string) => `دانش‌آموز انتخاب‌شده: ${name}`,
    select: "انتخاب دانش‌آموز",
    noStudents: "دانش‌آموزی وجود ندارد",
    educationProfile: "پروفایل آموزشی",
    attention: "نیازمند توجه",
    available: (count: number, locale: string) => `${count.toLocaleString(locale)} حساب در دسترس`,
    close: "بستن انتخابگر",
    search: "نام، نام کاربری، پایه یا رشته…",
    filters: "فیلتر دانش‌آموزان",
    all: "همه",
    active: "فعال",
    inactive: "غیرفعال",
    gradeFilter: "فیلتر پایه",
    allGrades: "همه پایه‌ها",
    educationFilter: "فیلتر نوع آموزش",
    allTypes: "همه نوع‌ها",
    trackFilter: "فیلتر رشته یا مسیر",
    allTracks: "همه مسیرها",
    learnerType: "نوع یادگیرنده",
    allLearners: "همه یادگیرندگان",
    school: "مدرسه‌ای",
    independent: "مستقل",
    recent: "اخیراً انتخاب‌شده",
    list: "فهرست دانش‌آموزان",
    empty: "دانش‌آموزی با این جستجو یا فیلتر پیدا نشد.",
    show: (count: number, locale: string) => `نمایش ${count.toLocaleString(locale)} دانش‌آموز`,
    independentLearner: "یادگیرنده مستقل",
    noDetails: "بدون جزئیات",
    review: (count: number, locale: string) => `${count.toLocaleString(locale)} مرور`,
    risk: "ریسک",
  },
  en: {
    selected: (name: string) => `Selected student: ${name}`,
    select: "Select student",
    noStudents: "No students available",
    educationProfile: "Education profile",
    attention: "Needs attention",
    available: (count: number, locale: string) =>
      `${count.toLocaleString(locale)} available accounts`,
    close: "Close picker",
    search: "Name, username, grade, or subject…",
    filters: "Student filters",
    all: "All",
    active: "Active",
    inactive: "Inactive",
    gradeFilter: "Grade filter",
    allGrades: "All grades",
    educationFilter: "Education type filter",
    allTypes: "All types",
    trackFilter: "Subject or track filter",
    allTracks: "All tracks",
    learnerType: "Learner type",
    allLearners: "All learners",
    school: "School",
    independent: "Independent",
    recent: "Recently selected",
    list: "Student list",
    empty: "No students match this search or filter.",
    show: (count: number, locale: string) => `Show ${count.toLocaleString(locale)} students`,
    independentLearner: "Independent learner",
    noDetails: "No details",
    review: (count: number, locale: string) => `${count.toLocaleString(locale)} reviews`,
    risk: "Risk",
  },
} as const;
function StudentAvatar({ student, small = false }: { student: Student | null; small?: boolean }) {
  return (
    <span
      className={cn(
        "grid shrink-0 place-items-center rounded-full bg-sky-50 font-black text-sky-700",
        small ? "size-6 text-[10px]" : "size-8 text-xs",
      )}
    >
      {student?.name?.trim()?.[0] || <UserRound size={small ? 12 : 15} />}
    </span>
  );
}
function hasAttention(student: Student) {
  return (
    Number(student.due_learning_count || 0) > 0 ||
    (student.average_percent != null && Number(student.average_percent) < 50)
  );
}
function readRecentIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const value = JSON.parse(window.localStorage.getItem(RECENT_KEY) || "[]");
    return Array.isArray(value)
      ? value.filter((item): item is string => typeof item === "string")
      : [];
  } catch {
    return [];
  }
}
function writeRecentId(id: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    RECENT_KEY,
    JSON.stringify([id, ...readRecentIds().filter((item) => item !== id)].slice(0, 5)),
  );
}
