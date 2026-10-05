import { useMutation } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronDown,
  Download,
  FileJson,
  FileSpreadsheet,
  FileUp,
  ShieldCheck,
  UploadCloud,
  XCircle,
} from "lucide-react";
import { DragEvent, useRef, useState } from "react";
import { api } from "../api/api";
import { useLocale } from "./locale";
import { useModal } from "./modal";
import { Button, Card, Field, Textarea } from "./ui";
import { downloadTransferWorkbook, readTransferWorkbook } from "../lib/data-transfer-xlsx";
import {
  QuestionBankDataTransfer,
  type QuestionBankTransferPayload,
} from "./question-bank-data-transfer";

export type TransferPreview = {
  schemaVersion?: number;
  summary?: {
    plans?: number;
    tasks?: number;
    exams?: number;
    questions?: number;
    conflicts?: number;
  };
  errors?: string[];
  warnings?: string[];
  conflicts?: string[];
};
type ImportResult = {
  importId?: string;
  plans?: number;
  tasks?: number;
  exams?: number;
  questions?: number;
  skippedPlans?: number;
  skippedExams?: number;
  published?: boolean;
};
type AssessmentTransferProps = {
  variant?: undefined;
  studentId: string;
  scope: "all" | "plans" | "exams";
  title: string;
  description: string;
  exportFrom?: string;
  exportTo?: string;
  showPlanReplacement?: boolean;
  showExamReplacement?: boolean;
  onImported: () => void;
  canImport?: boolean;
  canCommit?: boolean;
  canExport?: boolean;
};
type QuestionBankTransferProps = {
  variant: "question-bank";
  bankType: "exam" | "quiz";
  canManage?: boolean;
  load: (kind: "export" | "template") => Promise<QuestionBankTransferPayload>;
  readWorkbook: (file: File, bankType: "exam" | "quiz") => Promise<QuestionBankTransferPayload>;
  writeWorkbook: (data: QuestionBankTransferPayload, filename: string) => Promise<void>;
  onImport: (data: QuestionBankTransferPayload) => Promise<{ created: number }>;
  onImported: () => void;
};
type Props = AssessmentTransferProps | QuestionBankTransferProps;
type Tab = "import" | "export";
type ConflictPolicy = "stop" | "skip" | "replace";

export function DataTransferWorkspace(props: Props) {
  if (props.variant === "question-bank") {
    return <QuestionBankDataTransfer {...props} />;
  }
  return <AssessmentDataTransferWorkspace {...props} />;
}

