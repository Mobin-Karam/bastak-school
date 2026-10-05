import { Search } from "lucide-react";
import { useMemo, useState } from "react";
import { educationLabel } from "../lib/utils";
import { Button } from "./ui";
import { useOptionalAdminLanguage } from "./locale";

export type StudentAllocationCandidate = {
  id: string;
  name: string;
  grade?: string | null;
  gradeId?: number | null;
  major?: string | null;
  educationTypeId?: string | null;
  trackId?: string | null;
  learnerProfile?: "school" | "independent" | null;
  independentType?: string | null;
};

export function StudentAllocationControl({
  students,
  selectedIds,
  onChange,
  label = "دانش‌آموزان",
  classes = [],
}: {
  students: StudentAllocationCandidate[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  label?: string;
  classes?: Array<{ id: string; name: string; status?: string; students: Array<{ id: string }> }>;
}) {
  const language = useOptionalAdminLanguage();
  const numberLocale = language === "en" ? "en-US" : "fa-IR";
  const copy = allocationCopy[language];
  const [search, setSearch] = useState("");
  const [grade, setGrade] = useState("");
  const [educationType, setEducationType] = useState("");
  const [track, setTrack] = useState("");
  const [learnerProfile, setLearnerProfile] = useState<"" | "school" | "independent">("");
  const [independentType, setIndependentType] = useState("");
  const [classId, setClassId] = useState("");
  const visible = useMemo(
    () =>
      students.filter(
        (student) =>
          (!grade || String(student.gradeId || student.grade || "") === grade) &&
          (!educationType || student.educationTypeId === educationType) &&
          (!track || student.trackId === track || student.major === track) &&
          (!learnerProfile || student.learnerProfile === learnerProfile) &&
          (!independentType || student.independentType === independentType) &&
          (!classId ||
            classes
              .find((item) => item.id === classId)
              ?.students.some((item) => item.id === student.id)) &&
          `${student.name} ${student.grade || ""} ${student.major || ""}`
            .toLocaleLowerCase(numberLocale)
            .includes(search.trim().toLocaleLowerCase(numberLocale)),
      ),
    [
      classId,
      classes,
      educationType,
      grade,
      independentType,
      learnerProfile,
      search,
      students,
      track,
    ],
  );
  const toggle = (id: string) =>
    onChange(
      selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id],
    );
  return (
    <section className="grid gap-2 border-t pt-3 dark:border-slate-800">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <strong className="text-sm">{label}</strong>
        <span className="text-xs text-slate-500">
          {copy.selected(selectedIds.length, numberLocale)}
        </span>
      </div>
      <label className="flex h-10 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 dark:border-slate-700 dark:bg-slate-900">
        <Search size={15} className="text-slate-400" />
        <input
          className="min-w-0 flex-1 bg-transparent text-sm outline-none"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={copy.search}
        />
      </label>
      <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
          aria-label={copy.gradeFilter}
          value={grade}
          onChange={(event) => setGrade(event.target.value)}
        >
          <option value="">{copy.allGrades}</option>
          {[
            ...new Set(
              students
                .map((student) => String(student.gradeId || student.grade || ""))
                .filter(Boolean),
            ),
          ]
            .sort((a, b) => a.localeCompare(b, numberLocale, { numeric: true }))
            .map((value) => (
              <option key={String(value)} value={value || ""}>
                {gradeLabel(value, language, numberLocale)}
              </option>
            ))}
        </select>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
          aria-label={copy.learnerType}
          value={learnerProfile}
          onChange={(event) => {
            setLearnerProfile(event.target.value as "" | "school" | "independent");
            if (event.target.value === "independent") setClassId("");
            else setIndependentType("");
          }}
        >
          <option value="">{copy.allLearners}</option>
          <option value="school">{copy.schoolStudent}</option>
          <option value="independent">{copy.independentLearner}</option>
        </select>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
          aria-label={copy.independentType}
          value={independentType}
          disabled={learnerProfile === "school"}
          onChange={(event) => {
            setIndependentType(event.target.value);
            if (event.target.value) {
              setLearnerProfile("independent");
              setClassId("");
            }
          }}
        >
          <option value="">{copy.allIndependentTypes}</option>
          {[
            ["adult", copy.adult],
            ["gap_year", copy.gapYear],
            ["homeschool", copy.homeschool],
            ["other", copy.other],
          ].map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
        {classes.length ? (
          <select
            className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            aria-label={copy.classFilter}
            value={classId}
            disabled={learnerProfile === "independent"}
            onChange={(event) => setClassId(event.target.value)}
          >
            <option value="">{copy.allClasses}</option>
            {classes
              .filter((item) => !item.status || item.status === "ACTIVE")
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
        ) : null}
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
          aria-label={copy.educationFilter}
          value={educationType}
          onChange={(event) => {
            setEducationType(event.target.value);
            setTrack("");
          }}
        >
          <option value="">{copy.allTypes}</option>
          {[...new Set(students.map((student) => student.educationTypeId).filter(Boolean))]
            .sort()
            .map((value) => (
              <option key={String(value)} value={value || ""}>
                {educationLabel(value!, language)}
              </option>
            ))}
        </select>
        <select
          className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
          aria-label={copy.trackFilter}
          value={track}
          onChange={(event) => setTrack(event.target.value)}
        >
          <option value="">{copy.allTracks}</option>
          {[
            ...new Set(
              students
                .filter((student) => !educationType || student.educationTypeId === educationType)
                .map((student) => student.trackId || student.major)
                .filter(Boolean),
            ),
          ]
            .sort((a, b) => a!.localeCompare(b!, numberLocale))
            .map((value) => (
              <option key={String(value)} value={value || ""}>
                {educationLabel(value!, language)}
              </option>
            ))}
        </select>
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          size="sm"
          variant="ghost"
          onClick={() =>
            onChange([...new Set([...selectedIds, ...visible.map((student) => student.id)])])
          }
        >
          {copy.selectResults}
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => onChange([])}>
          {copy.clear}
        </Button>
      </div>
      <div className="grid max-h-64 gap-2 overflow-auto sm:grid-cols-2">
        {visible.map((student) => (
          <label
            key={student.id}
            className={`flex cursor-pointer items-center gap-2 rounded-xl border p-2.5 ${selectedIds.includes(student.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
          >
            <input
              type="checkbox"
              className="size-4 accent-brand"
              checked={selectedIds.includes(student.id)}
              onChange={() => toggle(student.id)}
            />
            <span className="min-w-0">
              <strong className="block truncate text-sm">{student.name}</strong>
              <small className="block truncate text-xs text-slate-500">
                {student.learnerProfile === "independent"
                  ? `${copy.independentLearner}${student.independentType ? ` · ${student.independentType}` : ""}`
                  : `${student.grade || copy.unknownGrade} · ${student.major || copy.unknownTrack}`}
              </small>
            </span>
          </label>
        ))}
      </div>
      {!visible.length ? <p className="text-center text-xs text-slate-500">{copy.empty}</p> : null}
    </section>
  );
}

function gradeLabel(value: string, language: "fa" | "en", locale: string) {
  if (language === "en") return `Grade ${Number(value).toLocaleString(locale)}`;
  return value.startsWith("پایه") ? value : `پایه ${Number(value).toLocaleString(locale)}`;
}

const allocationCopy = {
  fa: {
    selected: (count: number, locale: string) => `${count.toLocaleString(locale)} انتخاب`,
    search: "جست‌وجوی نام، پایه یا رشته",
    gradeFilter: "فیلتر پایه",
    allGrades: "همه پایه‌ها",
    learnerType: "نوع یادگیرنده",
    allLearners: "همه یادگیرندگان",
    schoolStudent: "دانش‌آموز مدرسه",
    independentLearner: "یادگیرنده مستقل",
    independentType: "نوع یادگیرنده مستقل",
    allIndependentTypes: "همه نوع‌های مستقل",
    adult: "بزرگسال",
    gapYear: "سال فاصله",
    homeschool: "آموزش خانگی",
    other: "سایر",
    classFilter: "فیلتر کلاس",
    allClasses: "همه کلاس‌ها",
    educationFilter: "فیلتر نوع آموزش",
    allTypes: "همه نوع‌ها",
    trackFilter: "فیلتر رشته",
    allTracks: "همه رشته‌ها",
    selectResults: "انتخاب نتایج",
    clear: "پاک‌سازی",
    unknownGrade: "پایه نامشخص",
    unknownTrack: "رشته نامشخص",
    empty: "دانش‌آموزی با این فیلتر پیدا نشد.",
  },
  en: {
    selected: (count: number, locale: string) => `${count.toLocaleString(locale)} selected`,
    search: "Search by name, grade, or subject",
    gradeFilter: "Grade filter",
    allGrades: "All grades",
    learnerType: "Learner type",
    allLearners: "All learners",
    schoolStudent: "School student",
    independentLearner: "Independent learner",
    independentType: "Independent learner type",
    allIndependentTypes: "All independent types",
    adult: "Adult",
    gapYear: "Gap year",
    homeschool: "Homeschool",
    other: "Other",
    classFilter: "Class filter",
    allClasses: "All classes",
    educationFilter: "Education type filter",
    allTypes: "All types",
    trackFilter: "Subject filter",
    allTracks: "All subjects",
    selectResults: "Select results",
    clear: "Clear",
    unknownGrade: "Unknown grade",
    unknownTrack: "Unknown subject",
    empty: "No students match this filter.",
  },
} as const;
