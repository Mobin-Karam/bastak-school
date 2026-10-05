import { useMutation } from "@tanstack/react-query";
import { Download, FileJson, FileSpreadsheet, FlaskConical, Upload } from "lucide-react";
import { useRef } from "react";
import { notify } from "./notifications";
import { Button, Card } from "./ui";
import { useLocale } from "./locale";

export type QuestionBankTransferPayload = {
  schemaVersion: "1.0";
  bankType: "exam" | "quiz";
  questions: unknown[];
};

type TransferFormat = "json" | "xlsx";

export function QuestionBankDataTransfer<T extends QuestionBankTransferPayload>({
  bankType,
  canManage = true,
  load,
  readWorkbook,
  writeWorkbook,
  onImport,
  onImported,
}: {
  bankType: "exam" | "quiz";
  canManage?: boolean;
  load: (kind: "export" | "template") => Promise<T>;
  readWorkbook: (file: File, bankType: "exam" | "quiz") => Promise<T>;
  writeWorkbook: (data: T, filename: string) => Promise<void>;
  onImport: (data: T) => Promise<{ created: number }>;
  onImported: () => void;
}) {
  const { language, profile } = useLocale();
  const copy = questionTransferCopy[language];
  const input = useRef<HTMLInputElement>(null);
  const label = bankType === "exam" ? copy.examBank : copy.quizBank;
  const download = useMutation({
    mutationFn: async ({
      kind,
      format,
    }: {
      kind: "export" | "template";
      format: TransferFormat;
    }) => {
      const data = await load(kind);
      const filename = `moshaver-${bankType}-question-bank-${kind}.${format}`;
      if (format === "json") downloadJson(data, filename);
      else await writeWorkbook(data, filename);
    },
    onSuccess: () => notify(copy.downloadReady),
    onError: (error) =>
      notify(error instanceof Error ? error.message : copy.downloadFailed, "error"),
  });
  const upload = useMutation({
    mutationFn: onImport,
    onSuccess: (result) => {
      onImported();
      notify(copy.imported(result.created, profile.locale, label));
    },
    onError: (error) => notify(error instanceof Error ? error.message : copy.importFailed, "error"),
  });
  async function selectFile(file?: File) {
    if (!file) return;
    try {
      const data = file.name.toLowerCase().endsWith(".xlsx")
        ? await readWorkbook(file, bankType)
        : (JSON.parse(await file.text()) as T);
      if (!isCompatiblePayload(data, bankType)) {
        throw new Error(copy.incompatible);
      }
      upload.mutate(data);
    } catch (error) {
      notify(error instanceof Error ? error.message : copy.invalidFile, "error");
    } finally {
      if (input.current) input.current.value = "";
    }
  }
  const get = (kind: "export" | "template", format: TransferFormat) => () =>
    download.mutate({ kind, format });
  return (
    <Card className="grid gap-3 p-3">
      <div>
        <h2 className="text-sm font-black">{copy.title(label)}</h2>
        <p className="text-xs leading-5 text-slate-500">{copy.description}</p>
      </div>
      <div className="flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="soft"
          loading={download.isPending}
          onClick={get("export", "xlsx")}
        >
          <Download size={15} />
          {copy.exportExcel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={download.isPending}
          onClick={get("export", "json")}
        >
          <FileJson size={15} />
          {copy.exportJson}
        </Button>
        <Button
          size="sm"
          variant="soft"
          loading={download.isPending}
          onClick={get("template", "xlsx")}
        >
          <FileSpreadsheet size={15} />
          {copy.templateExcel}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          loading={download.isPending}
          onClick={get("template", "json")}
        >
          <FlaskConical size={15} />
          {copy.sampleJson}
        </Button>
        {canManage ? (
          <>
            <input
              ref={input}
              className="sr-only"
              type="file"
              accept=".json,.xlsx,application/json,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
              onChange={(event) => void selectFile(event.target.files?.[0])}
            />
            <Button size="sm" loading={upload.isPending} onClick={() => input.current?.click()}>
              <Upload size={15} />
              {copy.importFile}
            </Button>
          </>
        ) : null}
      </div>
    </Card>
  );
}

const questionTransferCopy = {
  fa: {
    examBank: "بانک سؤال آزمون",
    quizBank: "بانک سؤال آزمونک",
    downloadReady: "فایل آماده دانلود شد.",
    downloadFailed: "دریافت فایل ناموفق بود.",
    imported: (count: number, locale: string, label: string) =>
      `${count.toLocaleString(locale)} سؤال به ${label} افزوده شد.`,
    importFailed: "ورود سؤال‌ها ناموفق بود.",
    incompatible: "ساختار فایل با این بانک سؤال سازگار نیست.",
    invalidFile: "فایل JSON یا Excel معتبر نیست.",
    title: (label: string) => `ورود و خروجی ${label}`,
    description:
      "قالب را برای شروع دانلود کنید، نمونه آن را ببینید و پس از تکمیل، همان فایل را وارد کنید. هر ردیف باید چهار گزینه یکتا و پاسخ صحیح داشته باشد.",
    exportExcel: "خروجی Excel",
    exportJson: "خروجی JSON",
    templateExcel: "قالب Excel",
    sampleJson: "نمونه JSON",
    importFile: "ورود JSON یا Excel",
  },
  en: {
    examBank: "Exam question bank",
    quizBank: "Quiz question bank",
    downloadReady: "Your file is ready to download.",
    downloadFailed: "Could not download the file.",
    imported: (count: number, locale: string, label: string) =>
      `${count.toLocaleString(locale)} questions were added to ${label}.`,
    importFailed: "Could not import the questions.",
    incompatible: "This file is not compatible with this question bank.",
    invalidFile: "Choose a valid JSON or Excel file.",
    title: (label: string) => `Import and export ${label}`,
    description:
      "Download a template to start, review the sample, then import the completed file. Every row needs four unique choices and a correct answer.",
    exportExcel: "Export Excel",
    exportJson: "Export JSON",
    templateExcel: "Excel template",
    sampleJson: "JSON sample",
    importFile: "Import JSON or Excel",
  },
} as const;

function isCompatiblePayload(
  value: unknown,
  bankType: "exam" | "quiz",
): value is QuestionBankTransferPayload {
  return (
    !!value &&
    typeof value === "object" &&
    (value as QuestionBankTransferPayload).schemaVersion === "1.0" &&
    (value as QuestionBankTransferPayload).bankType === bankType &&
    Array.isArray((value as QuestionBankTransferPayload).questions)
  );
}

function downloadJson(data: unknown, filename: string) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
  );
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
