import { LockKeyhole, Medal } from "lucide-react";
import { AchievementCountdown } from "../components/AchievementCountdown";

const achievements = [
  ["knowledge", "دانش‌پژوه"],
  ["attendance", "حضور منظم"],
  ["top-student", "دانش‌آموز برتر"],
  ["consistency", "پیوستگی حضور"],
  ["reader", "مطالعه مستمر"],
  ["participation", "مشارکت فعال"],
  ["next-level", "سطح بالاتر"],
  ["top-score", "گردآورنده سکه"],
  ["prayer", "پایبندی به نماز"],
  ["quran", "حافظ قرآن"],
  ["growth", "رشد علمی"],
  ["teamwork", "همکاری و کار گروهی"],
  ["respect", "احترام و اخلاق"],
  ["positive-behavior", "رفتار مثبت"],
  ["communication", "ارتباط مؤثر"],
  ["help-others", "کمک به دیگران"],
  ["personal-growth", "پیشرفت شخصی"],
  ["tasks", "انجام تکالیف"],
  ["time-management", "مدیریت زمان"],
  ["creativity", "خلاقیت و ایده‌پردازی"],
  ["books", "کتاب‌خوان"],
  ["teacher-choice", "انتخاب استاد"],
  ["environment", "مراقبت از محیط"],
  ["academic-progress", "پیشرفت تحصیلی"],
  ["school-service", "خدمت به مدرسه"],
  ["course-completion", "تکمیل درس"],
  ["problem-solving", "حل مسئله"],
  ["special-achievement", "دستاورد ویژه"],
  ["good-friend", "دوست خوب"],
  ["responsibility", "مسئولیت‌پذیری"],
  ["order", "ترتیب و نظم"],
  ["religious-activities", "فعالیت‌های دینی"],
] as const;

/** A locked preview until the achievement rules and student data are ready to ship. */
export function AchievementsComingSoonPage() {
  return (
    <main
      dir="rtl"
      className="mx-auto max-w-6xl rounded-3xl bg-slate-950 p-4 text-white shadow-2xl sm:p-7"
    >
      <section
        className="border-b border-white/15 pb-6 text-center"
        aria-labelledby="achievements-title"
      >
        <span className="mx-auto grid size-12 place-items-center rounded-2xl border border-white/25 bg-white/10">
          <Medal size={24} aria-hidden="true" />
        </span>
        <p className="mt-4 text-xs font-black tracking-[0.18em] text-slate-300">ویژگی آینده</p>
        <h1 id="achievements-title" className="mt-2 text-2xl font-black sm:text-3xl">
          دستاوردهای تو
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">
          نشان‌ها و مسیر پیشرفت شما به‌زودی فعال می‌شوند.
        </p>

        <AchievementCountdown />
      </section>

      <section className="mt-6" aria-label="فهرست نشان‌های قفل‌شده">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
          {achievements.map(([asset, title]) => (
            <article
              key={asset}
              className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.06] p-3 text-center"
            >
              <img
                src={`/images/achievements/${asset}.webp`}
                alt=""
                className="mx-auto aspect-square w-full max-w-28 object-contain grayscale opacity-60"
                loading="lazy"
              />
              <h2 className="mt-1 text-xs font-bold text-slate-200">{title}</h2>
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-bold text-slate-400">
                <LockKeyhole size={11} aria-hidden="true" /> به‌زودی
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
