import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { currentAppDomain } from "../../../../app/routing/portal-domain";
import { useAuth } from "../../../identity/auth";
import "./student-portal-onboarding.css";

const ONBOARDING_VERSION = "v1";
const PAGE_COUNT = 5;
const SWIPE_THRESHOLD = 48;

function completionKey(userId: string) {
  return `bastak-student-portal-onboarding:${ONBOARDING_VERSION}:${userId}`;
}

function wasCompleted(userId: string) {
  try {
    return window.localStorage.getItem(completionKey(userId)) === "1";
  } catch {
    return false;
  }
}

function rememberCompletion(userId: string) {
  try {
    window.localStorage.setItem(completionKey(userId), "1");
  } catch {
    // Storage can be unavailable in private or restricted browser contexts.
  }
}

/** A per-student welcome tour shown only by the dedicated student portal. */
export function StudentPortalOnboarding() {
  const auth = useAuth();
  const userId = auth.user?.id;
  const eligible =
    auth.activeRole === "STUDENT" && currentAppDomain() === "student" && Boolean(userId);
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState(
    () => Boolean(userId) && eligible && !wasCompleted(userId ?? ""),
  );
  const touchStart = useRef<number | null>(null);

  useEffect(() => {
    setPage(0);
    setOpen(Boolean(userId) && eligible && !wasCompleted(userId ?? ""));
  }, [eligible, userId]);

  const complete = useCallback(() => {
    if (userId) rememberCompletion(userId);
    setOpen(false);
  }, [userId]);

  const goTo = useCallback((nextPage: number) => {
    setPage(Math.min(Math.max(nextPage, 0), PAGE_COUNT - 1));
  }, []);

  const title = useMemo(() => `راهنمای شروع، صفحه ${page + 1} از ${PAGE_COUNT}`, [page]);

  if (!open || !userId) return null;

  return (
    <div
      className="student-onboarding"
      role="dialog"
      aria-modal="true"
      aria-label={title}
      dir="rtl"
    >
      <section className="student-onboarding__sheet">
        <div
          className="student-onboarding__viewport"
          aria-live="polite"
          onTouchStart={(event) => {
            touchStart.current = event.changedTouches[0]?.clientX ?? null;
          }}
          onTouchEnd={(event) => {
            const start = touchStart.current;
            touchStart.current = null;
            const end = event.changedTouches[0]?.clientX;
            if (start === null || end === undefined) return;
            const distance = end - start;
            if (Math.abs(distance) < SWIPE_THRESHOLD) return;
            if (distance < 0 && page < PAGE_COUNT - 1) goTo(page + 1);
            if (distance > 0 && page > 0) goTo(page - 1);
          }}
        >
          <div
            className="student-onboarding__track"
            style={{ transform: `translateX(-${page * 100}%)` }}
          >
            {Array.from({ length: PAGE_COUNT }, (_, index) => (
              <figure
                className="student-onboarding__slide"
                key={index}
                aria-hidden={index !== page}
              >
                <img
                  src={`/images/onboarding/page-${index + 1}.png`}
                  alt={index === page ? `تصویر راهنمای شروع، صفحه ${index + 1}` : ""}
                  width={1024}
                  height={1536}
                  draggable={false}
                />
              </figure>
            ))}
          </div>
        </div>

        <nav className="student-onboarding__controls" aria-label="کنترل‌های راهنمای شروع">
          <div className="student-onboarding__dots" role="tablist" aria-label="صفحه‌های راهنما">
            {Array.from({ length: PAGE_COUNT }, (_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-selected={index === page}
                aria-label={`رفتن به صفحه ${index + 1}`}
                className="student-onboarding__dot"
                onClick={() => goTo(index)}
              />
            ))}
          </div>

          <div className="student-onboarding__actions">
            {" "}
            <button
              type="button"
              className="student-onboarding__button student-onboarding__button--primary"
              onClick={() => (page === PAGE_COUNT - 1 ? complete() : goTo(page + 1))}
            >
              <ChevronRight size={20} aria-hidden="true" />
              {page === PAGE_COUNT - 1 ? "شروع ورود به سامانه" : "ادامه"}
            </button>
            <button
              type="button"
              className="student-onboarding__button student-onboarding__button--secondary"
              onClick={() => goTo(page - 1)}
              disabled={page === 0}
            >
              بازگشت
              <ChevronLeft size={20} aria-hidden="true" />
            </button>
          </div>
        </nav>
      </section>
    </div>
  );
}
