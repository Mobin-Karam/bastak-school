import { MoreHorizontal } from "lucide-react";
import { ViewportPopover } from "../../../shared/ui/popover";
import { useLocale } from "../../../shared/ui/locale";
import { plannerCopy } from "../model/planner-copy";

export function PlannerMoreMenu({
  onClose,
  onPlan,
  onPublish,
  onTransfer,
  onHistory,
  onTemplates,
  canPlan,
  canPublish,
  canTransfer,
  canHistory,
  canTemplates,
}: {
  onClose: () => void;
  onPlan: () => void;
  onPublish: (value: boolean) => void;
  onTransfer: () => void;
  onHistory: () => void;
  onTemplates: () => void;
  canPlan: boolean;
  canPublish: boolean;
  canTransfer: boolean;
  canHistory: boolean;
  canTemplates: boolean;
}) {
  const { language } = useLocale();
  const copy = plannerCopy(language);
  return (
    <ViewportPopover
      width={240}
      align="end"
      className="p-2"
      trigger={({ ref, onClick, ...props }) => (
        <button
          ref={ref}
          onClick={onClick}
          {...props}
          type="button"
          className="
            grid
            size-9
            place-items-center
            rounded-xl
            text-slate-500
            transition
            hover:bg-slate-100
            hover:text-slate-900

            dark:text-slate-400
            dark:hover:bg-slate-800
            dark:hover:text-white
          "
        >
          <MoreHorizontal size={18} />
        </button>
      )}
    >
      <div className="space-y-1">
        {canPlan ? (
          <button
            className="
            block
            w-full
            rounded-xl
            px-3
            py-2
            text-start
            text-sm
            transition
            hover:bg-slate-100
            dark:hover:bg-slate-800
          "
            onClick={() => {
              onPlan();
              onClose();
            }}
          >
            {copy.planSettings}
          </button>
        ) : null}

        {canPublish ? (
          <button
            className="
            block
            w-full
            rounded-xl
            px-3
            py-2
            text-start
            text-sm
            transition
            hover:bg-slate-100
            dark:hover:bg-slate-800
          "
            onClick={() => {
              onPublish(true);
              onClose();
            }}
          >
            {copy.publishRange}
          </button>
        ) : null}

        {canPublish ? (
          <button
            className="
            block
            w-full
            rounded-xl
            px-3
            py-2
            text-start
            text-sm
            transition
            hover:bg-slate-100
            dark:hover:bg-slate-800
          "
            onClick={() => {
              onPublish(false);
              onClose();
            }}
          >
            {copy.unpublishRange}
          </button>
        ) : null}

        {canTransfer ? (
          <button
            className="
            block
            w-full
            rounded-xl
            px-3
            py-2
            text-start
            text-sm
            transition
            hover:bg-slate-100
            dark:hover:bg-slate-800
          "
            onClick={() => {
              onTransfer();
              onClose();
            }}
          >
            {copy.importExportJson}
          </button>
        ) : null}

        {canHistory ? (
          <button
            className="block w-full rounded-xl px-3 py-2 text-start text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => {
              onHistory();
              onClose();
            }}
          >
            {copy.shareHistory}
          </button>
        ) : null}

        {canTemplates ? (
          <button
            className="block w-full rounded-xl px-3 py-2 text-start text-sm transition hover:bg-slate-100 dark:hover:bg-slate-800"
            onClick={() => {
              onTemplates();
              onClose();
            }}
          >
            {copy.templateLibrary}
          </button>
        ) : null}
      </div>
    </ViewportPopover>
  );
}
