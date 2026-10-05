import { RotateCcw, Save, UserPlus, X } from "lucide-react";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button, Field, Input } from "../../../shared/ui/ui";
import { api } from "../../../shared/api/api";
import { useOptionalAdminLanguage } from "../../../shared/ui/locale";
import type { StudentForm } from "../model/student-form";
import { studentCopy } from "../model/student-locale";

export type StudentEditorMode = "empty" | "create" | "edit";
export type StudentEditorFeedback = { tone: "success" | "error" | "info"; message: string } | null;
type CatalogLabel = { id: string; fa: string };
type SignupOptions = {
  grades: Array<{ id: number; fa: string }>;
  educationTypes: CatalogLabel[];
  theoreticalTracks: CatalogLabel[];
  vocationalFields: CatalogLabel[];
  gradeStructure: Array<{
    grades: number[];
    education_type_ids: string[];
    track_required: boolean;
  }>;
};

function formCompleteness(form: StudentForm, includePassword: boolean) {
  const values = [
    form.name,
    form.username,
    ...(form.learnerProfile === "school"
      ? [form.gradeId, form.educationTypeId, form.trackId]
      : [form.independentType, form.learningLevel]),
    form.targetUniversity,
    form.targetField,
    form.targetRank,
    form.dailyCapacity,
    ...(includePassword ? [form.password] : []),
  ];
  return Math.round((values.filter((value) => value.trim()).length / values.length) * 100);
}

function Progress({
  value,
  label,
  language,
}: {
  value: number;
  label: string;
  language: "fa" | "en";
}) {
  const locale = language === "en" ? "en-US" : "fa-IR";
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
        <span>{label}</span>
        <strong className="text-slate-700 dark:text-slate-200">
          {language === "fa" ? "٪" : ""}
          {value.toLocaleString(locale)}
          {language === "en" ? "%" : ""}
        </strong>
      </div>
      <div
        className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
      >
        <span
          className="block h-full rounded-full bg-brand transition-[width] motion-reduce:transition-none"
          style={{ width: `${value}%` }}
        />
      </div>
    </div>
  );
}

