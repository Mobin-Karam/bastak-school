import type { Meta, StoryObj } from "@storybook/react-vite";
import { useMemo, useState } from "react";

import { componentCatalog } from "./component-catalog.generated";

const meta = {
  title: "Bastak School/Component catalog",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

function Catalog() {
  const [query, setQuery] = useState("");
  const [onlyInteractive, setOnlyInteractive] = useState(false);
  const entries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return componentCatalog.filter((entry) => {
      const haystack = `${entry.sourcePath} ${entry.exports.join(" ")}`.toLowerCase();
      return (!normalized || haystack.includes(normalized)) && (!onlyInteractive || entry.storyPath);
    });
  }, [onlyInteractive, query]);

  return (
    <main className="mx-auto grid max-w-6xl gap-6 p-6 text-[rgb(var(--color-ink))]" dir="rtl">
      <header className="grid gap-2">
        <p className="text-sm font-bold text-brand">مدرسه دینی سلطان العلماء بستک</p>
        <h1 className="text-2xl font-black">فهرست اجزای رابط کاربری</h1>
        <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
          این فهرست از کد منبع تولید می‌شود. «داستان تعاملی» یعنی نمونهٔ ایزوله با دادهٔ واقعی‌نما
          موجود است؛ اجزای متصل به مجوز، API یا جریان‌های دامنه تا زمان تعریف fixture صادقانه به‌عنوان
          نیازمند داستان علامت می‌خورند.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-3">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="جست‌وجوی مسیر یا نام جزء…"
          className="min-w-56 flex-1 rounded-lg border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand"
        />
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input
            type="checkbox"
            checked={onlyInteractive}
            onChange={(event) => setOnlyInteractive(event.target.checked)}
          />
          فقط داستان‌های تعاملی
        </label>
        <span className="text-xs text-slate-500">{entries.length.toLocaleString("fa-IR")} ماژول</span>
      </div>

      <ul className="grid gap-3 sm:grid-cols-2">
        {entries.map((entry) => (
          <li key={entry.sourcePath} className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <code dir="ltr" className="break-all text-xs text-slate-500">{entry.sourcePath}</code>
              <span className={entry.storyPath ? "shrink-0 text-xs font-bold text-emerald-700" : "shrink-0 text-xs font-bold text-amber-700"}>
                {entry.storyPath ? "تعاملی" : "نیازمند fixture"}
              </span>
            </div>
            <p className="mt-3 text-sm font-bold">{entry.exports.join("، ")}</p>
            {entry.storyPath ? <code dir="ltr" className="mt-2 block text-xs text-slate-500">{entry.storyPath}</code> : null}
          </li>
        ))}
      </ul>
    </main>
  );
}

export const AllComponents: Story = { render: () => <Catalog /> };
