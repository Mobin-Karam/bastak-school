import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Student } from "../../../shared/types/domain";
import { notify } from "../../../shared/ui/notifications";
import { Button, EmptyState, LoadingState } from "../../../shared/ui/ui";
import { StudentAllocationControl } from "../../../shared/ui/student-allocation-control";
import { useLocale } from "../../../shared/ui/locale";
import { listClasses } from "../../education/api/classes.api";
import {
  assignExam,
  getExamAssignments,
  getExamClassAssignments,
  setExamAudienceRules,
  setExamClassAssignments,
  unassignExam,
} from "../api/exams.api";

export function ExamAssignmentManager({
  examId,
  initialRules,
  students,
}: {
  examId: string;
  initialRules?: {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
  };
  students: Student[];
}) {
  const { language, profile } = useLocale();
  const isEnglish = language === "en";
  const text = isEnglish
    ? {
        loading: "Loading assignments…",
        failed: "Could not load assignments.",
        retry: "Try again",
        assigned: "Assigned students",
        remove: "Remove",
        noAssigned: "No students have been assigned yet.",
        classes: "Class audience",
        classesHint: "Active membership in these classes grants access to the exam.",
        students: "students",
        saveClasses: "Save classes",
        addAudience: "Add exam audience",
        assign: "Assign",
        rules: "Target group rules",
        rulesHint: "Rules are dynamic; every selected condition applies together.",
        saveRules: "Save rules",
        grade: "Grade",
        educationType: "Education type",
        track: "Track",
        learnerProfile: "Learner profile",
        independentType: "Independent learner type",
        school: "School",
        independent: "Independent",
        adult: "Adult",
        gapYear: "Gap year",
        homeschool: "Homeschool",
        other: "Other",
        assignedSaved: "Exam assignments saved.",
        removed: "Assignment removed.",
        classSaved: "Exam class audiences saved.",
        rulesSaved: "Exam target-group rules saved.",
        assignFailed: "Could not save assignments.",
        removeFailed: "Could not remove the assignment.",
        classFailed: "Could not save class audiences.",
      }
    : {
        loading: "در حال دریافت تخصیص‌ها…",
        failed: "دریافت تخصیص‌ها ناموفق بود.",
        retry: "تلاش دوباره",
        assigned: "دانش‌آموزان تخصیص‌یافته",
        remove: "حذف",
        noAssigned: "هنوز دانش‌آموزی تخصیص نیافته است.",
        classes: "مخاطبان کلاسی",
        classesHint: "عضویت فعال در این کلاس‌ها دسترسی به آزمون می‌دهد.",
        students: "دانش‌آموز",
        saveClasses: "ذخیره کلاس‌ها",
        addAudience: "افزودن مخاطبان آزمون",
        assign: "تخصیص",
        rules: "قواعد گروه هدف",
        rulesHint: "قواعد پویا هستند؛ همه شروط انتخاب‌شده هم‌زمان اعمال می‌شوند.",
        saveRules: "ذخیره قواعد",
        grade: "پایه",
        educationType: "نوع آموزش",
        track: "رشته",
        learnerProfile: "نوع یادگیرنده",
        independentType: "نوع یادگیرنده مستقل",
        school: "مدرسه‌ای",
        independent: "مستقل",
        adult: "بزرگسال",
        gapYear: "سال فاصله",
        homeschool: "آموزش خانگی",
        other: "سایر",
        assignedSaved: "تخصیص آزمون ثبت شد.",
        removed: "تخصیص حذف شد.",
        classSaved: "گروه‌های کلاسی آزمون ذخیره شد.",
        rulesSaved: "قواعد گروه هدف آزمون ذخیره شد.",
        assignFailed: "ثبت تخصیص ناموفق بود.",
        removeFailed: "حذف تخصیص ناموفق بود.",
        classFailed: "ذخیره گروه‌های کلاسی ناموفق بود.",
      };
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<string[]>([]);
  const [selectedClassIds, setSelectedClassIds] = useState<string[]>([]);
  const [rules, setRules] = useState(
    initialRules || {
      gradeIds: [],
      educationTypeIds: [],
      trackIds: [],
      learnerProfiles: [],
      independentTypes: [],
    },
  );
  const assignments = useQuery({
    queryKey: ["exam-assignments", examId],
    queryFn: () => getExamAssignments(examId),
  });
  const assignedIds = useMemo(
    () => new Set(assignments.data?.map((item) => item.student.id) || []),
    [assignments.data],
  );
  const classes = useQuery({
    queryKey: ["classes", "exam-assignment"],
    queryFn: () => listClasses(),
  });
  const classAssignments = useQuery({
    queryKey: ["exam-class-assignments", examId],
    queryFn: () => getExamClassAssignments(examId),
  });
  useEffect(
    () => setSelectedClassIds((classAssignments.data || []).map((item) => item.classId)),
    [classAssignments.data],
  );
  const candidates = useMemo(
    () => students.filter((student) => !assignedIds.has(student.id)),
    [students, assignedIds],
  );
  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ["exam-assignments", examId] });
    void queryClient.invalidateQueries({ queryKey: ["exams"] });
  };
  const add = useMutation({
    mutationFn: () => assignExam(examId, selected),
    onSuccess: () => {
      notify(text.assignedSaved);
      setSelected([]);
      refresh();
    },
    onError: (error) => notify(error instanceof Error ? error.message : text.assignFailed, "error"),
  });
  const remove = useMutation({
    mutationFn: (studentId: string) => unassignExam(examId, studentId),
    onSuccess: () => {
      notify(text.removed);
      refresh();
    },
    onError: (error) => notify(error instanceof Error ? error.message : text.removeFailed, "error"),
  });
  const saveClasses = useMutation({
    mutationFn: () => setExamClassAssignments(examId, selectedClassIds),
    onSuccess: () => {
      notify(text.classSaved);
      void queryClient.invalidateQueries({ queryKey: ["exam-class-assignments", examId] });
      void queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
    onError: (error) => notify(error instanceof Error ? error.message : text.classFailed, "error"),
  });
  const saveRules = useMutation({
    mutationFn: () => setExamAudienceRules(examId, rules),
    onSuccess: () => {
      notify(text.rulesSaved);
      void queryClient.invalidateQueries({ queryKey: ["exams"] });
    },
  });

  if (assignments.isLoading) return <LoadingState label={text.loading} />;
  if (assignments.isError)
    return (
      <EmptyState
        title={text.failed}
        action={
          <Button variant="soft" onClick={() => void assignments.refetch()}>
            {text.retry}
          </Button>
        }
      />
    );

  return (
    <div className="grid gap-5">
      <section>
        <h3 className="font-black">
          {text.assigned} ({(assignments.data || []).length.toLocaleString(profile.locale)})
        </h3>
        <div className="mt-3 grid gap-2">
          {(assignments.data || []).map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-lg border p-3 text-sm"
            >
              <span>
                <strong>{item.student.name}</strong>
                <small className="ms-2 text-slate-500">
                  {[item.student.grade, item.student.major].filter(Boolean).join(" • ")}
                </small>
              </span>
              <Button
                variant="danger"
                className="h-8 px-2 text-xs"
                loading={remove.isPending && remove.variables === item.student.id}
                onClick={() => remove.mutate(item.student.id)}
              >
                {text.remove}
              </Button>
            </div>
          ))}
          {!assignments.data?.length ? <EmptyState title={text.noAssigned} /> : null}
        </div>
      </section>
      <section className="border-t pt-4">
        <ExamAudienceRulesControl
          students={students}
          value={rules}
          onChange={setRules}
          onSave={() => saveRules.mutate()}
          saving={saveRules.isPending}
          text={text}
          locale={profile.locale}
        />
        {classes.data?.length ? (
          <div className="mb-5 grid gap-2 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
            <div>
              <h3 className="font-black">{text.classes}</h3>
              <p className="text-xs text-slate-500">{text.classesHint}</p>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              {classes.data
                .filter((item) => item.status === "ACTIVE")
                .map((item) => (
                  <label
                    key={item.id}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border p-2 text-sm ${selectedClassIds.includes(item.id) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
                  >
                    <input
                      type="checkbox"
                      className="accent-brand"
                      checked={selectedClassIds.includes(item.id)}
                      onChange={() =>
                        setSelectedClassIds((ids) =>
                          ids.includes(item.id)
                            ? ids.filter((id) => id !== item.id)
                            : [...ids, item.id],
                        )
                      }
                    />
                    <span>
                      <strong className="block">{item.name}</strong>
                      <small className="text-xs text-slate-500">
                        {item.enrollmentCount.toLocaleString(profile.locale)} {text.students}
                      </small>
                    </span>
                  </label>
                ))}
            </div>
            <Button size="sm" loading={saveClasses.isPending} onClick={() => saveClasses.mutate()}>
              {text.saveClasses}
            </Button>
          </div>
        ) : null}
        <StudentAllocationControl
          label={text.addAudience}
          students={candidates}
          selectedIds={selected}
          onChange={setSelected}
          classes={classes.data || []}
        />
        <Button
          className="mt-3"
          disabled={!selected.length}
          loading={add.isPending}
          onClick={() => add.mutate()}
        >
          {text.assign} {selected.length.toLocaleString(profile.locale)} {text.students}
        </Button>
      </section>
    </div>
  );
}

