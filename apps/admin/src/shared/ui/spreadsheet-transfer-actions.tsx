import { Download, FileUp, FileSpreadsheet } from "lucide-react";
import { useRef } from "react";
import { useLocale } from "./locale";
import { Button } from "./ui";

/** Shared, responsive actions for organization-scoped Excel workflows. */
export function SpreadsheetTransferActions({
  canImport,
  canExport,
  busy = false,
  onImport,
  onExport,
  onTemplate,
}: {
  canImport: boolean;
  canExport: boolean;
  busy?: boolean;
  onImport: (file?: File) => void;
  onExport: () => void;
  onTemplate: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { language } = useLocale();
  const fa = language === "fa";
  return (
    <div
      className="grid grid-cols-3 gap-2 sm:flex sm:flex-wrap"
      role="group"
      aria-label={fa ? "عملیات Excel" : "Excel actions"}
    >
      {canImport ? (
        <Button variant="soft" disabled={busy} onClick={() => inputRef.current?.click()}>
          <FileUp size={16} aria-hidden="true" />
          {fa ? "ورود" : "Import"}
        </Button>
      ) : null}
      {canImport ? (
        <Button variant="ghost" disabled={busy} onClick={onTemplate}>
          <FileSpreadsheet size={16} aria-hidden="true" />
          {fa ? "نمونه" : "Get sample"}
        </Button>
      ) : null}
      {canExport ? (
        <Button variant="soft" disabled={busy} onClick={onExport}>
          <Download size={16} aria-hidden="true" />
          {fa ? "خروجی" : "Export"}
        </Button>
      ) : null}
      <input
        ref={inputRef}
        className="sr-only"
        type="file"
        accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        onChange={(event) => {
          onImport(event.target.files?.[0]);
          event.target.value = "";
        }}
      />
    </div>
  );
}