function AssessmentDataTransferWorkspace(props: AssessmentTransferProps) {
  const modal = useModal(),
    { formatDate, language, profile } = useLocale(),
    fileRef = useRef<HTMLInputElement>(null);
  const copy = transferCopy[language];
  const canImport = props.canImport !== false;
  const canCommit = props.canCommit !== false;
  const canExport = props.canExport !== false;
  const [tab, setTab] = useState<Tab>(canImport ? "import" : "export"),
    [json, setJson] = useState(""),
    [fileName, setFileName] = useState(""),
    [advanced, setAdvanced] = useState(false),
    [dragging, setDragging] = useState(false);
  const [planPolicy, setPlanPolicy] = useState<ConflictPolicy>("stop"),
    [examPolicy, setExamPolicy] = useState<ConflictPolicy>("stop"),
    [result, setResult] = useState<ImportResult | null>(null);
  const preview = useMutation({
    mutationFn: (data: unknown) =>
      api.post<TransferPreview>("/import/preview", {
        studentId: props.studentId,
        scope: props.scope,
        data,
      }),
    meta: { successMessage: false },
  });
  const commit = useMutation({
    mutationFn: ({ data, published }: { data: unknown; published: boolean }) =>
      api.post<ImportResult>("/import/commit", {
        studentId: props.studentId,
        scope: props.scope,
        data,
        publishImported: published,
        replaceExistingPlans: planPolicy === "replace",
        replaceExistingExams: examPolicy === "replace",
        skipExistingPlans: planPolicy === "skip",
        skipExistingExams: examPolicy === "skip",
        sourceName: fileName || `Admin v2 ${props.scope} ${new Date().toISOString()}`,
      }),
    onSuccess(data) {
      setResult(data);
      props.onImported();
    },
    meta: { successMessage: copy.importCompleted },
  });
  const download = useMutation({
    mutationFn: async ({
      path,
      filename,
      template = false,
      format,
    }: {
      path?: string;
      filename: string;
      template?: boolean;
      format: "json" | "xlsx";
    }) => {
      const data = template
        ? scopePayload(await api.get<any>("/import/template"), props.scope)
        : await api.get<any>(path!);
      if (format === "xlsx") await downloadTransferWorkbook(data, props.scope, filename);
      else downloadJsonData(data, filename);
    },
    meta: { successMessage: copy.downloadReady },
  });
  const valid = !!preview.data && !preview.data.errors?.length;

  async function loadFile(file?: File) {
    if (!file) return;
    if (!(props as AssessmentTransferProps).studentId) {
      modal.open({
        title: copy.selectStudent,
        description: copy.selectStudentDescription,
        tone: "default",
      });
      return;
    }
    const lowerName = file.name.toLowerCase();
    if (!lowerName.endsWith(".json") && !lowerName.endsWith(".xlsx")) {
      modal.open({
        title: copy.invalidFormat,
        description: copy.invalidFormatDescription,
        tone: "danger",
      });
      return;
    }
    try {
      const data = lowerName.endsWith(".xlsx")
        ? await readTransferWorkbook(file)
        : JSON.parse(await file.text());
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
      const text = JSON.stringify(data, null, 2);
      setJson(text);
      setFileName(file.name);
      setResult(null);
      preview.reset();
      preview.mutate(data);
    } catch (error) {
      modal.open({
        title: copy.unreadableFile,
        description: workbookError(error, copy),
        tone: "danger",
      });
    }
  }
  function parse(text: string, action: (data: unknown) => void) {
    try {
      const data = JSON.parse(text);
      if (!data || typeof data !== "object" || Array.isArray(data)) throw new Error();
      action(data);
    } catch {
      modal.open({
        title: copy.invalidJson,
        description: copy.invalidJsonDescription,
        tone: "danger",
      });
    }
  }
  function confirmCommit(published: boolean) {
    const replacing = [
      planPolicy === "replace" && copy.existingPlans,
      examPolicy === "replace" && copy.existingExams,
    ]
      .filter(Boolean)
      .join(copy.and);
    void modal
      .confirm({
        title: published ? copy.confirmPublishTitle : copy.confirmDraftTitle,
        description: (
          <div className="grid gap-1">
            <span>{summarySentence(preview.data, copy)}</span>
            {replacing ? (
              <strong className="text-rose-700">{copy.replacingWarning(replacing)}</strong>
            ) : null}
          </div>
        ),
        tone: replacing ? "danger" : "default",
        confirmLabel: published ? copy.publishImport : copy.saveDraft,
      })
      .then((ok) => ok && parse(json, (data) => commit.mutate({ data, published })));
  }
  function reset() {
    setJson("");
    setFileName("");
    setResult(null);
    setAdvanced(false);
    setPlanPolicy("stop");
    setExamPolicy("stop");
    preview.reset();
    if (fileRef.current) fileRef.current.value = "";
  }
  const exportPath = `/export/json?studentId=${encodeURIComponent(props.studentId)}&scope=${props.scope}${props.exportFrom ? `&from=${props.exportFrom}` : ""}${props.exportTo ? `&to=${props.exportTo}` : ""}`;
  const filename = `moshaver-${props.scope}-${props.exportFrom || "all"}-${props.exportTo || "all"}.xlsx`;

  return (
    <Card className="overflow-hidden p-0">
      <div
        className={`border-b border-slate-200 p-4 sm:p-5 ${profile.direction === "rtl" ? "bg-gradient-to-l from-indigo-50 via-white to-white" : "bg-gradient-to-r from-indigo-50 via-white to-white"}`}
      >
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-3">
            <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand text-white">
              <FileSpreadsheet size={22} />
            </span>
            <div>
              <h3 className="text-lg font-black">{props.title}</h3>
              <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-500">{props.description}</p>
            </div>
          </div>
          <div className="flex rounded-lg bg-slate-100 p-1">
            {canImport ? (
              <TabButton active={tab === "import"} onClick={() => setTab("import")}>
                <FileUp size={16} />
                {copy.import}
              </TabButton>
            ) : null}
            {canExport ? (
              <TabButton active={tab === "export"} onClick={() => setTab("export")}>
                <Download size={16} />
                {copy.export}
              </TabButton>
            ) : null}
          </div>
        </div>
      </div>
      {tab === "import" ? (
        <div className="p-4 sm:p-5">
          {result ? (
            <ResultView result={result} onReset={reset} />
          ) : (
            <div className="grid gap-5 xl:grid-cols-[minmax(340px,.8fr)_minmax(0,1.2fr)]">
              <section className="grid content-start gap-3">
                <Step number={1} title={copy.chooseFileStep} active={!preview.data} />
                <div
                  onDragEnter={(event) => {
                    event.preventDefault();
                    setDragging(true);
                  }}
                  onDragOver={(event) => event.preventDefault()}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(event: DragEvent<HTMLDivElement>) => {
                    event.preventDefault();
                    setDragging(false);
                    loadFile(event.dataTransfer.files[0]);
                  }}
                  aria-disabled={!props.studentId}
                  className={`grid min-h-52 place-items-center rounded-xl border-2 border-dashed p-6 text-center transition ${!props.studentId ? "border-slate-200 bg-slate-100 opacity-70" : dragging ? "border-brand bg-indigo-50" : fileName ? "border-emerald-300 bg-emerald-50/50" : "border-slate-200 bg-slate-50 hover:border-indigo-300"}`}
                >
                  <div className="grid justify-items-center gap-3">
                    {fileName ? (
                      <CheckCircle2 size={38} className="text-emerald-600" />
                    ) : (
                      <UploadCloud size={42} className="text-slate-400" />
                    )}
                    <div>
                      <strong className="block">{fileName || copy.dropFile}</strong>
                      <span className="mt-1 block text-xs text-slate-500">
                        {fileName ? copy.fileValidated : copy.orChooseFile}
                      </span>
                    </div>
                    <input
                      ref={fileRef}
                      className="sr-only"
                      type="file"
                      accept="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/json,.xlsx,.json"
                      onChange={(event) => void loadFile(event.target.files?.[0])}
                    />
                    <Button
                      type="button"
                      variant="soft"
                      disabled={!props.studentId}
                      onClick={() => fileRef.current?.click()}
                    >
                      {fileName ? copy.changeFile : copy.chooseFile}
                    </Button>
                  </div>
                </div>
                <button
                  type="button"
                  className="flex items-center gap-2 text-sm font-semibold text-brand"
                  onClick={() => setAdvanced((value) => !value)}
                >
                  <ChevronDown size={16} className={`transition ${advanced ? "rotate-180" : ""}`} />
                  {copy.manualJson}
                </button>
                {advanced ? (
                  <Field label={copy.jsonText}>
                    <Textarea
                      dir="ltr"
                      rows={10}
                      value={json}
                      onChange={(event) => {
                        setJson(event.target.value);
                        setFileName("");
                        setResult(null);
                        preview.reset();
                      }}
                      placeholder='{"schemaVersion": 2, ...}'
                    />
                    <Button
                      variant="soft"
                      loading={preview.isPending}
                      disabled={!json || !props.studentId}
                      onClick={() => parse(json, (data) => preview.mutate(data))}
                    >
                      {copy.validateText}
                    </Button>
                  </Field>
                ) : null}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="ghost"
                    loading={
                      download.isPending &&
                      download.variables?.template &&
                      download.variables.format === "xlsx"
                    }
                    onClick={() =>
                      download.mutate({
                        filename: `moshaver-${props.scope}-template.xlsx`,
                        template: true,
                        format: "xlsx",
                      })
                    }
                  >
                    {copy.excelTemplate}
                  </Button>
                  <Button
                    variant="ghost"
                    loading={
                      download.isPending &&
                      download.variables?.template &&
                      download.variables.format === "json"
                    }
                    onClick={() =>
                      download.mutate({
                        filename: `moshaver-${props.scope}-template.json`,
                        template: true,
                        format: "json",
                      })
                    }
                  >
                    {copy.jsonTemplate}
                  </Button>
                </div>
              </section>
              <section className="grid content-start gap-4">
                <Step number={2} title={copy.reviewAndResolve} active={!!preview.data} />
                {preview.isPending ? (
                  <ReviewLoading />
                ) : preview.data ? (
                  <Review preview={preview.data} />
                ) : (
                  <EmptyReview />
                )}
                <div className="border-t border-slate-200 pt-4">
                  <Step number={3} title={copy.chooseSaveMethod} active={valid} />
                  <div
                    className={`mt-3 grid gap-3 ${valid ? "" : "pointer-events-none opacity-45"}`}
                  >
                    {canCommit ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        {props.showPlanReplacement ? (
                          <ConflictPolicyPicker
                            value={planPolicy}
                            onChange={setPlanPolicy}
                            title={copy.sameDatePlans}
                            description={copy.sameDatePlansDescription}
                          />
                        ) : null}
                        {props.showExamReplacement ? (
                          <ConflictPolicyPicker
                            value={examPolicy}
                            onChange={setExamPolicy}
                            title={copy.duplicateExams}
                            description={copy.duplicateExamsDescription}
                          />
                        ) : null}
                      </div>
                    ) : (
                      <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                        {copy.previewOnlyNotice}
                      </p>
                    )}
                    {canCommit ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          loading={commit.isPending}
                          disabled={!valid}
                          onClick={() => confirmCommit(false)}
                        >
                          {copy.saveDraft}
                        </Button>
                        <Button
                          loading={commit.isPending}
                          disabled={!valid}
                          onClick={() => confirmCommit(true)}
                        >
                          {copy.saveAndPublish}
                        </Button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-5 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_380px]">
          <section className="rounded-xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-lg bg-white text-brand shadow-sm">
                <Download size={20} />
              </span>
              <div>
                <h4 className="font-black">{copy.preparingExport}</h4>
                <p className="text-sm text-slate-500">{copy.exportDescription}</p>
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <ExportFact
                label={copy.scope}
                value={
                  props.scope === "exams"
                    ? copy.allExams
                    : props.scope === "plans"
                      ? copy.plans
                      : copy.plansAndRelatedExams
                }
              />
              <ExportFact
                label={copy.range}
                value={
                  props.exportFrom && props.exportTo
                    ? `${formatDate(props.exportFrom)} ${copy.to} ${formatDate(props.exportTo)}`
                    : copy.allDates
                }
              />
              <ExportFact label={copy.structure} value={copy.editableExcelSchema} />
              <ExportFact
                label={copy.contents}
                value={props.scope === "exams" ? copy.examContents : copy.planContents}
              />
            </div>
          </section>
          <aside className="grid content-start gap-3 rounded-xl border border-indigo-200 bg-indigo-50 p-5">
            <ShieldCheck size={28} className="text-brand" />
            <h4 className="font-black">{copy.recoverableExport}</h4>
            <p className="text-sm leading-6 text-slate-600">{copy.recoverableExportDescription}</p>
            <Button
              loading={
                download.isPending &&
                download.variables?.path === exportPath &&
                download.variables.format === "xlsx"
              }
              disabled={!props.studentId}
              onClick={() => download.mutate({ path: exportPath, filename, format: "xlsx" })}
            >
              <FileSpreadsheet size={17} /> {copy.downloadExcel}
            </Button>
            <Button
              variant="soft"
              loading={
                download.isPending &&
                download.variables?.path === exportPath &&
                download.variables.format === "json"
              }
              disabled={!props.studentId}
              onClick={() =>
                download.mutate({
                  path: exportPath,
                  filename: filename.replace(/\.xlsx$/, ".json"),
                  format: "json",
                })
              }
            >
              <FileJson size={17} /> {copy.downloadJson}
            </Button>
            {canImport ? (
              <Button variant="ghost" onClick={() => setTab("import")}>
                {copy.returnToImport}
              </Button>
            ) : null}
          </aside>
        </div>
      )}
    </Card>
  );
}