export function StudentEditor({
  mode,
  form,
  setField,
  onSave,
  onReset,
  onCancelCreate,
  busy,
  dirty,
  saveDirty,
  usernameError,
}: {
  mode: Exclude<StudentEditorMode, "empty">;
  form: StudentForm;
  setField: (key: keyof StudentForm, value: string) => void;
  onSave: () => void;
  onReset: () => void;
  onCancelCreate?: () => void;
  busy: boolean;
  dirty: boolean;
  saveDirty: boolean;
  usernameError?: string;
}) {
  const language = useOptionalAdminLanguage() ?? "fa";
  const copy = studentCopy[language];
  const catalog = useQuery({
    queryKey: ["education-catalog", "signup-options"],
    queryFn: () => api.get<SignupOptions>("/education-catalog/signup-options"),
    staleTime: 30 * 60 * 1000,
  });
  const structure = catalog.data?.gradeStructure.find((item) =>
    item.grades.includes(Number(form.gradeId)),
  );
  const educationTypes =
    catalog.data?.educationTypes.filter((item) =>
      structure?.education_type_ids.includes(item.id),
    ) || [];
  const tracks =
    form.educationTypeId === "theoretical"
      ? catalog.data?.theoreticalTracks || []
      : ["technical_vocational", "kar_danesh"].includes(form.educationTypeId)
        ? catalog.data?.vocationalFields || []
        : [];
  const passwordValid = mode !== "create" || form.password.length >= 12;
  const educationValid =
    form.learnerProfile === "independent"
      ? !!form.independentType
      : !!form.gradeId && !!form.educationTypeId && (!structure?.track_required || !!form.trackId);
  const baseValid = !!form.name.trim() && !!form.username.trim() && educationValid;
  const saveDisabled = !baseValid || busy || !saveDirty || !passwordValid || !!usernameError;
  const completion = useMemo(() => formCompleteness(form, mode === "create"), [form, mode]);

  return (
    <section className="grid gap-5">
      {mode === "create" ? (
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="grid size-9 place-items-center rounded-lg bg-brand text-white">
                <UserPlus size={17} />
              </span>
              <h3 className="font-black text-ink">{copy.createStudent}</h3>
            </div>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
              {copy.createDescription}
            </p>
          </div>
          {onCancelCreate ? (
            <Button variant="ghost" className="h-9 px-2.5" onClick={onCancelCreate}>
              <X size={15} />
              {copy.cancel}
            </Button>
          ) : null}
        </div>
      ) : (
        <div>
          <h3 className="text-sm font-black text-ink">{copy.editProfile}</h3>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{copy.editDescription}</p>
        </div>
      )}

      <Progress value={completion} label={copy.profileCompletion} language={language} />

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {copy.accountInformation}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.accountInformationDescription}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.name}>
            <Input
              autoFocus={mode === "create"}
              value={form.name}
              onChange={(event) => setField("name", event.target.value)}
              placeholder={copy.namePlaceholder}
            />
          </Field>
          <Field label={copy.username} error={usernameError}>
            <Input
              dir="ltr"
              autoComplete="off"
              spellCheck={false}
              value={form.username}
              onChange={(event) => setField("username", event.target.value)}
              placeholder="username"
            />
          </Field>
        </div>
        {mode === "create" ? (
          <Field
            label={copy.password}
            error={
              form.password && form.password.length < 12 ? copy.passwordMinimumCreate : undefined
            }
          >
            <Input
              dir="ltr"
              autoComplete="new-password"
              type="password"
              value={form.password}
              onChange={(event) => setField("password", event.target.value)}
              placeholder={copy.passwordMinimumCreate}
            />
          </Field>
        ) : null}
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {copy.educationStatus}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.educationStatusDescription}
          </p>
        </div>
        <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1 dark:bg-slate-900">
          {(
            [
              ["school", copy.schoolStudent],
              ["independent", copy.independentLearner],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setField("learnerProfile", value)}
              className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${form.learnerProfile === value ? "bg-white text-ink shadow-sm dark:bg-slate-800 dark:text-white" : "text-slate-500"}`}
            >
              {label}
            </button>
          ))}
        </div>
        {form.learnerProfile === "independent" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={copy.learnerType}>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={form.independentType}
                onChange={(event) => setField("independentType", event.target.value)}
              >
                <option value="">{copy.selectLearnerType}</option>
                <option value="adult">{copy.adult}</option>
                <option value="gap_year">{copy.gapYear}</option>
                <option value="homeschool">{copy.homeschool}</option>
                <option value="other">{copy.other}</option>
              </select>
            </Field>
            <Field label={copy.learningLevel}>
              <Input
                value={form.learningLevel}
                onChange={(event) => setField("learningLevel", event.target.value)}
                placeholder={copy.learningLevelPlaceholder}
              />
            </Field>
          </div>
        ) : null}
        {form.learnerProfile === "school" ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label={copy.grade}>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={form.gradeId}
                onChange={(event) => {
                  const gradeId = event.target.value;
                  const next = catalog.data?.gradeStructure.find((item) =>
                    item.grades.includes(Number(gradeId)),
                  );
                  setField("gradeId", gradeId);
                  setField(
                    "educationTypeId",
                    next?.education_type_ids.length === 1 ? next.education_type_ids[0] : "",
                  );
                  setField("trackId", "");
                }}
                disabled={catalog.isLoading}
              >
                <option value="">{copy.selectGrade}</option>
                {catalog.data?.grades.map((grade) => (
                  <option key={grade.id} value={grade.id}>
                    {grade.fa}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={copy.educationType}>
              <select
                className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                value={form.educationTypeId}
                disabled={!form.gradeId || catalog.isLoading}
                onChange={(event) => {
                  setField("educationTypeId", event.target.value);
                  setField("trackId", "");
                }}
              >
                <option value="">{copy.selectEducationType}</option>
                {educationTypes.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.fa}
                  </option>
                ))}
              </select>
            </Field>
            {structure?.track_required ? (
              <Field label={copy.track}>
                <select
                  className="h-11 rounded-xl border border-slate-200 bg-white px-3 text-sm dark:border-slate-700 dark:bg-slate-900"
                  value={form.trackId}
                  disabled={!form.educationTypeId || catalog.isLoading}
                  onChange={(event) => setField("trackId", event.target.value)}
                >
                  <option value="">{copy.selectTrack}</option>
                  {tracks.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.fa}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
          </div>
        ) : null}
        {catalog.isError ? (
          <p role="alert" className="text-xs text-rose-700">
            {copy.educationLoadFailed}
          </p>
        ) : null}
      </section>

      <section className="grid gap-3 rounded-xl border border-slate-200 p-3 dark:border-slate-800">
        <div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {copy.goalAndCapacity}
          </h4>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            {copy.goalAndCapacityDescription}
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.targetUniversity}>
            <Input
              value={form.targetUniversity}
              onChange={(event) => setField("targetUniversity", event.target.value)}
              placeholder={copy.targetUniversity}
            />
          </Field>
          <Field label={copy.targetField}>
            <Input
              value={form.targetField}
              onChange={(event) => setField("targetField", event.target.value)}
              placeholder={copy.targetField}
            />
          </Field>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label={copy.targetRank}>
            <Input
              dir="ltr"
              inputMode="numeric"
              value={form.targetRank}
              onChange={(event) => setField("targetRank", event.target.value)}
              placeholder={copy.targetRankPlaceholder}
            />
          </Field>
          <Field label={copy.dailyCapacity}>
            <Input
              value={form.dailyCapacity}
              onChange={(event) => setField("dailyCapacity", event.target.value)}
              placeholder={copy.dailyCapacityPlaceholder}
            />
          </Field>
        </div>
      </section>

      <div className="sticky bottom-2 z-10 grid gap-2 rounded-xl border border-slate-200 bg-white/95 p-2 shadow-lg backdrop-blur sm:grid-cols-[minmax(0,1fr)_auto] dark:border-slate-800 dark:bg-slate-950/95">
        <Button
          loading={busy}
          loadingLabel={mode === "create" ? copy.creating : copy.saving}
          disabled={saveDisabled}
          onClick={onSave}
        >
          <Save size={16} />
          {mode === "create" ? copy.saveStudent : copy.saveChanges}
        </Button>
        <Button variant="soft" disabled={!dirty || busy} onClick={onReset}>
          <RotateCcw size={16} />
          {copy.reset}
        </Button>
      </div>
    </section>
  );
}
