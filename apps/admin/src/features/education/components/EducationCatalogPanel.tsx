import { useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, CheckCircle2, Pencil, Search, Upload, Users } from "lucide-react";
import { Button, Card, Field, Input, LoadingState, Textarea } from "../../../shared/ui/ui";
import { notify } from "../../../shared/ui/notifications";
import { useEducationCatalogCopy } from "../model/education-catalog-copy";
import {
  commitEducationImport,
  createEducationBook,
  getEducationBookImpact,
  getManagedBooks,
  previewEducationImport,
  publishEducationBook,
  updateEducationBook,
  type EducationBookInput,
  type ManagedEducationBook,
} from "../api/education-catalog.api";

const blank = (defaults: {
  schoolYear: string;
  branch: string;
  track: string;
  category: string;
}): EducationBookInput => ({
  id: "",
  schoolYear: defaults.schoolYear,
  grade: 10,
  titleFa: "",
  titleEn: "",
  country: "IR",
  level: "second",
  branch: defaults.branch,
  track: defaults.track,
  category: defaults.category,
  appliesTo: [],
  notes: "",
});

export function EducationCatalogPanel({
  canManage,
  canPublish,
}: {
  canManage: boolean;
  canPublish: boolean;
}) {
  const copy = useEducationCatalogCopy();
  const client = useQueryClient();
  const books = useQuery({
    queryKey: ["education-catalog", "managed-books"],
    queryFn: getManagedBooks,
  });
  const [draft, setDraft] = useState<EducationBookInput>(() => blank(copy.newBookDefaults));
  const [editing, setEditing] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [state, setState] = useState<"ALL" | ManagedEducationBook["state"]>("ALL");
  const [importText, setImportText] = useState("[]");
  const [importRows, setImportRows] = useState<EducationBookInput[] | null>(null);
  const refresh = () => void client.invalidateQueries({ queryKey: ["education-catalog"] });
  const stateLabel = (value: ManagedEducationBook["state"]) =>
    value === "PUBLISHED" ? copy.published : value === "ARCHIVED" ? copy.archived : copy.draft;
  const save = useMutation({
    mutationFn: () =>
      editing
        ? updateEducationBook(editing, { ...draft, id: undefined })
        : createEducationBook(draft),
    onSuccess: () => {
      refresh();
      setDraft(blank(copy.newBookDefaults));
      setEditing(null);
      notify(copy.saved, "success");
    },
    onError: () => notify(copy.saveFailed, "error"),
  });
  const publish = useMutation({
    mutationFn: publishEducationBook,
    onSuccess: () => {
      refresh();
      notify(copy.publishedSuccess, "success");
    },
    onError: () => notify(copy.publishFailed, "error"),
  });
  const archive = useMutation({
    mutationFn: (id: string) => updateEducationBook(id, { state: "ARCHIVED" }),
    onSuccess: () => {
      refresh();
      notify(copy.archivedSuccess, "success");
    },
    onError: () => notify(copy.archiveFailed, "error"),
  });
  const impact = useMutation({
    mutationFn: getEducationBookImpact,
    onSuccess: (result) =>
      notify(copy.audienceImpact(result.affectedStudents, copy.locale), "success"),
    onError: () => notify(copy.audienceFailed, "error"),
  });
  const preview = useMutation({
    mutationFn: () => {
      const rows = JSON.parse(importText) as EducationBookInput[];
      setImportRows(rows);
      return previewEducationImport(rows);
    },
    onError: () => notify(copy.invalidJson, "error"),
  });
  const commit = useMutation({
    mutationFn: () => commitEducationImport(importRows || []),
    onSuccess: () => {
      refresh();
      setImportRows(null);
      notify(copy.imported, "success");
    },
    onError: () => notify(copy.importFailed, "error"),
  });
  const rows = useMemo(
    () =>
      (books.data || []).filter(
        (book) =>
          (state === "ALL" || book.state === state) &&
          `${book.titleFa} ${book.titleEn || ""} ${book.textbookCode || ""} ${book.category} ${book.grade}`
            .toLocaleLowerCase(copy.locale)
            .includes(query.trim().toLocaleLowerCase(copy.locale)),
      ),
    [books.data, copy.locale, query, state],
  );
  const edit = (book: ManagedEducationBook) => {
    setEditing(book.id);
    setDraft({ ...book, appliesTo: book.appliesTo || [] });
  };
  const readFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (!Array.isArray(parsed)) throw new Error();
      setImportText(JSON.stringify(parsed, null, 2));
      setImportRows(parsed);
      notify(copy.rowsReady(parsed.length, copy.locale), "success");
    } catch {
      notify(copy.invalidFile, "error");
    }
  };
  if (books.isLoading) return <LoadingState label={copy.loading} />;
  if (books.isError) return <Card className="p-4 text-sm text-red-700">{copy.loadFailed}</Card>;
  return (
    <section className="grid gap-3 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="min-w-0 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex h-10 min-w-52 flex-1 items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm dark:border-slate-700 dark:bg-slate-900">
            <Search size={15} className="text-slate-400" />
            <input
              className="min-w-0 flex-1 bg-transparent outline-none"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={copy.search}
            />
          </label>
          <select
            className="h-10 rounded-lg border border-slate-200 bg-white px-2 text-xs dark:border-slate-700 dark:bg-slate-950"
            value={state}
            onChange={(event) => setState(event.target.value as typeof state)}
          >
            <option value="ALL">{copy.allStates}</option>
            <option value="DRAFT">{copy.draft}</option>
            <option value="PUBLISHED">{copy.published}</option>
            <option value="ARCHIVED">{copy.archived}</option>
          </select>
          <span className="text-xs text-slate-500">
            {rows.length.toLocaleString(copy.locale)} {copy.books}
          </span>
        </div>
        <div className="mt-3 grid gap-1.5">
          {rows.map((book) => (
            <article
              key={book.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 p-2.5 text-sm dark:border-slate-800"
            >
              <div className="min-w-40 flex-1">
                <strong>
                  {copy.locale === "en-US" ? book.titleEn || book.titleFa : book.titleFa}
                </strong>
                <p className="mt-0.5 text-xs text-slate-500">
                  {copy.grade} {book.grade.toLocaleString(copy.locale)} · {book.category} ·{" "}
                  {book.schoolYear}
                  {book.textbookCode ? ` · ${book.textbookCode}` : ""}
                </p>
              </div>
              <span
                className={`rounded px-1.5 py-0.5 text-xs font-bold ${book.state === "PUBLISHED" ? "bg-emerald-50 text-emerald-700" : book.state === "ARCHIVED" ? "bg-slate-100 text-slate-500" : "bg-amber-50 text-amber-700"}`}
              >
                {stateLabel(book.state)}
              </span>
              <div className="flex flex-wrap gap-1">
                {canManage ? (
                  <Button variant="ghost" className="h-8 px-2" onClick={() => edit(book)}>
                    <Pencil size={14} />
                    {copy.edit}
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  className="h-8 px-2"
                  disabled={impact.isPending}
                  onClick={() => impact.mutate(book.id)}
                >
                  <Users size={14} />
                  {copy.audience}
                </Button>
                {canPublish && book.state === "DRAFT" ? (
                  <Button
                    variant="soft"
                    className="h-8 px-2"
                    disabled={publish.isPending}
                    onClick={() => publish.mutate(book.id)}
                  >
                    <Upload size={14} />
                    {copy.publish}
                  </Button>
                ) : null}
                {canManage && book.state !== "ARCHIVED" ? (
                  <Button
                    variant="ghost"
                    className="h-8 px-2 text-red-700"
                    disabled={archive.isPending}
                    onClick={() => archive.mutate(book.id)}
                  >
                    <Archive size={14} />
                    {copy.archive}
                  </Button>
                ) : null}
              </div>
            </article>
          ))}
          {!rows.length ? (
            <p className="py-6 text-center text-sm text-slate-500">{copy.noBooks}</p>
          ) : null}
        </div>
      </Card>
      {canManage ? (
        <div className="grid content-start gap-3">
          <Card className="p-3">
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-sm font-black text-ink">
                {editing ? copy.editBook : copy.addBook}
              </h2>
              {editing ? (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(null);
                    setDraft(blank(copy.newBookDefaults));
                  }}
                >
                  {copy.cancel}
                </Button>
              ) : null}
            </div>
            <div className="mt-3 grid gap-2">
              <Field label={copy.id}>
                <Input
                  disabled={Boolean(editing)}
                  value={draft.id}
                  onChange={(event) => setDraft({ ...draft, id: event.target.value })}
                />
              </Field>
              <Field label={copy.titleFa}>
                <Input
                  value={draft.titleFa}
                  onChange={(event) => setDraft({ ...draft, titleFa: event.target.value })}
                />
              </Field>
              <div className="grid grid-cols-2 gap-2">
                <Field label={copy.schoolYear}>
                  <Input
                    value={draft.schoolYear}
                    onChange={(event) => setDraft({ ...draft, schoolYear: event.target.value })}
                  />
                </Field>
                <Field label={copy.grade}>
                  <Input
                    type="number"
                    min={1}
                    max={12}
                    value={draft.grade}
                    onChange={(event) => setDraft({ ...draft, grade: Number(event.target.value) })}
                  />
                </Field>
              </div>
              <Field label={copy.category}>
                <Input
                  value={draft.category}
                  onChange={(event) => setDraft({ ...draft, category: event.target.value })}
                />
              </Field>
              <details>
                <summary className="cursor-pointer text-xs font-bold text-slate-600">
                  {copy.advanced}
                </summary>
                <div className="mt-2 grid gap-2">
                  <Field label={copy.textbookCode}>
                    <Input
                      dir="ltr"
                      value={draft.textbookCode || ""}
                      onChange={(event) => setDraft({ ...draft, textbookCode: event.target.value })}
                    />
                  </Field>
                  <div className="grid grid-cols-2 gap-2">
                    <Field label={copy.branch}>
                      <Input
                        value={draft.branch}
                        onChange={(event) => setDraft({ ...draft, branch: event.target.value })}
                      />
                    </Field>
                    <Field label={copy.track}>
                      <Input
                        value={draft.track}
                        onChange={(event) => setDraft({ ...draft, track: event.target.value })}
                      />
                    </Field>
                  </div>
                  <Field label={copy.notes}>
                    <Textarea
                      className="min-h-20"
                      value={draft.notes || ""}
                      onChange={(event) => setDraft({ ...draft, notes: event.target.value })}
                    />
                  </Field>
                </div>
              </details>
              <Button
                disabled={!draft.id.trim() || !draft.titleFa.trim() || save.isPending}
                onClick={() => save.mutate()}
              >
                <CheckCircle2 size={15} />
                {copy.save}
              </Button>
            </div>
          </Card>
          <Card className="p-3">
            <h2 className="text-sm font-black text-ink">{copy.bulkImport}</h2>
            <p className="mt-1 text-xs text-slate-500">{copy.bulkDescription}</p>
            <Field label={copy.jsonFile}>
              <Input
                type="file"
                accept="application/json,.json"
                onChange={(event) => void readFile(event)}
              />
            </Field>
            <Field label={copy.bookArray}>
              <Textarea
                dir="ltr"
                className="mt-2 min-h-24"
                value={importText}
                onChange={(event) => setImportText(event.target.value)}
              />
            </Field>
            <div className="mt-2 flex gap-2">
              <Button
                variant="soft"
                size="sm"
                disabled={preview.isPending}
                onClick={() => preview.mutate()}
              >
                {copy.preview}
              </Button>
              {preview.data?.valid ? (
                <Button size="sm" disabled={commit.isPending} onClick={() => commit.mutate()}>
                  {copy.saveDrafts}
                </Button>
              ) : null}
            </div>
            {preview.data ? (
              <p
                className={
                  preview.data.valid ? "mt-2 text-xs text-emerald-700" : "mt-2 text-xs text-red-700"
                }
              >
                {preview.data.valid
                  ? copy.importReady(preview.data.accepted, copy.locale)
                  : preview.data.rows
                      .filter((row) => !row.valid)
                      .slice(0, 3)
                      .map((row) => copy.row(row.row, row.errors.join("، ")))
                      .join(" | ")}
              </p>
            ) : null}
          </Card>
        </div>
      ) : null}
    </section>
  );
}
