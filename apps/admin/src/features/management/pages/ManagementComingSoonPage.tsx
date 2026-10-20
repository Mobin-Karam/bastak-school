import { Landmark, LockKeyhole } from "lucide-react";

/** Principal-only preview until the unified management workspace is ready to ship. */
export function ManagementComingSoonPage() {
  return (
    <main
      dir="rtl"
      className="mx-auto max-w-3xl rounded-3xl bg-slate-950 p-6 text-white shadow-2xl sm:p-10"
    >
      <section className="text-center" aria-labelledby="management-title">
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-white/25 bg-white/10">
          <Landmark size={28} aria-hidden="true" />
        </span>
        <p className="mt-5 text-xs font-black tracking-[0.18em] text-slate-300">ویژگی آینده</p>
        <h1 id="management-title" className="mt-2 text-2xl font-black sm:text-3xl">
          میز مدیریت مدرسه
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">
          ابزارهای یکپارچه مدیریت مدرسه به‌زودی برای مدیر مدرسه فعال می‌شوند.
        </p>
        <span className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2 text-xs font-bold text-slate-200">
          <LockKeyhole size={14} aria-hidden="true" /> به‌زودی
        </span>
      </section>
    </main>
  );
}
