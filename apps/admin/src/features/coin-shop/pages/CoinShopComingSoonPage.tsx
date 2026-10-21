import { LockKeyhole, Store } from "lucide-react";
import { AchievementCountdown } from "../../achievements";
import { AttendanceCoin } from "../../../shared/ui/attendance-coin";
import { COIN_SHOP_RELEASE_AT } from "../components/CoinShopTeaser";

const futureItems = ["لوازم مدرسه", "امتیازهای ویژه", "هدیه‌های فرهنگی"];

/** Preview page deliberately has no purchasing controls until inventory and ledger APIs exist. */
export function CoinShopComingSoonPage() {
  return (
    <main
      dir="rtl"
      className="mx-auto max-w-5xl rounded-3xl bg-slate-950 p-4 text-white shadow-2xl sm:p-7"
    >
      <section
        className="border-b border-white/15 pb-6 text-center"
        aria-labelledby="coin-shop-title"
      >
        <span className="mx-auto grid size-14 place-items-center rounded-2xl border border-amber-200/25 bg-amber-300/10">
          <AttendanceCoin className="size-10 object-contain" />
        </span>
        <p className="mt-4 text-xs font-black tracking-[0.18em] text-amber-200/80">ویژگی آینده</p>
        <h1 id="coin-shop-title" className="mt-2 text-2xl font-black sm:text-3xl">
          بازار سکه
        </h1>
        <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-slate-300">
          دانش‌آموزان به‌زودی می‌توانند سکه‌های حضور و رفتارشان را برای آیتم‌های منتخب مدرسه خرج
          کنند.
        </p>
        <AchievementCountdown
          releaseAt={COIN_SHOP_RELEASE_AT}
          ariaLabel="زمان باقی‌مانده تا باز شدن بازار سکه؛ روز، ساعت، دقیقه، ثانیه"
        />
      </section>

      <section className="mt-6" aria-labelledby="coin-shop-preview-title">
        <div className="flex items-center gap-2">
          <Store size={18} className="text-amber-200" aria-hidden="true" />
          <h2 id="coin-shop-preview-title" className="text-sm font-black">
            آنچه در راه است
          </h2>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          {futureItems.map((item) => (
            <article key={item} className="rounded-2xl border border-white/10 bg-white/[0.06] p-4">
              <span className="grid size-10 place-items-center rounded-xl bg-white/10 text-amber-200">
                <LockKeyhole size={18} aria-hidden="true" />
              </span>
              <h3 className="mt-4 text-sm font-black">{item}</h3>
              <p className="mt-1 text-xs leading-6 text-slate-300">
                جزئیات و قیمت سکه‌ها هنگام انتشار اعلام می‌شود.
              </p>
              <span className="mt-3 inline-flex rounded-full border border-white/10 bg-black/30 px-2 py-1 text-[10px] font-bold text-slate-400">
                به‌زودی
              </span>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
