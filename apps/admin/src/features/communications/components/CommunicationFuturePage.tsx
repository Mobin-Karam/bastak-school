import { ArrowRight, BellRing, Clock3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

import { Button, Card } from "../../../shared/ui/ui";

export function CommunicationFuturePage({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const navigate = useNavigate();

  return (
    <main
      className="mx-auto grid min-h-[min(70dvh,42rem)] w-full max-w-3xl place-items-center px-2 py-6 sm:px-4"
      dir="rtl"
    >
      <Card className="relative w-full overflow-hidden border-brand/20 p-6 text-center sm:p-10">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-l from-brand via-sky-400 to-emerald-400" />
        <span className="mx-auto grid size-16 place-items-center rounded-3xl bg-brand/10 text-brand shadow-sm">
          <BellRing size={30} aria-hidden="true" />
        </span>
        <div className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
          <Clock3 size={14} aria-hidden="true" />
          برای استفاده در آینده
        </div>
        <h1 className="mt-4 text-2xl font-black text-ink sm:text-3xl">{title}</h1>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
          {description}
        </p>
        <p className="mt-2 text-sm font-bold text-brand">در آینده به این بخش برمی‌گردیم.</p>
        <Button className="mt-6" variant="soft" onClick={() => navigate(-1)}>
          <ArrowRight size={16} aria-hidden="true" />
          بازگشت به صفحه قبل
        </Button>
      </Card>
    </main>
  );
}