function scopePayload(data: Record<string, unknown>, scope: AssessmentTransferProps["scope"]) {
  return {
    ...data,
    plans: scope === "exams" ? [] : Array.isArray(data.plans) ? data.plans : [],
    exams: scope === "plans" ? [] : Array.isArray(data.exams) ? data.exams : [],
  };
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex h-9 items-center gap-2 rounded-md px-3 text-sm font-semibold transition ${active ? "bg-white text-brand shadow-sm" : "text-slate-500"}`}
    >
      {children}
    </button>
  );
}
function Step({ number, title, active }: { number: number; title: string; active: boolean }) {
  const { profile } = useLocale();
  return (
    <div className="flex items-center gap-2">
      <span
        className={`grid size-7 place-items-center rounded-full text-xs font-black ${active ? "bg-brand text-white" : "bg-slate-100 text-slate-400"}`}
      >
        {number.toLocaleString(profile.locale)}
      </span>
      <strong className={active ? "text-ink" : "text-slate-400"}>{title}</strong>
    </div>
  );
}
function EmptyReview() {
  const { language } = useLocale();
  const copy = transferCopy[language];
  return (
    <div className="grid min-h-52 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50 p-6 text-center">
      <div>
        <FileJson className="mx-auto text-slate-300" size={38} />
        <strong className="mt-3 block text-slate-500">{copy.reviewNotReady}</strong>
        <p className="mt-1 text-xs text-slate-400">{copy.reviewNotReadyDescription}</p>
      </div>
    </div>
  );
}
function ReviewLoading() {
  const { language } = useLocale();
  const copy = transferCopy[language];
  return (
    <div className="grid min-h-52 place-items-center rounded-xl border border-slate-200 bg-slate-50">
      <div className="text-center">
        <span className="mx-auto block size-9 animate-spin rounded-full border-4 border-indigo-100 border-t-brand" />
        <strong className="mt-3 block text-sm">{copy.reviewing}</strong>
      </div>
    </div>
  );
}
function Review({ preview }: { preview: TransferPreview }) {
  const { language, profile } = useLocale();
  const copy = transferCopy[language];
  const summary = preview.summary || {},
    hasErrors = !!preview.errors?.length;
  return (
    <div className="grid gap-3">
      <div
        className={`flex items-start gap-3 rounded-xl border p-4 ${hasErrors ? "border-rose-200 bg-rose-50" : "border-emerald-200 bg-emerald-50"}`}
      >
        {hasErrors ? (
          <XCircle className="shrink-0 text-rose-600" />
        ) : (
          <CheckCircle2 className="shrink-0 text-emerald-600" />
        )}
        <div>
          <strong className={hasErrors ? "text-rose-800" : "text-emerald-800"}>
            {hasErrors ? copy.fileNeedsFixing : copy.fileReady}
          </strong>
          <p className="mt-1 text-xs text-slate-600">
            {copy.schemaVersion}: {(preview.schemaVersion || 2).toLocaleString(profile.locale)}
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Count label={copy.plan} value={summary.plans} />
        <Count label={copy.task} value={summary.tasks} />
        <Count label={copy.exam} value={summary.exams} />
        <Count label={copy.question} value={summary.questions} />
        <Count label={copy.conflict} value={summary.conflicts} warning={!!summary.conflicts} />
      </div>
      {preview.errors?.length ? (
        <IssueList title={copy.blockingErrors} items={preview.errors} tone="red" />
      ) : null}
      {preview.warnings?.length ? (
        <IssueList title={copy.attentionItems} items={preview.warnings} tone="amber" />
      ) : null}
      {preview.conflicts?.length ? (
        <IssueList title={copy.timeConflicts} items={preview.conflicts} tone="amber" />
      ) : null}
    </div>
  );
}
function Count({
  label,
  value = 0,
  warning,
}: {
  label: string;
  value?: number;
  warning?: boolean;
}) {
  const { profile } = useLocale();
  return (
    <div
      className={`rounded-lg border bg-white p-3 text-center ${warning ? "border-amber-200" : "border-slate-200"}`}
    >
      <strong className={warning ? "text-amber-700" : "text-ink"}>
        {value.toLocaleString(profile.locale)}
      </strong>
      <span className="mt-1 block text-xs text-slate-500">{label}</span>
    </div>
  );
}
function IssueList({
  title,
  items,
  tone,
}: {
  title: string;
  items: string[];
  tone: "red" | "amber";
}) {
  const { profile } = useLocale();
  return (
    <details
      open={tone === "red"}
      className={`rounded-lg border p-3 ${tone === "red" ? "border-rose-200 bg-rose-50 text-rose-800" : "border-amber-200 bg-amber-50 text-amber-800"}`}
    >
      <summary className="cursor-pointer font-bold">
        {tone === "red" ? (
          <XCircle className="me-2 inline" size={16} />
        ) : (
          <AlertTriangle className="me-2 inline" size={16} />
        )}{" "}
        {title} ({items.length.toLocaleString(profile.locale)})
      </summary>
      <ul className="mt-2 list-inside list-disc text-xs leading-6">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    </details>
  );
}
function ConflictPolicyPicker({
  value,
  onChange,
  title,
  description,
}: {
  value: ConflictPolicy;
  onChange: (value: ConflictPolicy) => void;
  title: string;
  description: string;
}) {
  const { language } = useLocale();
  const copy = transferCopy[language];
  const options: { value: ConflictPolicy; label: string; hint: string }[] = [
    { value: "stop", label: copy.policyStop, hint: copy.policyStopHint },
    {
      value: "skip",
      label: copy.policySkip,
      hint: copy.policySkipHint,
    },
    { value: "replace", label: copy.policyReplace, hint: copy.policyReplaceHint },
  ];
  return (
    <fieldset className="rounded-xl border border-slate-200 p-3">
      <legend className="px-1 text-sm font-black">{title}</legend>
      <p className="mb-3 text-xs leading-5 text-slate-500">{description}</p>
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2 transition ${value === option.value ? (option.value === "replace" ? "border-rose-300 bg-rose-50" : "border-indigo-300 bg-indigo-50") : "border-slate-200 hover:bg-slate-50"}`}
          >
            <input
              type="radio"
              name={`${title}-policy`}
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            <span>
              <strong className="block text-xs">{option.label}</strong>
              <small className="text-[11px] text-slate-500">{option.hint}</small>
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}
function ResultView({ result, onReset }: { result: ImportResult; onReset: () => void }) {
  const { language } = useLocale();
  const copy = transferCopy[language];
  return (
    <div className="grid min-h-80 place-items-center p-6 text-center">
      <div className="max-w-xl">
        <span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
          <CheckCircle2 size={34} />
        </span>
        <h4 className="mt-4 text-xl font-black">{copy.importFinished}</h4>
        <p className="mt-2 text-sm text-slate-500">
          {result.published ? copy.publishedForStudent : copy.savedAsDraft}
        </p>
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <Count label={copy.plan} value={result.plans} />
          <Count label={copy.task} value={result.tasks} />
          <Count label={copy.exam} value={result.exams} />
          <Count label={copy.question} value={result.questions} />
        </div>
        {result.skippedPlans || result.skippedExams ? (
          <p className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {copy.skippedDuplicates((result.skippedPlans || 0) + (result.skippedExams || 0))}
          </p>
        ) : null}
        <Button className="mt-5" variant="soft" onClick={onReset}>
          {copy.importAnotherFile}
        </Button>
      </div>
    </div>
  );
}
function ExportFact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <span className="text-xs text-slate-500">{label}</span>
      <strong className="mt-1 block text-sm">{value}</strong>
    </div>
  );
}
function summarySentence(
  preview: TransferPreview | undefined,
  copy: (typeof transferCopy)[keyof typeof transferCopy],
) {
  const summary = preview?.summary || {};
  return copy.summary(
    Number(summary.plans || 0),
    Number(summary.tasks || 0),
    Number(summary.exams || 0),
    Number(summary.questions || 0),
  );
}
function workbookError(error: unknown, copy: (typeof transferCopy)[keyof typeof transferCopy]) {
  const message = error instanceof Error ? error.message : "";
  if (message.startsWith("MISSING_COLUMNS:"))
    return copy.missingColumns(message.slice("MISSING_COLUMNS:".length));
  if (message === "WORKBOOK_SHEETS_MISSING") return copy.sheetsMissing;
  return copy.invalidWorkbook;
}

