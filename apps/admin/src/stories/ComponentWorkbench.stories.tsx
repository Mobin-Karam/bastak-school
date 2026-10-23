import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Component,
  createElement,
  useEffect,
  useMemo,
  useState,
  type ErrorInfo,
  type ReactNode,
} from "react";

import { StorybookApiFixture } from "../../.storybook/fixtures/api";
import { StorybookAuthProvider } from "../../.storybook/fixtures/auth";
import { AdaptiveSelect } from "../shared/ui/adaptive-select";
import type { RoleCode } from "../shared/types/domain";
import { componentCatalog, type ComponentCatalogEntry } from "./component-catalog.generated";

const componentModules = import.meta.glob([
  "../**/*.tsx",
  "!../**/*.test.tsx",
  "!../**/*.stories.tsx",
  // This separately built legacy package stays outside the Admin Storybook
  // workbench until its local UI API is migrated into the current boundary.
  "!../features/identity/registration/**",
]) as Record<string, () => Promise<Record<string, unknown>>>;

const meta = {
  title: "Bastak School/Component workbench",
  parameters: { layout: "fullscreen" },
  tags: ["autodocs"],
} satisfies Meta;
export default meta;
type Story = StoryObj<typeof meta>;

class PreviewBoundary extends Component<{ children: ReactNode }, { error: string | null }> {
  state = { error: null };
  static getDerivedStateFromError(error: unknown) {
    return { error: error instanceof Error ? error.message : "خطای ناشناخته" };
  }
  componentDidCatch(_: unknown, __: ErrorInfo) {}
  render() {
    if (this.state.error) {
      return (
        <section className="max-w-xl rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          <h2 className="font-black">این جزء به fixture اختصاصی نیاز دارد</h2>
          <p className="mt-2 leading-6">{this.state.error}</p>
        </section>
      );
    }
    return this.props.children;
  }
}

function firstEntry(entries: readonly ComponentCatalogEntry[]) {
  return entries[0];
}

export function ComponentWorkbench({
  entries = componentCatalog,
  title = "کارگاه اجزا",
  description = "همهٔ اجزای صادرشده از کد منبع را در همین محیط بررسی کنید. اجزای دارای props یا دادهٔ دامنه، خطای fixture را آشکارا نمایش می‌دهند.",
  role = "SCHOOL_ADMIN",
  capabilities,
}: {
  entries?: readonly ComponentCatalogEntry[];
  title?: string;
  description?: string;
  role?: RoleCode;
  capabilities?: readonly string[];
}) {
  const [selectedPath, setSelectedPath] = useState<string>(
    () => firstEntry(entries)?.sourcePath ?? "",
  );
  const selected = useMemo(
    () => entries.find((entry) => entry.sourcePath === selectedPath) ?? firstEntry(entries),
    [entries, selectedPath],
  );
  const [selectedExport, setSelectedExport] = useState(selected?.exports[0] ?? "");
  const [component, setComponent] = useState<unknown>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => setSelectedExport(selected?.exports[0] ?? ""), [selected]);
  useEffect(() => {
    if (!selected) {
      setLoadError("جزئی برای نمایش در این مجموعه پیدا نشد.");
      return undefined;
    }
    let active = true;
    setComponent(null);
    setLoadError(null);
    const load = componentModules[`../${selected.sourcePath}`];
    if (!load) {
      setLoadError("ماژول Storybook برای این مسیر پیدا نشد.");
      return undefined;
    }
    void load()
      .then((module) => active && setComponent(module[selectedExport] ?? null))
      .catch(
        (error) =>
          active && setLoadError(error instanceof Error ? error.message : "بارگذاری ناموفق بود."),
      );
    return () => {
      active = false;
    };
  }, [selected, selectedExport]);

  return (
    <div
      className="grid min-h-screen grid-cols-[minmax(16rem,24rem)_1fr] bg-paper text-[rgb(var(--color-ink))]"
      dir="rtl"
    >
      <aside className="border-s border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-4">
        <h1 className="text-lg font-black">{title}</h1>
        <p className="mt-2 text-xs leading-5 text-slate-500">{description}</p>
        <AdaptiveSelect
          value={selectedPath}
          onChange={(event) => setSelectedPath(event.target.value)}
          className="mt-4 w-full rounded border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-2 text-xs"
          dir="ltr"
        >
          {entries.map((entry) => (
            <option key={entry.sourcePath} value={entry.sourcePath}>
              {entry.kind === "page" ? "[page] " : ""}
              {entry.sourcePath}
            </option>
          ))}
        </AdaptiveSelect>
        <AdaptiveSelect
          value={selectedExport}
          onChange={(event) => setSelectedExport(event.target.value)}
          className="mt-2 w-full rounded border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-muted))] p-2 text-xs"
          dir="ltr"
        >
          {(selected?.exports ?? []).map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </AdaptiveSelect>
      </aside>
      <main className="min-w-0 p-6">
        <p className="text-xs font-bold text-brand" dir="ltr">
          {selected?.sourcePath} · {selectedExport}
        </p>
        <div className="mt-4 rounded-xl border border-[rgb(var(--border-subtle))] bg-[rgb(var(--surface-card))] p-5 shadow-sm">
          {loadError ? (
            <p role="alert" className="text-sm text-rose-700">
              {loadError}
            </p>
          ) : component ? (
            <StorybookApiFixture>
              <StorybookAuthProvider role={role} capabilities={capabilities}>
                <PreviewBoundary key={`${selectedPath}:${selectedExport}`}>
                  {createElement(component as never)}
                </PreviewBoundary>
              </StorybookAuthProvider>
            </StorybookApiFixture>
          ) : (
            <p className="text-sm text-slate-500">در حال بارگذاری جزء…</p>
          )}
        </div>
      </main>
    </div>
  );
}

export const AllComponents: Story = { render: () => <ComponentWorkbench /> };
