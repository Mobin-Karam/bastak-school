import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type {
  TimetableWorkspace,
  TimetableImportPreview,
  TimetableImportRow,
} from "@moshaver/api-contract";
import { ResponsiveModal } from "../../../shared/ui/responsive-modal";
import { Button, Field, Input } from "../../../shared/ui/ui";
import {
  readSpreadsheetLayout,
  type SpreadsheetLayoutSheet,
} from "../../../shared/lib/spreadsheet-transfer";
import { notify } from "../../../shared/ui/notifications";
import {
  detectWorkbookBlocks,
  extractWorkbookLessons,
  persianWeekdays,
  type WorkbookBlock,
} from "../lib/timetable-workbook";
import { commitTimetableImport, previewTimetableImport } from "../api/timetable.api";
import { TimetableImportCatalog } from "./TimetableImportCatalog";
import { timetableSelectClass } from "./TimetableLessonEditor";
export function TimetableImportWizard({
  workspace,
  versionId,
  open,
  onClose,
  onSaved,
}: {
  workspace: TimetableWorkspace;
  versionId: string;
  open: boolean;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [sheets, setSheets] = useState<SpreadsheetLayoutSheet[]>([]);
  const [sheetName, setSheetName] = useState("");
  const [filename, setFilename] = useState("");
  const [blocks, setBlocks] = useState<WorkbookBlock[]>([]);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [excluded, setExcluded] = useState<string[]>([]);
  const [step, setStep] = useState(0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<TimetableImportPreview | null>(null);
  const sheet = sheets.find((x) => x.name === sheetName);
  const version = workspace.versions.find((x) => x.id === versionId)!;
  const term = workspace.terms.find((x) => x.id === version.termId)!;
  const raw = useMemo(
    () =>
      sheet
        ? extractWorkbookLessons(
            sheet,
            blocks.filter((x) => selectedBlocks.includes(x.id)),
          )
        : [],
    [sheet, blocks, selectedBlocks],
  );
  const classes = [...new Set(raw.map((x) => x.classLabel))];
  const teachers = [...new Set(raw.map((x) => x.teacherLabel))];
  const periodKeys = [...new Set(raw.map((x) => `${x.blockId}|${x.periodLabel}|${x.timeLabel}`))];
  const subjectKeys = [...new Set(raw.map((x) => `${x.classLabel}|${x.subjectLabel}`))];
  const set = (key: string, value: string) => {
    setMapping((old) => {
      const next = { ...old, [key]: value };
      if (key.startsWith("class:") && old[key] !== value) {
        const prefix = `book:${key.slice(6)}|`;
        for (const mappedKey of Object.keys(next))
          if (mappedKey.startsWith(prefix)) delete next[mappedKey];
      }
      return next;
    });
    setPreview(null);
  };
  const rows = (): TimetableImportRow[] =>
    raw
      .filter((x) => !excluded.includes(x.source))
      .map((x) => {
        const key = `${x.blockId}|${x.periodLabel}|${x.timeLabel}`;
        const period = workspace.periods.find((p) => p.id === mapping[`period:${key}`]);
        const weekday =
          mapping[`day:${x.source}`] !== undefined
            ? Number(mapping[`day:${x.source}`])
            : (x.weekday ?? (mapping.weekday ? Number(mapping.weekday) : null));
        const teacherId = mapping[`rowTeacher:${x.source}`] || mapping[`teacher:${x.teacherLabel}`];
        if (
          !mapping[`class:${x.classLabel}`] ||
          !mapping[`book:${x.classLabel}|${x.subjectLabel}`] ||
          !teacherId ||
          !period ||
          weekday === null
        )
          throw Error(`نگاشت ناقص: ${x.source}`);
        return {
          source: x.source,
          lesson: {
            classroomId: mapping[`class:${x.classLabel}`],
            classBookId: mapping[`book:${x.classLabel}|${x.subjectLabel}`],
            teacherId,
            periodId: period.id,
            weekday,
            startTime: mapping[`useBell:${key}`] === "yes" ? period.startTime : x.startTime,
            endTime: mapping[`useBell:${key}`] === "yes" ? period.endTime : x.endTime,
            startsOn: mapping.startsOn ?? version.effectiveOn,
            endsOn: mapping.endsOn ?? term.endsOn,
            notes: `منبع: ${x.source}`,
          },
        };
      });
  const previewMutation = useMutation({
    mutationFn: () => {
      const normalized = rows();
      if (!normalized.length || normalized.length > 200)
        throw Error("در هر مرحله ۱ تا ۲۰۰ درس انتخاب کنید.");
      return previewTimetableImport(versionId, version.revision, filename, sheetName, normalized);
    },
    onSuccess: (result) => {
      setPreview(result);
      setStep(3);
      setError("");
    },
    onError: (e) => setError(e instanceof Error ? e.message : "پیش‌نمایش انجام نشد."),
  });
  const commit = useMutation({
    mutationFn: () =>
      commitTimetableImport(versionId, version.revision, filename, sheetName, rows()),
    onSuccess: (result) => {
      notify(`${result.imported} درس به پیش‌نویس وارد شد؛ انتشار جداگانه لازم است.`, "success");
      onSaved();
      onClose();
    },
    onError: (e) => setError(e instanceof Error ? e.message : "ورود انجام نشد."),
  });
  async function loadWorkbook(file: Pick<File, "name" | "arrayBuffer">) {
    setBusy(true);
    setError("");
    setPreview(null);
    try {
      const result = await readSpreadsheetLayout(file);
      setFilename(file.name);
      setSheets(result);
      setSheetName("");
      setBlocks([]);
      setSelectedBlocks([]);
      setMapping({});
      setExcluded([]);
      setStep(1);
    } catch (error) {
      setError(error instanceof Error ? error.message : "خواندن فایل انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  async function loadProvidedWorkbook() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${import.meta.env.BASE_URL}${encodeURIComponent("مبین.xlsx")}`);
      if (!response.ok) throw Error("فایل مبین.xlsx در دسترس نیست؛ فایل را انتخاب کنید.");
      const buffer = await response.arrayBuffer();
      await loadWorkbook({ name: "مبین.xlsx", arrayBuffer: async () => buffer });
    } catch (error) {
      setError(error instanceof Error ? error.message : "خواندن فایل انجام نشد.");
    } finally {
      setBusy(false);
    }
  }
  function chooseSheet(name: string) {
    const selected = sheets.find((x) => x.name === name)!;
    setSheetName(name);
    setBlocks(detectWorkbookBlocks(selected));
    setSelectedBlocks([]);
    setMapping({});
    setExcluded([]);
    setPreview(null);
    setStep(1);
  }
  return (
    <ResponsiveModal
      open={open}
      onOpenChange={(next) => {
        if (!next && !commit.isPending) onClose();
      }}
      title="ورود برنامه از اکسل"
      description="انتخاب کاربرگ ← تأیید بلوک‌ها ← نگاشت ← بررسی تداخل ← ورود به پیش‌نویس. انتشار خودکار انجام نمی‌شود."
    >
      <div className="grid gap-3">
        <ol className="flex flex-wrap gap-2 text-xs" aria-label="مراحل ورود">
          {["فایل", "ساختار", "نگاشت", "پیش‌نمایش"].map((x, i) => (
            <li key={x} className={i === step ? "font-bold text-brand" : "text-slate-500"}>
              {i + 1}. {x}
            </li>
          ))}
        </ol>
        <Field label="فایل اکسل">
          <Input
            type="file"
            accept=".xlsx"
            disabled={busy || commit.isPending}
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              void loadWorkbook(file);
            }}
          />
        </Field>
        <Button
          variant="soft"
          disabled={busy || commit.isPending}
          onClick={() => void loadProvidedWorkbook()}
        >
          استفاده از فایل مبین.xlsx
        </Button>
        {busy ? <p role="status">در حال بررسی کاربرگ‌ها…</p> : null}
        {sheets.length ? (
          <Field label="کاربرگ">
            <select
              className={timetableSelectClass}
              value={sheetName}
              onChange={(event) => chooseSheet(event.target.value)}
            >
              <option value="" disabled>
                انتخاب کاربرگ
              </option>
              {sheets.map((x) => (
                <option key={x.name} value={x.name}>
                  {x.name} · {x.rows} ردیف
                </option>
              ))}
            </select>
          </Field>
        ) : null}
        {sheet && step === 1 ? (
          <>
            <p className="text-xs text-slate-500">
              بلوک‌های تکراری را فقط یک‌بار انتخاب کنید. عنوان، بخش مدرسه و سال تاریخی را با نسخه
              مقصد تطبیق دهید. ستون کلاس پیشنهادی قابل اصلاح است.
            </p>
            <p className="rounded-lg border p-2 text-sm">
              {sheet.cells
                .filter((x) => x.row === 1 && x.address === x.master)
                .map((x) => x.value)
                .join(" · ")}
            </p>
            {blocks.map((block) => (
              <div key={block.id} className="grid gap-2 rounded-lg border p-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={selectedBlocks.includes(block.id)}
                    onChange={(event) =>
                      setSelectedBlocks((old) =>
                        event.target.checked
                          ? [...old, block.id]
                          : old.filter((x) => x !== block.id),
                      )
                    }
                  />
                  {block.label}
                </label>
                {block.requiresClassColumnConfirmation ? (
                  <p className="text-xs text-amber-700">
                    سرستون کلاس مشخص نیست؛ شماره ستون را تأیید کنید.
                  </p>
                ) : null}
                <Field label="شماره ستون کلاس">
                  <Input
                    type="number"
                    min={1}
                    max={sheet.columns}
                    value={block.classColumn}
                    onChange={(event) =>
                      setBlocks((old) =>
                        old.map((x) =>
                          x.id === block.id ? { ...x, classColumn: Number(event.target.value) } : x,
                        ),
                      )
                    }
                  />
                </Field>
              </div>
            ))}
            {!blocks.length ? (
              <p>
                بلوک قابل تشخیص وجود ندارد. کاربرگ دیگری انتخاب کنید یا سرستون «زنگ / مدرس» را در
                فایل مشخص کنید.
              </p>
            ) : null}
            <Button disabled={!raw.length} onClick={() => setStep(2)}>
              تأیید ساختار و نگاشت {raw.length} درس
            </Button>
          </>
        ) : null}
        {sheet && step >= 2 ? (
          <>
            <div className="grid grid-cols-2 gap-2">
              <Field label="از تاریخ اجرا">
                <Input
                  type="date"
                  min={version.effectiveOn}
                  max={term.endsOn}
                  value={mapping.startsOn ?? version.effectiveOn}
                  onChange={(event) => set("startsOn", event.target.value)}
                />
              </Field>
              <Field label="تا تاریخ اجرا">
                <Input
                  type="date"
                  min={version.effectiveOn}
                  max={term.endsOn}
                  value={mapping.endsOn ?? term.endsOn}
                  onChange={(event) => set("endsOn", event.target.value)}
                />
              </Field>
            </div>
            <p className="text-xs text-slate-500">
              برای برنامه روز خاص، هر دو تاریخ را همان روز قرار دهید. تاریخ جلالی عنوان منبع به‌صورت
              خودکار تبدیل نمی‌شود.
            </p>
            {raw.some((x) => x.weekday === null) ? (
              <Field label="روز برای ردیف‌های فاقد روز">
                <select
                  className={timetableSelectClass}
                  value={mapping.weekday ?? ""}
                  onChange={(event) => set("weekday", event.target.value)}
                >
                  <option value="">تعیین نشده</option>
                  {persianWeekdays.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
                </select>
              </Field>
            ) : null}
            <TimetableImportCatalog
              workspace={workspace}
              classLabels={classes}
              subjectKeys={subjectKeys}
              classMapping={mapping}
              onPrepared={(kind, source, id) => {
                set(`${kind}:${source}`, id);
                onSaved();
              }}
            />
            <details open={step === 2}>
              <summary className="cursor-pointer font-bold">
                نگاشت کلاس‌ها، کتاب‌ها و استادان
              </summary>
              <div className="mt-3 grid gap-3">
                {classes.map((label) => (
                  <Field key={label} label={`کلاس منبع: ${label}`}>
                    <select
                      className={timetableSelectClass}
                      value={mapping[`class:${label}`] ?? ""}
                      onChange={(event) => set(`class:${label}`, event.target.value)}
                    >
                      <option value="">انتخاب صریح کلاس</option>
                      {workspace.classes.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name} · {x.schoolYear}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
                {subjectKeys.map((key) => {
                  const [classLabel, subject] = key.split("|");
                  const classroom = workspace.classes.find(
                    (x) => x.id === mapping[`class:${classLabel}`],
                  );
                  return (
                    <Field key={key} label={`کتاب ${classLabel}: ${subject}`}>
                      <select
                        className={timetableSelectClass}
                        value={mapping[`book:${key}`] ?? ""}
                        onChange={(event) => set(`book:${key}`, event.target.value)}
                      >
                        <option value="">انتخاب کتاب تخصیص‌یافته کلاس</option>
                        {classroom?.books.map((x) => (
                          <option key={x.id} value={x.id}>
                            {x.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  );
                })}
                {teachers.map((label) => (
                  <Field key={label} label={`استاد منبع: ${label || "ثبت نشده"}`}>
                    <select
                      className={timetableSelectClass}
                      value={mapping[`teacher:${label}`] ?? ""}
                      onChange={(event) => set(`teacher:${label}`, event.target.value)}
                    >
                      <option value="">انتخاب حساب استاد (بدون حدس نام)</option>
                      {workspace.teachers.map((x) => (
                        <option key={x.id} value={x.id}>
                          {x.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                ))}
              </div>
            </details>
            <details open={step === 2}>
              <summary className="cursor-pointer font-bold">زنگ‌ها و زمان‌های مبهم</summary>
              <div className="mt-3 grid gap-3">
                {periodKeys.map((key) => {
                  const [, label, time] = key.split("|");
                  return (
                    <div key={key} className="grid gap-2 rounded-lg border p-2">
                      <Field label={`${label} · منبع ${time || "بدون زمان"}`}>
                        <select
                          className={timetableSelectClass}
                          value={mapping[`period:${key}`] ?? ""}
                          onChange={(event) => set(`period:${key}`, event.target.value)}
                        >
                          <option value="">انتخاب زنگ و نوبت</option>
                          {workspace.periods.map((x) => (
                            <option key={x.id} value={x.id}>
                              {workspace.sessions.find((s) => s.id === x.sessionId)?.name} ·{" "}
                              {x.name} {x.startTime}–{x.endTime}
                            </option>
                          ))}
                        </select>
                      </Field>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={mapping[`useBell:${key}`] === "yes"}
                          onChange={(event) =>
                            set(`useBell:${key}`, event.target.checked ? "yes" : "no")
                          }
                        />
                        به‌جای زمان منبع، زمان همین زنگ انتخاب‌شده را صریح تأیید می‌کنم.
                      </label>
                    </div>
                  );
                })}
              </div>
            </details>
            <details>
              <summary className="cursor-pointer font-bold">
                ردیف‌های منبع و انتخاب درس‌ها ({raw.length})
              </summary>
              <div className="max-h-72 overflow-auto">
                {raw.map((row) => (
                  <div key={row.source} className="my-2 grid gap-2 border-b pb-2 text-xs">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={!excluded.includes(row.source)}
                        onChange={(event) => {
                          setExcluded((old) =>
                            event.target.checked
                              ? old.filter((x) => x !== row.source)
                              : [...old, row.source],
                          );
                          setPreview(null);
                        }}
                      />
                      <span>
                        {row.source} · {row.classLabel} · {row.subjectLabel} · {row.teacherLabel}
                        <span className="block text-amber-700">{row.issues.join("؛ ")}</span>
                      </span>
                    </label>
                    <details>
                      <summary className="cursor-pointer">
                        انتخاب استاد یا روز فقط برای این درس
                      </summary>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <Field label={`استاد ردیف ${row.source}`}>
                          <select
                            className={timetableSelectClass}
                            value={mapping[`rowTeacher:${row.source}`] ?? ""}
                            onChange={(e) => set(`rowTeacher:${row.source}`, e.target.value)}
                          >
                            <option value="">استفاده از نگاشت استاد منبع</option>
                            {workspace.teachers.map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                        <Field label={`روز ردیف ${row.source}`}>
                          <select
                            className={timetableSelectClass}
                            value={mapping[`day:${row.source}`] ?? ""}
                            onChange={(e) => {
                              if (e.target.value === "") {
                                setMapping((old) => {
                                  const next = { ...old };
                                  delete next[`day:${row.source}`];
                                  return next;
                                });
                                setPreview(null);
                              } else set(`day:${row.source}`, e.target.value);
                            }}
                          >
                            <option value="">استفاده از روز منبع / نگاشت عمومی</option>
                            {persianWeekdays.map((x) => (
                              <option key={x.id} value={x.id}>
                                {x.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                    </details>
                  </div>
                ))}
              </div>
            </details>
            <div className="flex gap-2">
              <Button variant="soft" onClick={() => setStep(1)}>
                بازبینی ساختار
              </Button>
              <Button
                disabled={previewMutation.isPending || commit.isPending}
                onClick={() => previewMutation.mutate()}
              >
                {previewMutation.isPending ? "بررسی سرور…" : "بررسی نگاشت و تداخل"}
              </Button>
            </div>
            {preview ? (
              <div aria-live="polite" className="grid gap-2 rounded-lg border p-3">
                <p className="font-bold">
                  {preview.valid
                    ? "نگاشت معتبر؛ آماده ورود به پیش‌نویس"
                    : "ورود متوقف است؛ موارد زیر را برطرف کنید."}
                </p>
                {preview.rows
                  .filter((x) => x.errors.length)
                  .map((x) => (
                    <p key={x.row} className="text-sm text-red-600">
                      {x.source}: {x.errors.join("؛ ")}
                    </p>
                  ))}
                {preview.conflicts.map((x, i) => (
                  <p key={i} className="text-sm text-amber-700">
                    {x.message} {x.date}
                  </p>
                ))}
                <Button
                  disabled={
                    !preview.valid || commit.isPending || preview.revision !== version.revision
                  }
                  onClick={() => commit.mutate()}
                >
                  {commit.isPending ? "ورود…" : "ورود تأییدشده به پیش‌نویس"}
                </Button>
              </div>
            ) : null}
          </>
        ) : null}
        {error ? (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        ) : null}
      </div>
    </ResponsiveModal>
  );
}