function ExamAudienceRulesControl({
  students,
  value,
  onChange,
  onSave,
  saving,
  text,
  locale,
}: {
  students: Student[];
  value: {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
  };
  onChange: (value: {
    gradeIds: number[];
    educationTypeIds: string[];
    trackIds: string[];
    learnerProfiles: string[];
    independentTypes: string[];
  }) => void;
  onSave: () => void;
  saving: boolean;
  text: Record<string, string>;
  locale: string;
}) {
  const grades = [
    ...new Set(
      students
        .map((item) => item.gradeId)
        .filter((item): item is number => typeof item === "number"),
    ),
  ].sort((a, b) => a - b);
  const types = [
    ...new Set(
      students.map((item) => item.educationTypeId).filter((item): item is string => !!item),
    ),
  ].sort();
  const tracks = [
    ...new Set(students.map((item) => item.trackId).filter((item): item is string => !!item)),
  ].sort();
  const toggle = (
    key: "gradeIds" | "educationTypeIds" | "trackIds" | "learnerProfiles" | "independentTypes",
    item: string | number,
  ) =>
    onChange({
      ...value,
      [key]: (value[key] as Array<string | number>).includes(item)
        ? (value[key] as Array<string | number>).filter((entry) => entry !== item)
        : [...(value[key] as Array<string | number>), item],
    } as typeof value);
  const options = (
    title: string,
    key: "gradeIds" | "educationTypeIds" | "trackIds" | "learnerProfiles" | "independentTypes",
    rows: Array<string | number>,
    label: (item: string | number) => string,
  ) => (
    <div className="grid gap-1">
      <strong className="text-xs">{title}</strong>
      <div className="flex flex-wrap gap-1">
        {rows.map((item) => (
          <label
            key={String(item)}
            className={`cursor-pointer rounded-lg border px-2 py-1 text-xs ${(value[key] as Array<string | number>).includes(item) ? "border-brand bg-brand/5" : "border-slate-200 dark:border-slate-800"}`}
          >
            <input
              className="sr-only"
              type="checkbox"
              checked={(value[key] as Array<string | number>).includes(item)}
              onChange={() => toggle(key, item)}
            />
            {label(item)}
          </label>
        ))}
      </div>
    </div>
  );
  return (
    <div className="mb-5 grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
      <div>
        <h3 className="font-black">{text.rules}</h3>
        <p className="text-xs text-slate-500">{text.rulesHint}</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {options(
          text.grade,
          "gradeIds",
          grades,
          (item) => `${text.grade} ${Number(item).toLocaleString(locale)}`,
        )}
        {options(text.educationType, "educationTypeIds", types, String)}
        {options(text.track, "trackIds", tracks, String)}
        {options(text.learnerProfile, "learnerProfiles", ["school", "independent"], (item) =>
          item === "school" ? text.school : text.independent,
        )}
        {options(
          text.independentType,
          "independentTypes",
          ["adult", "gap_year", "homeschool", "other"],
          (item) =>
            ({
              adult: text.adult,
              gap_year: text.gapYear,
              homeschool: text.homeschool,
              other: text.other,
            })[String(item)] || String(item),
        )}
      </div>
      <Button size="sm" loading={saving} onClick={onSave}>
        {text.saveRules}
      </Button>
    </div>
  );
}
