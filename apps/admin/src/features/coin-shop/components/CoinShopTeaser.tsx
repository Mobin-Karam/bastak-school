import { LockKeyhole, Store } from "lucide-react";
import { Link } from "react-router-dom";
import { AchievementCountdown, STUDENT_FUTURE_FEATURE_RELEASE_AT } from "../../achievements";
import { AttendanceCoin } from "../../../shared/ui/attendance-coin";

/** Kept as a public alias for existing Coin Shop consumers. */
export const COIN_SHOP_RELEASE_AT = STUDENT_FUTURE_FEATURE_RELEASE_AT;

type CoinShopTeaserProps = {
  audience: "student" | "school";
  className?: string;
};

/** Locked preview only: purchases and inventory remain unavailable until their API is released. */
export function CoinShopTeaser({ audience, className = "" }: CoinShopTeaserProps) {
  const student = audience === "student";
  return (
    <section
      className={`overflow-hidden rounded-3xl border border-amber-200/25 bg-slate-950 p-4 text-white shadow-sm sm:p-5 ${className}`}
      aria-labelledby={`coin-shop-${audience}-title`}
    >
      <div className="grid items-center gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(15rem,.72fr)]">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="grid size-10 shrink-0 place-items-center rounded-2xl border border-amber-200/25 bg-amber-300/10">
              <AttendanceCoin className="size-7 object-contain" />
            </span>
            <div className="min-w-0">
              <p className="text-[10px] font-black tracking-[0.16em] text-amber-200/75">
                ویژگی آینده
              </p>
              <h2
                id={`coin-shop-${audience}-title`}
                className="mt-0.5 text-sm font-black sm:text-base"
              >
                {student ? "بازار سکه‌های من" : "بازار سکه دانش‌آموزان"}
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-xs leading-6 text-slate-300">
            {student
              ? "به‌زودی می‌توانید سکه‌های حضور و رفتار را برای آیتم‌های مدرسه خرج کنید."
              : "به‌زودی دانش‌آموزان می‌توانند سکه‌های حضور و رفتارشان را برای آیتم‌های مدرسه خرج کنند."}
          </p>
          <Link
            to="/admin/coin-shop"
            className="mt-3 inline-flex min-h-10 items-center gap-1 rounded-xl bg-amber-300 px-3 text-xs font-black text-slate-950 transition hover:bg-amber-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
          >
            دیدن بازار آینده <Store size={15} aria-hidden="true" />
          </Link>
        </div>
        <div className="grid gap-3 rounded-2xl border border-white/10 bg-white/[0.06] p-3">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <LockKeyhole size={15} className="text-amber-200/75" aria-hidden="true" />
            تا باز شدن بازار سکه
          </div>
          <AchievementCountdown
            compact
            releaseAt={COIN_SHOP_RELEASE_AT}
            ariaLabel="زمان باقی‌مانده تا باز شدن بازار سکه؛ روز، ساعت، دقیقه، ثانیه"
          />
        </div>
      </div>
    </section>
  );
}
