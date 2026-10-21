import type { Meta, StoryObj } from "@storybook/react-vite";

import { componentCatalog } from "./component-catalog.generated";

const meta = {
  title: "Bastak School/Page studio",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllAdminPages: Story = {
  render: () => {
    const pages = componentCatalog.filter((entry) => entry.kind === "page");
    const withStories = pages.filter((entry) => entry.storyPath).length;
    return (
      <main className="mx-auto grid max-w-6xl gap-6 p-6 text-[rgb(var(--color-ink))]" dir="rtl">
        <header className="grid gap-2">
          <p className="text-sm font-bold text-brand">Storybook-first Admin UX</p>
          <h1 className="text-2xl font-black">استودیوی صفحات مدیریت</h1>
          <p className="max-w-3xl text-sm leading-6 text-slate-600 dark:text-slate-300">
            هر صفحهٔ مدیریت در این فهرست منبع ثبت شده است. توسعهٔ تجربهٔ کاربری از داستان‌های صفحه
            با دادهٔ قطعی انجام می‌شود؛ تا پیش از آماده‌شدن fixture، صفحه به‌جای تماس با API واقعی
            فقط به‌عنوان نیازمند fixture نشان داده می‌شود.
          </p>
          <p className="text-sm font-bold">
            {withStories.toLocaleString("fa-IR")} از {pages.length.toLocaleString("fa-IR")} صفحه
            داستان تعاملی دارند.
          </p>
        </header>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((page) => (
            <li
              key={page.sourcePath}
              className="rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4"
            >
              <code dir="ltr" className="block break-all text-xs text-slate-500">
                {page.sourcePath}
              </code>
              <p className="mt-3 text-sm font-bold">{page.exports.join("، ")}</p>
              <span
                className={
                  page.storyPath
                    ? "mt-3 inline-block text-xs font-bold text-emerald-700"
                    : "mt-3 inline-block text-xs font-bold text-amber-700"
                }
              >
                {page.storyPath ? "آمادهٔ طراحی در Storybook" : "نیازمند fixture قطعی"}
              </span>
            </li>
          ))}
        </ul>
      </main>
    );
  },
};