const transferCopy = {
  fa: {
    importCompleted: "ورود اطلاعات با موفقیت تکمیل شد.",
    downloadReady: "فایل آماده و دانلود شد.",
    selectStudent: "دانش‌آموز را انتخاب کنید",
    selectStudentDescription: "پیش از بارگذاری فایل، دانش‌آموز مقصد را انتخاب کنید.",
    invalidFormat: "فرمت فایل قابل قبول نیست",
    invalidFormatDescription: "یک فایل Excel (.xlsx) یا JSON انتخاب کنید.",
    unreadableFile: "فایل قابل خواندن نیست",
    invalidJson: "JSON معتبر نیست",
    invalidJsonDescription: "ساختار فایل، کوتیشن‌ها و ویرگول‌ها را بررسی کنید.",
    import: "ورود اطلاعات",
    export: "خروجی گرفتن",
    chooseFile: "انتخاب فایل",
    chooseFileStep: "فایل را انتخاب کنید",
    dropFile: "فایل Excel یا JSON را اینجا رها کنید",
    fileValidated: "فایل به‌صورت خودکار اعتبارسنجی شد",
    orChooseFile: "یا از رایانه انتخاب کنید",
    changeFile: "تغییر فایل",
    manualJson: "ورود دستی JSON",
    jsonText: "متن JSON",
    validateText: "اعتبارسنجی متن",
    reviewAndResolve: "بررسی و رفع مشکل",
    chooseSaveMethod: "روش ثبت را انتخاب کنید",
    excelTemplate: "نمونه Excel",
    jsonTemplate: "نمونه JSON",
    existingPlans: "برنامه‌های موجود",
    existingExams: "آزمون‌های موجود",
    and: " و ",
    confirmPublishTitle: "ثبت و انتشار اطلاعات؟",
    confirmDraftTitle: "ثبت اطلاعات به‌صورت پیش‌نویس؟",
    replacingWarning: (items: string) => `${items} در صورت تطابق جایگزین می‌شوند.`,
    publishImport: "ثبت و انتشار",
    saveDraft: "ثبت پیش‌نویس",
    saveAndPublish: "ثبت و انتشار برای دانش‌آموز",
    sameDatePlans: "برنامه‌های هم‌تاریخ",
    sameDatePlansDescription: "برنامه دارای سابقه انجام‌شده هرگز جایگزین نمی‌شود.",
    duplicateExams: "آزمون‌های تکراری",
    duplicateExamsDescription: "تطبیق بر اساس عنوان و تاریخ آزمون انجام می‌شود.",
    previewOnlyNotice:
      "شما اجازه بررسی فایل را دارید، اما ثبت نهایی به دسترسی import.commit نیاز دارد.",
    preparingExport: "آماده‌سازی خروجی",
    exportDescription: "فایل استاندارد schema-v2 و قابل ورود مجدد تولید می‌شود.",
    scope: "محدوده",
    allExams: "همه آزمون‌ها",
    plans: "برنامه‌ها",
    plansAndRelatedExams: "برنامه‌ها و آزمون‌های مرتبط",
    range: "بازه",
    to: "تا",
    allDates: "تمام تاریخ‌ها",
    structure: "ساختار",
    editableExcelSchema: "Excel قابل ویرایش · schema-v2",
    contents: "محتوا",
    examContents: "سؤال، پاسخ، بودجه و زمان‌بندی",
    planContents: "فعالیت، یادداشت و پیوند آزمون",
    recoverableExport: "خروجی قابل بازیابی",
    recoverableExportDescription:
      "شناسه‌های داخلی به ارجاع‌های قابل‌حمل تبدیل می‌شوند تا اتصال برنامه و آزمون هنگام ورود مجدد حفظ شود.",
    downloadExcel: "دانلود خروجی Excel",
    downloadJson: "دانلود خروجی JSON",
    returnToImport: "بازگشت به ورود اطلاعات",
    reviewNotReady: "پیش‌نمایش هنوز آماده نیست",
    reviewNotReadyDescription: "پس از انتخاب فایل، نتیجه بررسی اینجا نمایش داده می‌شود.",
    reviewing: "در حال بررسی ساختار و تداخل‌ها…",
    fileNeedsFixing: "فایل نیاز به اصلاح دارد",
    fileReady: "فایل معتبر و آماده ثبت است",
    schemaVersion: "نسخه ساختار",
    plan: "برنامه",
    task: "فعالیت",
    exam: "آزمون",
    question: "سؤال",
    conflict: "تداخل",
    blockingErrors: "خطاهای مسدودکننده",
    attentionItems: "موارد نیازمند توجه",
    timeConflicts: "تداخل‌های زمانی",
    policyStop: "توقف امن",
    policyStopHint: "بدون تغییر اطلاعات قبلی",
    policySkip: "رد کردن تکراری‌ها",
    policySkipHint: "فقط موارد جدید ثبت شوند",
    policyReplace: "جایگزینی",
    policyReplaceHint: "اطلاعات قبلی بازنویسی شوند",
    importFinished: "ورود اطلاعات تکمیل شد",
    publishedForStudent: "اطلاعات برای دانش‌آموز منتشر شد.",
    savedAsDraft: "اطلاعات به‌صورت پیش‌نویس ذخیره شد.",
    skippedDuplicates: (count: number) =>
      `${count.toLocaleString("fa-IR")} مورد تکراری بدون تغییر رد شد.`,
    importAnotherFile: "ورود فایل دیگر",
    summary: (plans: number, tasks: number, exams: number, questions: number) =>
      `${plans.toLocaleString("fa-IR")} برنامه، ${tasks.toLocaleString("fa-IR")} فعالیت، ${exams.toLocaleString("fa-IR")} آزمون و ${questions.toLocaleString("fa-IR")} سؤال ثبت می‌شود.`,
    missingColumns: (columns: string) => `ستون‌های لازم پیدا نشد: ${columns}`,
    sheetsMissing: "برگه Plans یا Exams در فایل وجود ندارد.",
    invalidWorkbook: "ساختار فایل یا داده‌های آن معتبر نیست. قالب نمونه را دانلود و ویرایش کنید.",
  },
  en: {
    importCompleted: "The import was completed successfully.",
    downloadReady: "Your file is ready to download.",
    selectStudent: "Select a student",
    selectStudentDescription: "Select the destination student before uploading a file.",
    invalidFormat: "Unsupported file format",
    invalidFormatDescription: "Choose an Excel (.xlsx) or JSON file.",
    unreadableFile: "Could not read the file",
    invalidJson: "Invalid JSON",
    invalidJsonDescription: "Check the structure, quotation marks, and commas.",
    import: "Import",
    export: "Export",
    chooseFile: "Choose file",
    chooseFileStep: "Choose a file",
    dropFile: "Drop an Excel or JSON file here",
    fileValidated: "The file was validated automatically",
    orChooseFile: "or choose one from your device",
    changeFile: "Change file",
    manualJson: "Enter JSON manually",
    jsonText: "JSON text",
    validateText: "Validate text",
    reviewAndResolve: "Review and resolve",
    chooseSaveMethod: "Choose how to save",
    excelTemplate: "Excel template",
    jsonTemplate: "JSON template",
    existingPlans: "existing plans",
    existingExams: "existing exams",
    and: " and ",
    confirmPublishTitle: "Save and publish imported data?",
    confirmDraftTitle: "Save imported data as a draft?",
    replacingWarning: (items: string) => `Matching ${items} will be replaced.`,
    publishImport: "Save and publish",
    saveDraft: "Save as draft",
    saveAndPublish: "Save and publish for the student",
    sameDatePlans: "Plans on the same date",
    sameDatePlansDescription: "A plan with completed activity is never replaced.",
    duplicateExams: "Duplicate exams",
    duplicateExamsDescription: "Matches use the exam title and date.",
    previewOnlyNotice:
      "You can review this file, but final saving requires the import.commit capability.",
    preparingExport: "Prepare export",
    exportDescription: "A standard, re-importable schema-v2 file will be generated.",
    scope: "Scope",
    allExams: "All exams",
    plans: "Plans",
    plansAndRelatedExams: "Plans and related exams",
    range: "Date range",
    to: "to",
    allDates: "All dates",
    structure: "Structure",
    editableExcelSchema: "Editable Excel · schema-v2",
    contents: "Contents",
    examContents: "Questions, answers, syllabus, and scheduling",
    planContents: "Activities, notes, and exam links",
    recoverableExport: "Recoverable export",
    recoverableExportDescription:
      "Internal IDs become portable references so plan and exam connections survive a later import.",
    downloadExcel: "Download Excel export",
    downloadJson: "Download JSON export",
    returnToImport: "Return to import",
    reviewNotReady: "Preview is not ready yet",
    reviewNotReadyDescription: "The validation result will appear here after you select a file.",
    reviewing: "Reviewing structure and conflicts…",
    fileNeedsFixing: "This file needs changes",
    fileReady: "This file is valid and ready to save",
    schemaVersion: "Schema version",
    plan: "Plan",
    task: "Activity",
    exam: "Exam",
    question: "Question",
    conflict: "Conflict",
    blockingErrors: "Blocking errors",
    attentionItems: "Items needing attention",
    timeConflicts: "Time conflicts",
    policyStop: "Stop safely",
    policyStopHint: "Leave existing data unchanged",
    policySkip: "Skip duplicates",
    policySkipHint: "Save only new items",
    policyReplace: "Replace",
    policyReplaceHint: "Overwrite matching existing data",
    importFinished: "Import complete",
    publishedForStudent: "The data was published for the student.",
    savedAsDraft: "The data was saved as a draft.",
    skippedDuplicates: (count: number) =>
      `${count.toLocaleString("en-US")} duplicate items were skipped without changes.`,
    importAnotherFile: "Import another file",
    summary: (plans: number, tasks: number, exams: number, questions: number) =>
      `${plans.toLocaleString("en-US")} plans, ${tasks.toLocaleString("en-US")} activities, ${exams.toLocaleString("en-US")} exams, and ${questions.toLocaleString("en-US")} questions will be saved.`,
    missingColumns: (columns: string) => `Required columns are missing: ${columns}`,
    sheetsMissing: "The workbook must include a Plans or Exams sheet.",
    invalidWorkbook:
      "The file structure or data is invalid. Download and edit the template before trying again.",
  },
} as const;

function downloadJsonData(data: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
